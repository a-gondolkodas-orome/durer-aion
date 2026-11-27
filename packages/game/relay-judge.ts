// The `game/relay-judge` entry: the relay's judge, which serves a relay's
// problems and checks the team's answers. It holds no problems of its own; the
// host hands it them. The live client does not import it (eslint.config.mjs).
export { judgeProblems, relayStrategy } from './src/games/relay/judge';
export type { Problem } from './src/games/relay/judge';
