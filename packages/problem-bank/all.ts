import { createRegistry } from './src/registry';
import * as edition01Final from './banks/edition-01-final';
import * as edition02Final from './banks/edition-02-final';
import * as edition03Final from './banks/edition-03-final';
import * as edition04Final from './banks/edition-04-final';
import * as edition05Final from './banks/edition-05-final';
import * as edition06Final from './banks/edition-06-final';
import * as edition07Final from './banks/edition-07-final';
import * as edition07Local from './banks/edition-07-local';
import * as edition08Final from './banks/edition-08-final';
import * as edition08Local from './banks/edition-08-local';
import * as edition09Final from './banks/edition-09-final';
import * as edition09Local from './banks/edition-09-local';
import * as edition10Final from './banks/edition-10-final';
import * as edition10Local from './banks/edition-10-local';
import * as edition11Final from './banks/edition-11-final';
import * as edition11Local from './banks/edition-11-local';
import * as edition12Final from './banks/edition-12-final';
import * as edition12Local from './banks/edition-12-local';
import * as edition19Online from './banks/edition-19-online';
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
  edition01Final,
  edition02Final,
  edition03Final,
  edition04Final,
  edition05Final,
  edition06Final,
  edition07Final,
  edition07Local,
  edition08Final,
  edition08Local,
  edition09Final,
  edition09Local,
  edition10Final,
  edition10Local,
  edition11Final,
  edition11Local,
  edition12Final,
  edition12Local,
  edition19Online,
  edition20Online,
]);
