import { env } from 'process';

export function getBotCredentials() {
  if (!env.BOT_CREDENTIALS) {
    throw new Error('No BOT_CREDENTIALS supplied! Do set it in the environment');
  }
  return env.BOT_CREDENTIALS;
}

export function getGameStartAndEndTime() {
  if (!env.GAME_GLOBAL_START_T) {
    throw new Error('No GAME_GLOBAL_START_T supplied! Do set it in the environment');
  }
  if (!env.GAME_GLOBAL_END_T) {
    throw new Error('No GAME_GLOBAL_END_T supplied! Do set it in the environment');
  }
  return {
    globalStartAt: new Date(env.GAME_GLOBAL_START_T),
    globalEndAt: new Date(env.GAME_GLOBAL_END_T),
  };
}

export const relayNames = {
  C: 'relay_c',
  D: 'relay_d',
  E: 'relay_e',
}

// The v2 rollout flag: which team categories start strategy matches on the
// engine+competition stack instead of boardgame.io. Default empty — the v2
// routes exist but nothing reaches them (the dark launch of Phase 3). Read
// per request rather than at startup, so a rehearsal can flip it per process
// restart without ordering surprises.
export function getStrategyV2Categories(): string[] {
  return (env.STRATEGY_V2_CATEGORIES ?? '')
    .split(',')
    .map(category => category.trim())
    .filter(Boolean);
}
