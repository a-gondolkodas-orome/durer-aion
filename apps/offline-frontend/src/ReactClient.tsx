import type { StrategyGameKey } from "game/strategy";
import { StrategyWrappers } from "game/bot";
import { strategyClientFor } from "game/client";
import { relayStrategy } from "relay-bot";
import type { CompetitionId, PublicCompetition } from "schemas";
import { dryRunCompetition, dryRunRelay, dryRunStrategy } from "./rehearsed-round";
import { InProgressRelay } from "common-frontend";
import { perStoredSession } from "common-frontend/core";
import { ClientFactory, ClientFactoryRelay } from "./client_factory";
import { useTranslation } from "react-i18next";

const description = <p className="text-justify"></p>

// Named per competition, which keys the saved match apart per competition.
function relayClient(competition: PublicCompetition) {
  const { relay } = competition;
  if (relay === undefined) return null;
  return ClientFactoryRelay(`relay--${competition.id}`, InProgressRelay, relayStrategy(dryRunRelay(competition.id)), description,
    { durationMinutes: relay.durationMinutes }).ClientWithBot;
}

function strategyClient(competition: PublicCompetition) {
  const strategy = dryRunStrategy(competition.id);
  if (strategy === undefined) return null;
  return gameClient(strategy.gameId as StrategyGameKey, competition.id, strategy.durationMinutes);
}

// Generic over the game, so that its rules, board and bot are one game's.
function gameClient<K extends StrategyGameKey>(gameId: K, competitionId: CompetitionId, durationMinutes: number) {
  const { game, board, description } = strategyClientFor(gameId);
  return ClientFactory({ ...game, name: `strategy--${competitionId}` }, board, StrategyWrappers[gameId](), description,
    { durationMinutes }).ClientWithBot;
}

// Built per stored session, not per page, so the next team logging in on this
// tab starts its own match (perStoredSession says why). Keyed by id, since the
// stored team state, and with it the competition, is read afresh each time.
const relayClientOfSession = perStoredSession((id: CompetitionId) => {
  const competition = dryRunCompetition(id);
  return competition ? relayClient(competition) : null;
});
const strategyClientOfSession = perStoredSession((id: CompetitionId) => {
  const competition = dryRunCompetition(id);
  return competition ? strategyClient(competition) : null;
});

// The chooser offers only the matches the team's competition has.
function NoMatch() {
  const { t } = useTranslation();
  return <p>{t('relay.error.noMatch')}</p>;
}

export function RelayClient({ competition }: { competition?: PublicCompetition | null }) {
  const Client = competition ? relayClientOfSession(competition.id) : null;
  return Client ? <Client /> : <NoMatch />;
}

export function StrategyClient({ competition }: { competition?: PublicCompetition | null }) {
  const Client = competition ? strategyClientOfSession(competition.id) : null;
  return Client ? <Client /> : <NoMatch />;
}
