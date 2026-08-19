import { playBotTurn, startBoardForAttempt } from 'engine';
import { applyEvent, startBoardIndexForTally } from 'competition';
import type { CompetitionEvent, CompetitionMatchState, CompetitionRejection } from 'competition';
import type { CompetitionGame } from 'games/server';
import type { AppendableEvent } from './match-store';

// The request-independent heart of the v2 strategy routes (strategy-v2.ts):
// everything a request does between auth and persistence, importable without
// koa, sequelize or the bgio server surface — which is also what lets its
// suite run in the buildless CI test job.

type State = CompetitionMatchState<any>;

// What a team may POST: its own intents only, and none of the fields the
// server owns — the board handed out and every timestamp are stamped here,
// never trusted from the wire.
export type StrategyV2WireEvent =
  | { type: 'START_ATTEMPT'; difficulty: 'test' | 'live' }
  | { type: 'CHOOSE_ROLE'; roleIndex: number }
  | { type: 'MOVE'; name: string; args: unknown[] };

const asWireEvent = (raw: unknown): StrategyV2WireEvent | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const event = raw as Record<string, unknown>;
  switch (event.type) {
    case 'START_ATTEMPT':
      return event.difficulty === 'test' || event.difficulty === 'live'
        ? { type: 'START_ATTEMPT', difficulty: event.difficulty }
        : null;
    case 'CHOOSE_ROLE':
      return event.roleIndex === 0 || event.roleIndex === 1
        ? { type: 'CHOOSE_ROLE', roleIndex: event.roleIndex }
        : null;
    case 'MOVE':
      return typeof event.name === 'string' && Array.isArray(event.args)
        ? { type: 'MOVE', name: event.name, args: event.args }
        : null;
    default:
      return null;
  }
};

export type TeamEventOutcome =
  | {
    ok: true;
    state: State;
    // everything this request appends to the log, in play order
    appended: AppendableEvent[];
    // the bot's share of it, for the response — the frontend paces these
    botEvents: CompetitionEvent<any>[];
  }
  | { ok: false; rejection: CompetitionRejection | 'malformedEvent' };

// One team request, played to quiescence: shape-check the wire event, enrich
// it with what the server owns (the board for a live attempt comes off the
// curated list by the hand-out policy), apply it, then play bot turns until
// the team is on turn again or the attempt/match ended. Pure over its inputs
// — `now` included — which is what makes it unit-testable without a clock.
export const applyTeamEventWithBotReplies = (
  state: State,
  raw: unknown,
  game: CompetitionGame<any>,
  category: string,
  now: string
): TeamEventOutcome => {
  const wire = asWireEvent(raw);
  if (!wire) return { ok: false, rejection: 'malformedEvent' };

  let teamEvent: CompetitionEvent<any>;
  if (wire.type === 'START_ATTEMPT') {
    if (wire.difficulty === 'live') {
      const list = game.liveStartBoardsByCategory[category];
      if (!list) {
        throw new Error(`strategy-v2: ${game.gameId} has no live boards for category ${category}`);
      }
      const startBoardIndex = startBoardIndexForTally(state.tally, list.length);
      teamEvent = {
        type: 'START_ATTEMPT', at: now, difficulty: 'live',
        board: startBoardForAttempt(list, startBoardIndex), startBoardIndex,
      };
    } else {
      teamEvent = {
        type: 'START_ATTEMPT', at: now, difficulty: 'test', board: game.generateTestStartBoard(),
      };
    }
  } else if (wire.type === 'CHOOSE_ROLE') {
    teamEvent = { type: 'CHOOSE_ROLE', at: now, roleIndex: wire.roleIndex };
  } else {
    teamEvent = { type: 'MOVE', at: now, actor: 'team', name: wire.name, args: wire.args };
  }

  const applied = applyEvent(state, teamEvent, game.gameplay);
  if (!applied.ok) return { ok: false, rejection: applied.rejection };
  let next = applied.state;

  const appended: AppendableEvent[] = [{ actor: 'team', type: teamEvent.type, payload: teamEvent }];
  const botEvents: CompetitionEvent<any>[] = [];
  // The bot answers within the same request (transport decision: the response
  // carries its moves). Loops rather than plays once, as a guard — a game
  // whose turn order ever hands the bot two turns must not stall the match.
  for (;;) {
    const attempt = next.attempt;
    if (next.finished || !attempt || attempt.core.phase !== 'play') break;
    if (attempt.core.currentPlayer === attempt.roleIndex) break;
    const bot = attempt.difficulty === 'live' ? game.liveBot : game.testBot;
    const { moves } = playBotTurn(attempt.core, game.gameplay, bot);
    for (const move of moves) {
      const botEvent: CompetitionEvent<any> = {
        type: 'MOVE', at: now, actor: 'bot', name: move.move, args: move.args,
      };
      const botApplied = applyEvent(next, botEvent, game.gameplay);
      if (!botApplied.ok) {
        throw new Error(`strategy-v2: bot event rejected: ${botApplied.rejection}`);
      }
      next = botApplied.state;
      botEvents.push(botEvent);
      appended.push({ actor: 'bot', type: 'MOVE', payload: botEvent });
      if (next.finished || next.attempt?.core.phase !== 'play') break;
    }
  }

  return { ok: true, state: next, appended, botEvents };
};

