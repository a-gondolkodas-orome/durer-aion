import { env } from 'process';

export function getBotCredentials() {
  if (!env.BOT_CREDENTIALS) {
    throw new Error('No BOT_CREDENTIALS supplied! Do set it in the environment');
  }
  return env.BOT_CREDENTIALS;
}


export const relayNames = {
  C: 'relay_c',
  D: 'relay_d',
  E: 'relay_e',
}
