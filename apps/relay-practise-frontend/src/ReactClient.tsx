import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameRelay } from "game";
import { relayStrategy, Problem } from "strategy";
import { InProgressRelay } from "common-frontend";
import { ClientFactoryRelay } from "./client_factory";
import { loadProblemSet } from "./problems";

const description = <p className="text-justify"></p>

// The teamName is the join code of the selected test (`<year>_<H|D>_<category>`,
// e.g. "12_D_C+"), so it identifies which problem set to load.
export function RelayClient({ teamName }: {
  category?: undefined | 'A' | 'B' | 'C' | 'D' | 'E' | 'C+' | 'D+' | 'E+',
  teamName?: string,
  matchID?: string,
  credentials?: string,
}) {
  const { t } = useTranslation();
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProblems(null);
    setMissing(false);
    if (!teamName) {
      setMissing(true);
      return;
    }
    loadProblemSet(teamName)
      .then(problemSet => { if (!cancelled) setProblems(problemSet); })
      .catch(() => { if (!cancelled) setMissing(true); });
    return () => { cancelled = true; };
  }, [teamName]);

  const ClientWithBot = useMemo(() => {
    if (!teamName || !problems) {
      return null;
    }
    // The game name ends up in the localStorage key, so every test keeps its own saved match
    const gameName = `relay_${teamName.replace(/\+/g, 'p').toLowerCase()}`;
    return ClientFactoryRelay(
      { ...GameRelay, name: gameName },
      InProgressRelay,
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
