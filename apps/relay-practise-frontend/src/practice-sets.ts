import { createRegistry } from "problem-bank";
import * as edition01Final from "problem-bank/banks/edition-01-final";
import * as edition02Final from "problem-bank/banks/edition-02-final";
import * as edition03Final from "problem-bank/banks/edition-03-final";
import * as edition04Final from "problem-bank/banks/edition-04-final";
import * as edition05Final from "problem-bank/banks/edition-05-final";
import * as edition06Final from "problem-bank/banks/edition-06-final";
import * as edition07Final from "problem-bank/banks/edition-07-final";
import * as edition07Local from "problem-bank/banks/edition-07-local";
import * as edition08Final from "problem-bank/banks/edition-08-final";
import * as edition08Local from "problem-bank/banks/edition-08-local";
import * as edition09Final from "problem-bank/banks/edition-09-final";
import * as edition09Local from "problem-bank/banks/edition-09-local";
import * as edition10Final from "problem-bank/banks/edition-10-final";
import * as edition10Local from "problem-bank/banks/edition-10-local";
import * as edition11Final from "problem-bank/banks/edition-11-final";
import * as edition11Local from "problem-bank/banks/edition-11-local";
import * as edition12Final from "problem-bank/banks/edition-12-final";
import * as edition12Local from "problem-bank/banks/edition-12-local";
import * as edition19Online from "problem-bank/banks/edition-19-online";
import * as edition20Online from "problem-bank/banks/edition-20-online";
import type { Problem } from "relay-bot";
import { localizeProblem } from "schemas";
import type { CompetitionConfig, CompetitionId, Language, RelayConfig } from "schemas";

// The banks this site serves, each named, so that no other bank is bundled
// into it. Every one of them must be released already: this is a public site.
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

// The competitions this site lists, ids alone: the menu is built from their
// metadata. Released rounds only, for the same reason as the banks.
const listedIds: readonly CompetitionId[] = [
  "w2b34gqoin--01-final-b",
  "6am5fsmne9--01-final-c",
  "6k1mw3k7hg--01-final-d",
  "khdxtg0pdf--02-final-b",
  "0f2sb1p6ac--02-final-c",
  "g3j0ii7mck--02-final-d",
  "2aacema4xc--03-final-b",
  "9hxguwf0l8--03-final-c",
  "8ruekrq6sb--03-final-d",
  "4wgxbrn0t4--04-final-b",
  "67pc1pame2--04-final-c",
  "oft89akwjn--04-final-d",
  "olwrsuyal9--05-final-a",
  "xte4u7n3sk--05-final-b",
  "5km5p9nezn--05-final-c",
  "yl107tp18h--05-final-d",
  "brzrrsj6dl--06-final-a",
  "8z2d46pbk4--06-final-b",
  "irr749k51s--06-final-c",
  "hd1te124s9--06-final-d",
  "pyy0ajnbqk--07-final-a",
  "hv9jl6i3ym--07-final-b",
  "r0ztthwwxb--07-final-c",
  "s6hbysgvtf--07-local-a",
  "9f0243kxkm--07-local-b",
  "eewtetfejl--08-final-a",
  "cpeit5hvuu--08-final-b",
  "qslfctgd7d--08-final-c",
  "xk5almiba6--08-final-d",
  "xdykhxjpqq--08-local-a",
  "0j6wur1i20--08-local-b",
  "e25esz2zpi--09-final-a",
  "1dto5izqmt--09-final-b",
  "5hh97hg21t--09-final-c",
  "5z7b62112w--09-final-c-plus",
  "827evd78ec--09-final-d",
  "62sdl5yetn--09-final-d-plus",
  "tvzhj3b2vq--09-local-a",
  "y7ev80b2v8--09-local-b",
  "cuwkeyj1mk--10-final-a",
  "5r6cvs3584--10-final-b",
  "p5rdmaw615--10-final-c",
  "4vmajkiien--10-final-c-plus",
  "wp2hq2fuc1--10-final-d",
  "jvt4qcgb8i--10-final-d-plus",
  "k75yk8w78i--10-local-a",
  "sviksw8sks--10-local-b",
  "8tkx4uq3m1--11-final-a",
  "vt8a13oavu--11-final-b",
  "1lw0brrs50--11-final-c",
  "ggzlsmnq3h--11-final-c-plus",
  "ljsvt5yb4w--11-final-d",
  "29i0tzwfbo--11-final-d-plus",
  "v3f919p3ya--11-local-a",
  "d1acvde8qh--11-local-b",
  "1jmnx7vnl8--12-final-a",
  "890cyy3cu8--12-final-b",
  "no9z8yjv29--12-final-c",
  "mqag87rxp0--12-final-d",
  "34jauhu011--12-final-e",
  "rvvvrr2zom--12-final-e-plus",
  "u3dfpsf6u9--12-local-a",
  "5aoxpqqc6p--12-local-b",
  "oxhy1gzqgo--19-online-c",
  "wa72dtu688--19-online-d",
  "j9y0ga3led--19-online-e",
  "mkhi1nnoim--20-online-c",
  "u4lw7pcca1--20-online-d",
  "wkr6zml6mu--20-online-e",
];

// Each listed competition with a relay, the only kind this site can play.
type PracticeSet = CompetitionConfig & { relay: RelayConfig };

const hasRelay = (competition: CompetitionConfig): competition is PracticeSet => competition.relay !== undefined;

export const practiceSets: readonly PracticeSet[] = listedIds.map(id => {
  const competition = registry.competitions.get(id);
  if (competition === undefined || !hasRelay(competition)) {
    throw new Error(`The practice site lists ${id}, which is not a competition with a relay`);
  }
  return competition;
});

export const findPracticeSet = (id: string): PracticeSet | undefined =>
  practiceSets.find(competition => competition.id === id);

// The practice set's relay, in the given language where its problems have it,
// as the bot serves it.
export const loadProblemSet = (id: string, language: Language): Problem[] => {
  const relay = findPracticeSet(id)?.relay;
  if (relay === undefined) {
    throw new Error(`No practice set ${id}`);
  }
  return relay.problems.map(({ problemId, points }) => {
    const problem = registry.problems.get(problemId);
    if (problem === undefined) {
      throw new Error(`The practice set ${id} refers to the problem ${problemId}, which does not exist`);
    }
    const { problemText, imageUrl, help1, help2 } = localizeProblem(problem, language);
    return {
      problemText,
      answer: problem.answer,
      points,
      ...(imageUrl !== undefined && { url: imageUrl }),
      ...(help1 !== undefined && { help1 }),
      ...(help2 !== undefined && { help2 }),
    };
  });
};
