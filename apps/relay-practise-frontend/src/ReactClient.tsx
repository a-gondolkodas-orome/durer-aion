import { ComponentProps, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { relayStrategy, Problem } from "relay-bot";
import { InProgressRelay } from "common-frontend";
import { ClientFactoryRelay } from "./client_factory";
import { isLanguage } from "schemas";
import { findPracticeSet, loadProblemSet } from "./practice-sets";

const description = <p></p>

// The teamName is the id of the practice set the selector picked, so it
// identifies which problem set to load.
export function RelayClient({ teamName }: {
  teamName?: string,
  matchID?: string,
  credentials?: string,
}) {
  const { t, i18n } = useTranslation();
  // The language the match is served in, read once: switching languages
  // mid-match must not rebuild the client, which would restart its bot.
  const [language] = useState(() => isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'hu');
  const ClientWithBot = useMemo(() => {
    if (!teamName) {
      return null;
    }
    let problems: Problem[];
    // loadProblemSet throws on an id the site does not list — reachable through
    // a stale stored teamState, never through the round selector.
    try {
      problems = loadProblemSet(teamName, language);
    } catch {
      return null;
    }
    // The game name ends up in the localStorage key, so every test keeps its own saved match
    const gameName = `relay_${teamName}`;
    // The board gets a button leading back to the round selector
    const Board = (props: ComponentProps<typeof InProgressRelay>) =>
      <InProgressRelay {...props} selectRoundOnEnd />;
    return ClientFactoryRelay(
      gameName,
      Board,
      relayStrategy(problems),
      description,
      findPracticeSet(teamName)?.relay.durationMinutes,
    ).ClientWithBot;
  }, [teamName, language]);

  if (!ClientWithBot) {
    return <p>{t('relay.error.missingTest', { test: teamName })}</p>;
  }
  return <ClientWithBot />;
}
