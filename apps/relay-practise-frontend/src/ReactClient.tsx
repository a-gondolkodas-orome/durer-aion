import { ComponentProps, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameRelay } from "game";
import { relayStrategy, Problem } from "strategy";
import { InProgressRelay } from "common-frontend";
import { ClientFactoryRelay } from "./client_factory";
import { loadProblemSet } from "./problems";

const description = <p></p>

// The teamName is the join code of the selected test (`<year>_<H|D>_<category>`,
// e.g. "12_D_C+"), so it identifies which problem set to load.
export function RelayClient({ teamName }: {
  teamName?: string,
  matchID?: string,
  credentials?: string,
}) {
  const { t } = useTranslation();
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setProblems(null);
    setMissing(false);
    if (!teamName) {
      setMissing(true);
      return;
    }
    // loadProblemSet throws on a code with no bundled set — reachable through a
    // stale stored teamState, never through the round selector.
    try {
      setProblems(loadProblemSet(teamName));
    } catch {
      setMissing(true);
    }
  }, [teamName]);

  const ClientWithBot = useMemo(() => {
    if (!teamName || !problems) {
      return null;
    }
    // The game name ends up in the localStorage key, so every test keeps its own saved match
    const gameName = `relay_${teamName.replace(/\+/g, 'p').toLowerCase()}`;
    // The board gets the problem set's max points (so the end table shows all
    // of its tasks) and a button leading back to the round selector
    const Board = (props: ComponentProps<typeof InProgressRelay>) =>
      <InProgressRelay {...props}
        maxPointsList={problems.map(problem => problem.points)}
        selectRoundOnEnd
      />;
    return ClientFactoryRelay(
      { ...GameRelay, name: gameName },
      Board,
      relayStrategy(problems),
      description,
    ).ClientWithBot;
  }, [teamName, problems]);

  if (missing) {
    return <p>{t('relay.error.missingTest', { test: teamName })}</p>;
  }
  if (!ClientWithBot) {
    return <div>{t('general.loading')}</div>;
  }
  return <ClientWithBot />;
}
