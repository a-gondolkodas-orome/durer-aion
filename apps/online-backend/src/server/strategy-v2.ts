import koaBody from 'koa-body';
import * as Router from '@koa/router';
import { nanoid } from 'nanoid';
import type { Server } from 'boardgame.io';
import { createCompetitionMatchState, toClientView } from 'competition';
import type { CompetitionMatchState } from 'competition';
import { TeamsRepository } from './db';
import { TeamModel } from './model';
import { MatchesRepository, MatchModel } from './match-store';
import { applyTeamEventWithBotReplies } from './strategy-v2-core';
import { allowedToStart, checkStaleMatch, closeMatch, endMatchStatus } from './team_manage';
import { getStrategyV2Categories } from './common';
import { strategyV2Games } from './strategy-v2-games';
import { InProgressMatchStatus } from 'schemas';

type State = CompetitionMatchState<any>;

// The v2 strategy round (PR 3.2 of docs/boardgame-io-replacement-plan.md):
// plain HTTP over the packages/engine + packages/competition stack. The
// request-independent heart is applyTeamEventWithBotReplies below, unit-tested
// on its own; the routes wrap it in auth, persistence and status upkeep.

// The same per-team credential GUID every bgio move is signed with today —
// the plan's stated trust level, not a new auth scheme.
const authorizeTeam = async (
  ctx: Server.AppCtx, teams: TeamsRepository, match: MatchModel
): Promise<TeamModel> => {
  const team = (await teams.getTeam({ teamId: match.teamId })) ??
    ctx.throw(500, `Match ${match.matchId} belongs to unknown team ${match.teamId}.`);
  if (ctx.get('X-Team-Credentials') !== team.credentials) {
    ctx.throw(403, 'Wrong or missing X-Team-Credentials.');
  }
  return team;
};

const strategyMatchFor = (team: TeamModel, matchId: string): InProgressMatchStatus | null =>
  team.strategyMatch.state === 'IN PROGRESS' && team.strategyMatch.matchID === matchId
    ? team.strategyMatch
    : null;

export function configureStrategyV2Router(
  router: Router<any, Server.AppCtx>,
  teams: TeamsRepository,
  matches: MatchesRepository
) {
  /**
   * Start a v2 strategy match — the v2 counterpart of /team/:GUID/strategy/play,
   * gated by the STRATEGY_V2_CATEGORIES rollout flag.
   */
  router.post('/api/team/:GUID/strategy/start', koaBody(), async (ctx) => {
    const GUID = ctx.params.GUID;
    const team =
      (await teams.getTeam({ teamId: GUID })) ??
      ctx.throw(404, `Team with {id:${GUID}} not found.`);

    if (!getStrategyV2Categories().includes(team.category)) {
      ctx.throw(403, `Category ${team.category} does not run strategy on v2.`);
    }

    const staleInfo = await checkStaleMatch(team);
    if (staleInfo.isStale) {
      await closeMatch(
        (team[staleInfo.gameState] as InProgressMatchStatus).matchID, teams, ctx.db, matches
      );
    }
    if (!(await allowedToStart(team, 'STRATEGY'))) {
      ctx.throw(403, 'Team is not allowed to start game.');
    }

    const game = strategyV2Games[team.category] ??
      ctx.throw(500, `No v2 strategy game registered for category ${team.category}.`);
    const matchID = nanoid(11);
    const now = new Date();
    const state = createCompetitionMatchState({
      gameId: game.gameId, category: team.category, startAt: now.toISOString(),
    });
    await matches.createMatch({
      matchId: matchID, teamId: team.teamId, kind: 'STRATEGY', gameId: game.gameId, state,
    });
    await team.update({
      pageState: 'STRATEGY',
      strategyMatch: {
        state: 'IN PROGRESS', matchID,
        startAt: now, endAt: new Date(state.clock.endAt),
        engine: 'v2',
      },
    });
    ctx.body = { matchID };
  });

  /**
   * The polling read: client view + server clock, and with ?since=<seq> the
   * events the client lacks. This is also how add-minutes reaches a client —
   * no push, the countdown polls.
   */
  router.get('/api/match/:matchID', koaBody(), async (ctx) => {
    const matchID = ctx.params.matchID;
    const match =
      (await matches.getMatch(matchID)) ?? ctx.throw(404, `Match ${matchID} not found.`);
    await authorizeTeam(ctx, teams, match);

    const sinceParam = ctx.request.query.since;
    const events = sinceParam === undefined ? undefined
      : (await matches.eventsSince(matchID, Number(sinceParam))).map(row => ({
        seq: row.seq, actor: row.actor, type: row.type, payload: row.payload,
      }));

    ctx.body = {
      version: match.version,
      view: toClientView(match.state as State, new Date().toISOString()),
      ...(events && { events }),
    };
  });

  /**
   * A team event: apply, play the bot's answer, persist all of it in one
   * transaction. 409 when the caller's version is stale — re-fetch and retry.
   */
  router.post('/api/match/:matchID/events', koaBody(), async (ctx) => {
    const matchID = ctx.params.matchID;
    const match =
      (await matches.getMatch(matchID)) ?? ctx.throw(404, `Match ${matchID} not found.`);
    const team = await authorizeTeam(ctx, teams, match);

    const body = (ctx.request.body ?? {}) as { knownVersion?: unknown; event?: unknown };
    const { knownVersion } = body;
    if (typeof knownVersion !== 'number') {
      ctx.throw(400, 'Body must be { knownVersion, event }.');
      return;
    }
    if (knownVersion !== match.version) {
      ctx.status = 409;
      ctx.body = { conflict: true, version: match.version };
      return;
    }

    const now = new Date().toISOString();
    const state = match.state as State;
    const game = strategyV2Games[state.category] ??
      ctx.throw(500, `No v2 strategy game registered for match ${matchID}.`);
    const outcome = applyTeamEventWithBotReplies(state, body.event, game, state.category, now);
    if (!outcome.ok) {
      ctx.status = 400;
      ctx.body = { rejection: outcome.rejection };
      return;
    }

    const appendResult = await matches.appendEvents({
      matchId: matchID, knownVersion,
      events: outcome.appended, state: outcome.state,
    });
    if (!appendResult.ok) {
      ctx.status = 409;
      ctx.body = { conflict: true };
      return;
    }

    // The match deciding itself (double win, the clock's grace) closes the
    // team's status in the same request — v2's onFinishedMatch.
    const inProgress = strategyMatchFor(team, matchID);
    if (outcome.state.finished && inProgress) {
      await team.update({
        strategyMatch: await endMatchStatus(inProgress, outcome.state.tally.points),
      });
    }

    ctx.body = {
      version: appendResult.version,
      botEvents: outcome.botEvents,
      view: toClientView(outcome.state, now),
    };
  });
}
