/*
Game registry — METADATA ONLY. One entry per game (year, round, category, name,
icon, credit, `featured`). Deliberately free of React and of any game-component
import: this is the widely-imported half of the pair — the overview homepage
(cards, filters, icons, featured strip) and game chrome read it for display.
Its sibling `index.ts` holds the component wiring (the actual page components).

The two files are kept apart on purpose. Merging them would drag the whole
game-component graph into every metadata consumer's bundle. This file is imported
~a dozen places; `index.ts` is imported in exactly one runtime place — the router.
`app.tsx` pairs them: it loops these keys and looks each up in the `index.ts`
namespace. `game-list-integrity.spec.ts` guards that the two stay 1-to-1 in sync.
*/
import type { I18nString } from '../../language';

// Canonical list of competition categories in increasing difficulty order.
export const categories = ['A', 'B', 'C', 'D', 'E', 'E+'] as const;
export type Category = typeof categories[number];

export type Round = 'döntő' | 'online'
export type GameList = Record<string, GameEntry>;

// Canonical list of icon keys into the overview icon registry
// (game-icons.tsx). Single source of truth: `IconKey` is derived from it, and
// the registry and the overview's "filter by type" row iterate it, so the set
// of valid keys and their order live in exactly one place.
export const iconKeys = [
  'chess',
  'board',
  'coloring',
  'coins',
  'number',
  'small-graph',
  'piles',
  'cards',
  'pursuit',
  'pyramid',
  'dominoes',
  'house',
  'scissor'
] as const;

export type IconKey = typeof iconKeys[number];

export interface GameEntry {
  year: { k: string; v: string }
  round: Round
  category: Category[]
  name: I18nString // shown on the card in the overview list.
  title?: I18nString // longer title shown on the game page instead of name
  credit?: { suggestedBy?: string[]; developedBy?: string[] }
  featured?: boolean // include in the "Featured games" strip. Absent/false = not featured.
  icon: IconKey // thematic card icon, also drives the overview's "filter by type".
}

// The key IS the game's URL slug (`/game/<key>`) and must have a matching
// re-export in `index.ts`. The router (`app.tsx`) derives every route by looping
// over this list. Renaming a component never affects a route — only the alias in
// `index.ts` changes — so keys are stable identifiers; don't rename them lightly.
// Keep entries ordered by year first, category second.
export const gameList: GameList = {
  ChessBishops: {
    year: { k: "I. (07/08)", v: "07/08" },
    round: "döntő",
    category: ["B"],
    icon: "chess",
    name: { hu: "Futók lerakása", en: "Placing bishops" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  ChessRook: {
    year: { k: "I. (07/08)", v: "07/08" },
    round: "döntő",
    category: ["C"],
    icon: "chess",
    name: { hu: "Barangolás bástyával", en: "Roaming with a rook" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  PrimeExponentials: {
    year: { k: "I. (07/08)", v: "07/08" },
    round: "döntő",
    category: ["D"],
    icon: "number",
    name: { hu: "Prímhatványok kivonása", en: "Subtract a prime power" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  AmorAndCupido: {
    year: { k: "II. (08/09)", v: "08/09" },
    round: "döntő",
    category: ["B"],
    icon: "small-graph",
    name: { hu: "Ámor és Kupidó", en: "Cupid and Amor" }
  },
  WaningStones: {
    year: { k: "II. (08/09)", v: "08/09" },
    round: "döntő",
    category: ["C"],
    icon: "piles",
    name: { hu: "Apadó kupac", en: "Waning Stones" }
  },
  ThreeMore: {
    year: { k: "II. (08/09)", v: "08/09" },
    round: "döntő",
    category: ["D"],
    icon: "piles",
    name: { hu: "Hárommal többet", en: "Three More" }
  },
  DominoesOnChessboard: {
    year: { k: "III. (09/10)", v: "09/10" },
    round: "döntő",
    category: ["C"],
    icon: "dominoes",
    name: { hu: "Sakktáblára dominók", en: "Cram (Dominoes)" },
    title: { hu: "Sakktáblára dominók", en: "Cram (Dominoes on a chessboard)" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  PolynomialBuilding: {
    year: { k: "III. (09/10)", v: "09/10" },
    round: "döntő",
    category: ["C"],
    icon: "number",
    name: { hu: "Polinomépítés", en: "Building a polynomial" }
  },
  ChocolateBreaking: {
    year: { k: "III. (09/10)", v: "09/10" },
    round: "döntő",
    category: ["D"],
    icon: "board",
    name: { hu: "Csoki törögetés", en: "Breaking chocolate" }
  },
  IncrementOrDouble: {
    year: { k: "IV. (10/11)", v: "10/11" },
    round: "döntő",
    category: ["B"],
    icon: "number",
    name: { hu: "x+1, 2x 100-ig", en: "x+1, 2x up to 100" }
  },
  PlusOneTwoThree: {
    year: { k: "V. (11/12)", v: "11/12" },
    round: "döntő",
    category: ["A"],
    icon: "number",
    name: { hu: "+1, +2, +3", en: "+1, +2, +3" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  DigitSubtraction: {
    year: { k: "V. (11/12)", v: "11/12" },
    round: "döntő",
    category: ["B"],
    icon: "number",
    name: { hu: "Számjegy kivonás", en: "Digit Subtraction" }
  },
  ThreePilesRebuild: {
    year: { k: "V. (11/12)", v: "11/12" },
    round: "döntő",
    category: ["C"],
    icon: "piles",
    name: { hu: "Három kupac", en: "Three piles" }
  },
  TenDigitNumber: {
    year: { k: "V. (11/12)", v: "11/12" },
    round: "döntő",
    category: ["D"],
    icon: "number",
    name: { hu: "Párbaj számjegyekkel", en: "Digit duel" }
  },
  TwelveSquares: {
    year: { k: "VI. (12/13)", v: "12/13" },
    round: "döntő",
    category: ["A"],
    icon: "chess",
    name: { hu: "Tizenkét mező", en: "Twelve squares" },
    credit: { developedBy: ["Melján Dávid"] }
  },
  PrimelyToZero: {
    year: { k: "VI. (12/13)", v: "12/13" },
    round: "döntő",
    category: ["B"],
    icon: "number",
    name: { hu: "Prímesen nullára", en: "Primely to Zero" }
  },
  DoublingReduction: {
    year: { k: "VI. (12/13)", v: "12/13" },
    round: "döntő",
    category: ["C"],
    icon: "piles",
    name: { hu: "Duplázva csökkentés", en: "Doubling reduction" }
  },
  HunyadiAndTheJanissaries: {
    year: { k: "VI. (12/13)", v: "12/13" },
    round: "döntő",
    category: ["D"],
    icon: "pyramid",
    name: { hu: "Hunyadi és a janicsárok", en: "Hunyadi and the janissaries" },
    credit: { developedBy: ["Czeller Ildikó", "Schweitzer Ádám"] }
  },
  RockPaperScissor: {
    year: { k: "VII. (13/14)", v: "13/14" },
    round: "döntő",
    category: ["A"],
    icon: "scissor",
    name: { hu: "Kő-papír-olló", en: "Rock-paper-scissors" },
    credit: { developedBy: ["Máté Lőrinc"] }
  },
  FiveConnectedFields: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "döntő",
    icon: 'small-graph',
    category: ["A"],
    name: { hu: "Öt összekötött mező", en: "Five connected fields" }
  },
  FourConnectedFields: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "döntő",
    icon: "small-graph",
    category: ["B"],
    name: { hu: "Négy összekötött mező", en: "Four connected fields" }
  },
  FiveFiveCard: {
    year: { k: "VII. (13/14)", v: "13/14" },
    round: "döntő",
    category: ["B"],
    icon: "cards",
    name: { hu: "Párbaj 5 lappal", en: "Duel with 5 cards" },
    credit: { developedBy: ["Máté Lőrinc"] }
  },
  TriangleColoring: {
    year: { k: "VII. (13/14)", v: "13/14" },
    round: "döntő",
    category: ["C"],
    icon: "coloring",
    name: { hu: "Háromszög színezés", en: "Triangle colouring" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  FourPilesTwoGrabs: {
    year: { k: "VII. (13/14)", v: "13/14" },
    round: "döntő",
    category: ["D"],
    icon: "piles",
    name: { hu: "Négy kupac, két marok", en: "Four piles, two grabs" }
  },
  PileSplitter: {
    year: { k: "VIII. (14/15)", v: "14/15" },
    round: "döntő",
    category: ["A"],
    featured: true,
    icon: "piles",
    name: { hu: "Kupac kettéosztó", en: "Pile splitter" },
    credit: { developedBy: ["Szűcs Gábor"] }
  },
  PileSplitter3: {
    year: { k: "VIII. (14/15)", v: "14/15" },
    round: "döntő",
    category: ["B"],
    icon: "piles",
    name: { hu: "Kupac kettéosztó 3 kupaccal", en: "Pile splitter (3 piles)" },
    credit: { developedBy: ["Soós Máté"] }
  },
  PileUnion: {
    year: { k: "VIII. (14/15)", v: "14/15" },
    round: "döntő",
    category: ["C"],
    icon: "piles",
    name: { hu: "Kupac egyesítés", en: "Pile union" }
  },
  MatchstickPiles: {
    year: { k: "VIII. (14/15)", v: "14/15" },
    round: "döntő",
    category: ["D"],
    icon: "piles",
    name: { hu: "Gyufakupacok", en: "Matchstick piles" }
  },
  Policemanthief: {
    year: { k: "IX. (15/16)", v: "15/16" },
    round: "döntő",
    category: ["A", "B"],
    icon: "pursuit",
    name: { hu: "Rendőrök, tolvaj", en: "Policemen and thief" },
    title: { hu: "Rendőrök, tolvaj (A, B kategória)", en: "Policemen and thief (category A, B)" },
    credit: { developedBy: ["Halasi Gergő"] }
  },
  PolicemanthiefC: {
    year: { k: "IX. (15/16)", v: "15/16" },
    round: "döntő",
    category: ["C", "D"],
    icon: "pursuit",
    name: { hu: "Rendőrök, tolvaj", en: "Policemen and thief" },
    title: { hu: "Rendőrök, tolvaj (C, D kategória)", en: "Policemen and thief (category C, D)" }
  },
  DiscsFlipOrRemove: {
    year: { k: "X. (16/17)", v: "16/17" },
    round: "döntő",
    category: ["A", "B"],
    icon: "piles",
    name: { hu: "Átfordítás, elvétel", en: "Flip or remove" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  Bacteria: {
    year: { k: "X. (16/17)", v: "16/17" },
    round: "döntő",
    category: ["C", "D", "E", "E+"],
    icon: "pursuit",
    name: { hu: "Baktériumok terjedése", en: "Spreading of bacteria" },
    credit: { developedBy: ["Tárkányi Damján"] }
  },
  NumberCovering: {
    year: { k: "XI. (17/18)", v: "17/18" },
    round: "döntő",
    category: ["A", "B"],
    icon: "number",
    name: { hu: "Számok lefedése", en: "Covering numbers" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  RemoveRowOrColumn: {
    year: { k: "XI. (17/18)", v: "17/18" },
    round: "döntő",
    category: ["C", "E"],
    icon: "board",
    name: { hu: "Sor vagy oszlop levétele", en: "Remove a row or column" }
  },
  TicTacToeDoubleStart: {
    year: { k: "XII. (18/19)", v: "18/19" },
    round: "döntő",
    category: ["A"],
    icon: "board",
    name: { hu: "Duplánkezdő 3x3 amőba", en: "Double-starting tic-tac-toe" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  AntiTicTacToe: {
    year: { k: "XII. (18/19)", v: "18/19" },
    round: "döntő",
    category: ["B"],
    icon: "board",
    featured: true,
    name: { hu: "3x3-as antiamőba", en: "3×3 anti-tic-tac-toe" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  Dominoes4x4: {
    year: { k: "XII. (18/19)", v: "18/19" },
    round: "döntő",
    category: ["C", "D"],
    icon: "dominoes",
    name: { hu: "Álló és fekvő dominók", en: "Standing and lying dominoes" }
  },
  TakeAndPoint: {
    year: { k: "XII. (18/19)", v: "18/19" },
    round: "döntő",
    category: ["E", "E+"],
    icon: "piles",
    name: { hu: "Vegyél és mutass", en: "Take and point" }
  },
  TwoTimesTwo: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["A"],
    icon: "board",
    name: { hu: "4 mezőbe különbözőt", en: "4 distinct squares" },
    credit: { developedBy: ["Soós Máté"] }
  },
  FiveSquares: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["B"],
    icon: "board",
    featured: true,
    name: { hu: "5 mezőbe különbözőt", en: "5 distinct squares" },
    credit: { developedBy: ["Soós Máté"] }
  },
  TicTacToe: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["C"],
    icon: "board",
    name: { hu: "Átszínezős tic-tac-toe", en: "Recolouring tic-tac-toe" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  SuperstitiousCounting: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["D", "E"],
    icon: "number",
    name: { hu: "Babonás lépkedés", en: "Superstitious counting" },
    credit: { developedBy: ["Soós Máté"] }
  },
  PileSplitter4: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["E+"],
    icon: "piles",
    name: { hu: "Kupac kettéosztó 4 kupaccal", en: "Pile splitting (4 piles)" },
    credit: { developedBy: ["Soós Máté"] }
  },
  RookToCorner: {
    year: { k: "XIV. (20/21)", v: "20/21" },
    round: "online",
    category: ["C"],
    icon: "chess",
    name: { hu: "Bástya a sarokba", en: "Rook to the corner" }
  },
  TriangularGridRopes: {
    year: { k: "XIV. (20/21)", v: "20/21" },
    round: "döntő",
    category: ["C", "D"],
    icon: "small-graph",
    name: { hu: "10 totemoszlop", en: "10 totem poles" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  TriangularGridRopes15: {
    year: { k: "XIV. (20/21)", v: "20/21" },
    round: "döntő",
    category: ["E", "E+"],
    icon: "small-graph",
    name: { hu: "15 totemoszlop", en: "15 totem poles" }
  },
  ModifiedMill: {
    year: { k: "XIV. (20/21)", v: "20/21" },
    round: "online",
    category: ["D"],
    icon: "board",
    name: { hu: "Módosított malom", en: "Modified mill" }
  },
  SumFifteen: {
    year: { k: "XIV. (20/21)", v: "20/21" },
    round: "online",
    category: ["E"],
    icon: "number",
    name: { hu: "Összeg 15", en: "Sum 15" }
  },
  CoinsIn3Piles: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "döntő",
    category: ["A", "B"],
    icon: "coins",
    name: { hu: "Érmék beváltása", en: "Coin change" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  ChessDucks: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "online",
    category: ["C", "E"],
    icon: "chess",
    featured: true,
    name: { hu: "Békés kacsák", en: "Peaceful ducks" },
    credit: { developedBy: ["Jánosik Áron"] }
  },
  CubeColoring: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "döntő",
    category: ["C", "D"],
    icon: "coloring",
    featured: true,
    name: { hu: "Kockaszínezés", en: "Cube colouring" },
    credit: { suggestedBy: ["Nagy Kartal"], developedBy: ["Szűcs Gábor"] }
  },
  TakePowerOfTwo: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "online",
    category: ["D"],
    icon: "number",
    name: { hu: "Kettőhatványok kivonása", en: "Subtract 2^n" },
    credit: { developedBy: ["Jánosik Áron"] }
  },
  RecolouringDiscs: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "döntő",
    category: ["E"],
    icon: "board",
    name: { hu: "Átszínező korongok", en: "Recolouring discs" },
    credit: { suggestedBy: ["Váli Benedek"] }
  },
  LatinSquareFilling: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "döntő",
    category: ["C"],
    icon: "board",
    name: { hu: "Latin-négyzet kitöltés", en: "Filling a Latin square" },
    credit: { suggestedBy: ["Nagy Kartal"] }
  },
  TenCoins: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "online",
    category: ["C", "D"],
    icon: "coins",
    name: { hu: "10 érme", en: "10 coins" }
  },
  AddReduceDouble: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "döntő",
    category: ["D"],
    icon: "piles",
    name: { hu: "Kettőt vesz, egyet kap", en: "Add N, take 2N" },
    credit: { suggestedBy: ["Imolay András"], developedBy: ["Matolcsi Dávid"] }
  },
  FourPilesSpreadAhead: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "döntő",
    category: ["E", "E+"],
    icon: "piles",
    name: { hu: "4 kupacban előrepakolás", en: "4 piles: spread ahead" },
    credit: { suggestedBy: ["Fraknói Ádám"], developedBy: ["Matolcsi Dávid"] }
  },
  ArchitectAndBandits: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["A"],
    icon: "house",
    name: { hu: "Építész és banditák (A)", en: "Architect and Bandits (A)" },
    title: { hu: "Építész és banditák (8 torony)", en: "Architect and Bandits (8 towers)" }
  },
  ArchitectAndBanditsB: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["B"],
    icon: "house",
    name: { hu: "Építész és banditák (B)", en: "Architect and Bandits (B)" },
    title: { hu: "Építész és banditák (10 torony)", en: "Architect and Bandits (10 towers)" }
  },
  SharkChase4: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["C"],
    featured: true,
    icon: "pursuit",
    name: { hu: "Cápa üldözés (4 x 4)", en: "Shark chase (4 × 4)" },
    credit: {
      suggestedBy: ["Páhán Anita"],
      developedBy: ["Csizmadia Miklós", "Kempf Alex"]
    }
  },
  Take1OrHalve: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "online",
    category: ["C", "D", "E"],
    icon: "piles",
    name: { hu: "Egyet vegyél vagy felezz", en: "Take one or halve" },
    credit: { developedBy: ["Jánosik Áron"] }
  },
  SharkChase5: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["D"],
    icon: "pursuit",
    name: { hu: "Cápa üldözés (5 x 5)", en: "Shark chase (5 × 5)" },
    credit: {
      suggestedBy: ["Páhán Anita"],
      developedBy: ["Szemerédi Levente"]
    }
  },
  MatchesOnEdges: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["E+"],
    icon: "board",
    name: { hu: "Gyufák az éleken", en: "Matches on edges" },
    credit: { suggestedBy: ["Németh Márton"] }
  },
  ThiefSheriffMean: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["A"],
    icon: "cards",
    name: { hu: "Tolvajnál átlag (1-7)", en: "Thief's mean (1–7)" },
    credit: { developedBy: ["Turu Tamás"], suggestedBy: ["Győrffi Ádám György"] }
  },
  ThiefSheriffMean9: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["B"],
    icon: "cards",
    name: { hu: "Tolvajnál átlag (1-9)", en: "Thief's mean (1–9)" },
    credit: { developedBy: ["Czeller Ildikó", "Turu Tamás"], suggestedBy: ["Győrffi Ádám György"] }
  },
  ChessKnight: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["C", "D"],
    icon: "chess",
    name: { hu: "Barangolás huszárral", en: "Roaming with a knight" },
    credit: {
      suggestedBy: ["Hegedűs Dániel"],
      developedBy: ["Czeller Ildikó"]
    }
  },
  BankRobbers: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "online",
    category: ["C", "D", "E"],
    icon: "house",
    name: { hu: "Bankrablók: 7-10 bank", en: "Bank robbers: 7–10 banks" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  PairsOfNumbers: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["E", "E+"],
    icon: "number",
    name: { hu: "Számpár módosítás", en: "Pairs of numbers" }
  },
  MagicBox: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "döntő",
    category: ["A"],
    icon: "board",
    featured: true,
    name: { hu: "Mágikus láda (A)", en: "Magic Box (A)" },
    title: { hu: "Mágikus láda", en: "Magic Box" }
  },
  MagicBoxB: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "döntő",
    icon: "board",
    category: ["B"],
    name: { hu: "Mágikus láda (B)", en: "Magic Box (B)" },
    title: { hu: "Mágikus láda (kijelöléssel)", en: "Magic Box (with designation)" }
  },
  TwoOfThreeTakeaway: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "döntő",
    category: ["C"],
    icon: "piles",
    name: { hu: "Két kupacból elvétel", en: "Take from two piles" }
  },
  SixFieldsCircle: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "döntő",
    category: ["D", "E"],
    icon: "small-graph",
    name: { hu: "6 mező körben", en: "Six fields on a circle" }
  },
  RemoveDivisorMultiple: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "online",
    category: ["C", "D"],
    icon: "cards",
    name: { hu: "Osztó/többszörös törlés", en: "Remove a divisor/multiple" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  StonesRemoveOneNotTwiceFromLeft: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "online",
    category: ["E"],
    icon: "piles",
    name: { hu: "Kavicsgyűjtés egyesével", en: "Collecting stones 1 by 1" },
    credit: { developedBy: ["Turu Tamás"] }
  },
  NumberPyramid: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "döntő",
    category: ["E+"],
    featured: true,
    icon: "pyramid",
    name: { hu: "Számpiramis", en: "Number Pyramid" },
    credit: { suggestedBy: ["Imolay András"] }
  }
};
