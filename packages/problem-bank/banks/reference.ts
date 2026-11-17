import type { CompetitionBank, ProblemBank } from '../src/sources';

// The reference competitions: the platform's test bed, which no real round was
// held with. Each is built to exercise part of the platform, so a change to it
// is tested here rather than against a released round, and changing them is
// cheap: their games are small, and nobody's results depend on them. The dry
// run serves them at /minta-verseny/; the live round, to teams imported into
// them.

export const competitions: CompetitionBank = {
  // A turn of two steps, with named roles; and a threshold on the rules page.
  'pc7jcwfdxr--minta-ketlepes': {
    languages: ['hu'],
    strategy: { durationMinutes: 20, gameId: 'minta-ketkupac' },
    advancingPoints: 10,
    metadata: { kind: 'other', label: { hu: 'Minta: két lépés', en: 'Reference: two steps' } },
  },
  // The template game: two languages, and an opening the bot draws.
  'rn477ptnaf--minta-sablon': {
    languages: ['hu', 'en'],
    strategy: { durationMinutes: 20, gameId: 'minta-sablon' },
    metadata: { kind: 'other', label: { hu: 'Minta: sablon', en: 'Reference: template' } },
  },
  // A relay alone, in two languages, with a problem written in one only; and a
  // finish message of its own.
  '49tbhzl1jz--minta-valto': {
    languages: ['hu', 'en'],
    relay: {
      durationMinutes: 30,
      problems: [
        { problemId: 'k5g58wuf6h--minta-korongok', points: 3 },
        { problemId: 'rnq4kflg46--minta-osszeg', points: 3 },
        { problemId: '4gmwop64ms--minta-oszthato', points: 4 },
        { problemId: '20c8027yvv--minta-kezfogasok', points: 4 },
        { problemId: 'e7grcn2cq9--minta-szamjegyosszeg', points: 5 },
        { problemId: '242slejy21--minta-dobokocka', points: 5 },
      ],
    },
    finishMessage: {
      hu: 'Ez a minta váltó véget ért. Eredményt nem hirdetünk belőle.',
      en: 'This reference relay is over. It has no results to announce.',
    },
    metadata: { kind: 'other', label: { hu: 'Minta: váltó', en: 'Reference: relay' } },
  },
  // The usual round: a relay and a strategy game.
  'klmgbpb334--minta-teljes': {
    languages: ['hu'],
    relay: {
      durationMinutes: 30,
      problems: [
        { problemId: 'k5g58wuf6h--minta-korongok', points: 3 },
        { problemId: '4gmwop64ms--minta-oszthato', points: 4 },
        { problemId: '20c8027yvv--minta-kezfogasok', points: 5 },
      ],
    },
    strategy: { durationMinutes: 20, gameId: 'minta-ketkupac' },
    advancingPoints: 15,
    metadata: { kind: 'other', label: { hu: 'Minta: teljes forduló', en: 'Reference: full round' } },
  },
};

export const problems: ProblemBank = {
  'k5g58wuf6h--minta-korongok': {
    answer: 9,
    content: {
      hu: { problemText: 'Két kupacban összesen 15 korong van, és az egyikben 3-mal több, mint a másikban. Hány korong van a nagyobb kupacban?' },
      en: { problemText: 'Two piles hold 15 tokens altogether, and one has 3 more than the other. How many tokens are in the larger pile?' },
    },
  },
  'rnq4kflg46--minta-osszeg': {
    answer: 55,
    content: {
      hu: { problemText: 'Mennyi $1 + 2 + 3 + \\ldots + 10$?' },
      en: { problemText: 'What is $1 + 2 + 3 + \\ldots + 10$?' },
    },
  },
  '4gmwop64ms--minta-oszthato': {
    answer: 14,
    content: {
      hu: { problemText: 'Hány 7-tel osztható pozitív egész szám van 1 és 100 között?' },
      en: { problemText: 'How many positive integers between 1 and 100 are divisible by 7?' },
    },
  },
  '20c8027yvv--minta-kezfogasok': {
    answer: 28,
    content: {
      hu: { problemText: 'Egy csapat 8 tagja mindenki mással egyszer kezet fog. Hány kézfogás történik összesen?' },
      en: { problemText: 'Each of the 8 members of a team shakes hands with every other member once. How many handshakes are there altogether?' },
    },
  },
  'e7grcn2cq9--minta-szamjegyosszeg': {
    answer: 199,
    content: {
      hu: { problemText: 'Melyik a legkisebb pozitív egész szám, amelynek a számjegyeinek összege 19?' },
      en: { problemText: 'What is the smallest positive integer whose digits add up to 19?' },
    },
  },
  // In Hungarian only: a team playing in English is shown it in Hungarian.
  '242slejy21--minta-dobokocka': {
    answer: 21,
    content: {
      hu: { problemText: 'Egy dobókocka szemközti lapjain a pöttyök összege mindig 7. Mennyi a hat lapon lévő pöttyök összege?' },
    },
  },
};
