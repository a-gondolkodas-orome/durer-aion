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
import type { CompetitionConfig, Language } from "schemas";

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

// The competition each of the round selector's test codes plays. Released
// rounds only, for the same reason as the banks.
export const competitionOfTest: Readonly<Record<string, string>> = {
  "1_D_B": "w2b34gqoin--01-final-b",
  "1_D_C": "6am5fsmne9--01-final-c",
  "1_D_D": "6k1mw3k7hg--01-final-d",
  "2_D_B": "khdxtg0pdf--02-final-b",
  "2_D_C": "0f2sb1p6ac--02-final-c",
  "2_D_D": "g3j0ii7mck--02-final-d",
  "3_D_B": "2aacema4xc--03-final-b",
  "3_D_C": "9hxguwf0l8--03-final-c",
  "3_D_D": "8ruekrq6sb--03-final-d",
  "4_D_B": "4wgxbrn0t4--04-final-b",
  "4_D_C": "67pc1pame2--04-final-c",
  "4_D_D": "oft89akwjn--04-final-d",
  "5_D_A": "olwrsuyal9--05-final-a",
  "5_D_B": "xte4u7n3sk--05-final-b",
  "5_D_C": "5km5p9nezn--05-final-c",
  "5_D_D": "yl107tp18h--05-final-d",
  "6_D_A": "brzrrsj6dl--06-final-a",
  "6_D_B": "8z2d46pbk4--06-final-b",
  "6_D_C": "irr749k51s--06-final-c",
  "6_D_D": "hd1te124s9--06-final-d",
  "7_D_A": "pyy0ajnbqk--07-final-a",
  "7_D_B": "hv9jl6i3ym--07-final-b",
  "7_D_C": "r0ztthwwxb--07-final-c",
  "7_H_A": "s6hbysgvtf--07-local-a",
  "7_H_B": "9f0243kxkm--07-local-b",
  "8_D_A": "eewtetfejl--08-final-a",
  "8_D_B": "cpeit5hvuu--08-final-b",
  "8_D_C": "qslfctgd7d--08-final-c",
  "8_D_D": "xk5almiba6--08-final-d",
  "8_H_A": "xdykhxjpqq--08-local-a",
  "8_H_B": "0j6wur1i20--08-local-b",
  "9_D_A": "e25esz2zpi--09-final-a",
  "9_D_B": "1dto5izqmt--09-final-b",
  "9_D_C": "5hh97hg21t--09-final-c",
  "9_D_C+": "5z7b62112w--09-final-c-plus",
  "9_D_D": "827evd78ec--09-final-d",
  "9_D_D+": "62sdl5yetn--09-final-d-plus",
  "9_H_A": "tvzhj3b2vq--09-local-a",
  "9_H_B": "y7ev80b2v8--09-local-b",
  "10_D_A": "cuwkeyj1mk--10-final-a",
  "10_D_B": "5r6cvs3584--10-final-b",
  "10_D_C": "p5rdmaw615--10-final-c",
  "10_D_C+": "4vmajkiien--10-final-c-plus",
  "10_D_D": "wp2hq2fuc1--10-final-d",
  "10_D_D+": "jvt4qcgb8i--10-final-d-plus",
  "10_H_A": "k75yk8w78i--10-local-a",
  "10_H_B": "sviksw8sks--10-local-b",
  "11_D_A": "8tkx4uq3m1--11-final-a",
  "11_D_B": "vt8a13oavu--11-final-b",
  "11_D_C": "1lw0brrs50--11-final-c",
  "11_D_C+": "ggzlsmnq3h--11-final-c-plus",
  "11_D_D": "ljsvt5yb4w--11-final-d",
  "11_D_D+": "29i0tzwfbo--11-final-d-plus",
  "11_H_A": "v3f919p3ya--11-local-a",
  "11_H_B": "d1acvde8qh--11-local-b",
  "12_D_A": "1jmnx7vnl8--12-final-a",
  "12_D_B": "890cyy3cu8--12-final-b",
  "12_D_C": "no9z8yjv29--12-final-c",
  "12_D_D": "mqag87rxp0--12-final-d",
  "12_D_E": "34jauhu011--12-final-e",
  "12_D_E+": "rvvvrr2zom--12-final-e-plus",
  "12_H_A": "u3dfpsf6u9--12-local-a",
  "12_H_B": "5aoxpqqc6p--12-local-b",
  "19_O_C": "oxhy1gzqgo--19-online-c",
  "19_O_D": "wa72dtu688--19-online-d",
  "19_O_E": "j9y0ga3led--19-online-e",
  "20_O_C": "mkhi1nnoim--20-online-c",
  "20_O_D": "u4lw7pcca1--20-online-d",
  "20_O_E": "wkr6zml6mu--20-online-e",
};

const competitionOf = (code: string): CompetitionConfig | undefined =>
  Object.hasOwn(competitionOfTest, code) ? registry.competitions.get(competitionOfTest[code]) : undefined;

export const hasProblemSet = (code: string): boolean => competitionOf(code)?.relay !== undefined;

// The relay of the test's competition, in the given language where its
// problems have it, as the bot serves it.
export const loadProblemSet = (code: string, language: Language): Problem[] => {
  const relay = competitionOf(code)?.relay;
  if (relay === undefined) {
    throw new Error(`No problem set found for test ${code}`);
  }
  return relay.problems.map(({ problemId, points }) => {
    const problem = registry.problems.get(problemId);
    if (problem === undefined) {
      throw new Error(`The test ${code} refers to the problem ${problemId}, which does not exist`);
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
