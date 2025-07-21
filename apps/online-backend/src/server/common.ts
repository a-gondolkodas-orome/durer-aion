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

export const strategyNames = {
  C: 'remove-from-circle_c',
  D: 'remove-from-circle_d',
  E: 'remove-from-circle_e',
}
