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
  const globalStartAt = new Date(env.GAME_GLOBAL_START_T);
  const globalEndAt = new Date(env.GAME_GLOBAL_END_T);
  if (globalEndAt <= new Date()) {
    throw new Error('GAME_GLOBAL_END_T must be in the future');
  }
  return {
    globalStartAt,
    globalEndAt,
  };
}

export const relayNames = {
  C: 'relay_c',
  D: 'relay_d',
  E: 'relay_e',
}
