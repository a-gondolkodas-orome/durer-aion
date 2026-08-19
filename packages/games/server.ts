// The react-free half of the package, for the competition server: each game's
// rules, bots and hand-out boards, with the .tsx configs (and React) left
// behind. This is the entry the tsup build ships — apps/practice keeps
// reading `index.ts` source through its alias and never loads this one.
export type { CompetitionGame } from './src/competition-game';
export { removeDivisorMultipleCompetition } from './src/remove-divisor-multiple/competition';
export {
  stonesRemoveOneNotTwiceFromLeftCompetition
} from './src/stones-remove-one-not-twice-from-left/competition';
