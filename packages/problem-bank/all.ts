import { createRegistry } from './src/registry';
import * as edition20Online from './banks/edition-20-online';

// Every bank, for the live round's server, which serves whichever competition
// a team entered. A site that serves only some, such as the relay practice
// site, builds its own registry from the banks it names instead, so that
// nothing else is bundled into it.
//
// This year's competitions, and the problems only they use, are added in the
// year's private repo until the competition is over (README § Competition
// secrecy); this public one holds rounds that are public already.
export const registry = createRegistry([
  edition20Online,
]);
