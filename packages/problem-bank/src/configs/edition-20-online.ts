import type { CompetitionBank } from '../sources';

// Edition XX's online round (26/27), one competition per category. Each relay
// refers to problems/edition-20-online.ts by id; the strategy game is the
// round's one game, in the category's variant.
export const edition20OnlineCompetitions: CompetitionBank = {
  'mkhi1nnoim--20-online-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '7u9twu7iwv--sarki-kutato-hatizsak', points: 3 },
        { problemId: 'uftk8tk3x5--asatas-falak', points: 3 },
        { problemId: 'ee56me9xl7--szurke-terulet', points: 4 },
        { problemId: 'ibyzuf63i2--eika-tanyer', points: 4 },
        { problemId: 'jpn46e80fc--horgolt-pulcsik', points: 4 },
        { problemId: 'lusl93bsck--csuszo-pingvinek-tavolsaggal', points: 5 },
        { problemId: 'tj4vz6098x--szimmetrikus-trapez', points: 5 },
        { problemId: 'ao294mpckz--bendi-kedvenc-szama', points: 6 },
        { problemId: 'zmnout6gnw--malomtabla-bastyak', points: 6 },
      ],
    },
    strategy: { durationMinutes: 30, gameId: '20o-c' },
    metadata: { kind: 'competition', edition: 20, round: 'online', category: 'C' },
  },
  'u4lw7pcca1--20-online-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'uftk8tk3x5--asatas-falak', points: 3 },
        { problemId: '1fyzco2gak--szurke-es-fekete-terulet', points: 3 },
        { problemId: 'ibyzuf63i2--eika-tanyer', points: 4 },
        { problemId: 'tj4vz6098x--szimmetrikus-trapez', points: 4 },
        { problemId: 'lusl93bsck--csuszo-pingvinek-tavolsaggal', points: 4 },
        { problemId: 'ao294mpckz--bendi-kedvenc-szama', points: 5 },
        { problemId: 'wm898750hb--hatszog-nagyitas', points: 5 },
        { problemId: 'zmnout6gnw--malomtabla-bastyak', points: 6 },
        { problemId: '4hh6kc2pmy--lili-szamsor-7-es-10', points: 6 },
      ],
    },
    strategy: { durationMinutes: 30, gameId: '20o-d' },
    metadata: { kind: 'competition', edition: 20, round: 'online', category: 'D' },
  },
  'wkr6zml6mu--20-online-e': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '1fyzco2gak--szurke-es-fekete-terulet', points: 3 },
        { problemId: '3acuj6wggz--sorozat-7-41', points: 3 },
        { problemId: 'ibyzuf63i2--eika-tanyer', points: 4 },
        { problemId: 'ch6finn1yi--csuszo-pingvinek', points: 4 },
        { problemId: 'wm898750hb--hatszog-nagyitas', points: 4 },
        { problemId: 'zmnout6gnw--malomtabla-bastyak', points: 5 },
        { problemId: 'ao294mpckz--bendi-kedvenc-szama', points: 5 },
        { problemId: '3fydz3easz--lili-szamsor-ket-szam', points: 6 },
        { problemId: 'kgrsz5u6yw--jegszobrasz-loherek', points: 6 },
      ],
    },
    strategy: { durationMinutes: 30, gameId: '20o-e' },
    metadata: { kind: 'competition', edition: 20, round: 'online', category: 'E' },
  },
};
