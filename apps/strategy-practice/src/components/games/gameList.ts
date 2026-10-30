/*
Game registry — METADATA ONLY. One entry per game (year, round, category,
icon, credit, `featured`); its name, and the longer title its page shows where it
has one, are in the `catalog` namespace under the same key. Deliberately free of React and of any game-component
import: this is the widely-imported half of the pair — the overview homepage
(cards, filters, icons, featured strip) and game chrome read it for display.
Its sibling `index.ts` holds the component wiring (the actual page components).

The two files are kept apart on purpose. Merging them would drag the whole
game-component graph into every metadata consumer's bundle. This file is imported
~a dozen places; `index.ts` is imported in exactly one runtime place — the router.
`app.tsx` pairs them: it loops these keys and looks each up in the `index.ts`
namespace. `gameList.test.ts` guards that the two stay 1-to-1 in sync.
*/

// Canonical list of competition categories in increasing difficulty order.
export const categories = ['A', 'B', 'C', 'D', 'E', 'E+'] as const;
export type Category = typeof categories[number];

type Round = 'döntő' | 'online'
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
    year: { k: 'I. (07/08)', v: '07/08' },
    round: 'döntő',
    category: ['B'],
    icon: 'chess',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  ChessRook: {
    year: { k: 'I. (07/08)', v: '07/08' },
    round: 'döntő',
    category: ['C'],
    icon: 'chess',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  PrimeExponentials: {
    year: { k: 'I. (07/08)', v: '07/08' },
    round: 'döntő',
    category: ['D'],
    icon: 'number',
    credit: { developedBy: ['Hajós Balázs'] }
  },
  AmorAndCupido: {
    year: { k: 'II. (08/09)', v: '08/09' },
    round: 'döntő',
    category: ['B'],
    icon: 'small-graph'
  },
  WaningStones: {
    year: { k: 'II. (08/09)', v: '08/09' },
    round: 'döntő',
    category: ['C'],
    icon: 'piles'
  },
  ThreeMore: {
    year: { k: 'II. (08/09)', v: '08/09' },
    round: 'döntő',
    category: ['D'],
    icon: 'piles'
  },
  DominoesOnChessboard: {
    year: { k: 'III. (09/10)', v: '09/10' },
    round: 'döntő',
    category: ['C'],
    icon: 'dominoes',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  PolynomialBuilding: {
    year: { k: 'III. (09/10)', v: '09/10' },
    round: 'döntő',
    category: ['C'],
    icon: 'number'
  },
  ChocolateBreaking: {
    year: { k: 'III. (09/10)', v: '09/10' },
    round: 'döntő',
    category: ['D'],
    icon: 'board'
  },
  IncrementOrDouble: {
    year: { k: 'IV. (10/11)', v: '10/11' },
    round: 'döntő',
    category: ['B'],
    icon: 'number'
  },
  TriangleCircleGame: {
    year: { k: 'IV. (10/11)', v: '10/11' },
    round: 'döntő',
    category: ['C', 'D'],
    icon: 'coloring'
  },
  PlusOneTwoThree: {
    year: { k: 'V. (11/12)', v: '11/12' },
    round: 'döntő',
    category: ['A'],
    icon: 'number',
    credit: { developedBy: ['Hajós Balázs'] }
  },
  DigitSubtraction: {
    year: { k: 'V. (11/12)', v: '11/12' },
    round: 'döntő',
    category: ['B'],
    icon: 'number'
  },
  ThreePilesRebuild: {
    year: { k: 'V. (11/12)', v: '11/12' },
    round: 'döntő',
    category: ['C'],
    icon: 'piles'
  },
  TenDigitNumber: {
    year: { k: 'V. (11/12)', v: '11/12' },
    round: 'döntő',
    category: ['D'],
    icon: 'number'
  },
  TwelveSquares: {
    year: { k: 'VI. (12/13)', v: '12/13' },
    round: 'döntő',
    category: ['A'],
    icon: 'chess',
    credit: { developedBy: ['Melján Dávid'] }
  },
  PrimelyToZero: {
    year: { k: 'VI. (12/13)', v: '12/13' },
    round: 'döntő',
    category: ['B'],
    icon: 'number'
  },
  DoublingReduction: {
    year: { k: 'VI. (12/13)', v: '12/13' },
    round: 'döntő',
    category: ['C'],
    icon: 'piles'
  },
  HunyadiAndTheJanissaries: {
    year: { k: 'VI. (12/13)', v: '12/13' },
    round: 'döntő',
    category: ['D'],
    icon: 'pyramid',
    credit: { developedBy: ['Czeller Ildikó', 'Schweitzer Ádám'] }
  },
  RockPaperScissor: {
    year: { k: 'VII. (13/14)', v: '13/14' },
    round: 'döntő',
    category: ['A'],
    icon: 'scissor',
    credit: { developedBy: ['Máté Lőrinc'] }
  },
  FiveConnectedFields: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'döntő',
    icon: 'small-graph',
    category: ['A']
  },
  FourConnectedFields: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'döntő',
    icon: 'small-graph',
    category: ['B']
  },
  FiveFiveCard: {
    year: { k: 'VII. (13/14)', v: '13/14' },
    round: 'döntő',
    category: ['B'],
    icon: 'cards',
    credit: { developedBy: ['Máté Lőrinc'] }
  },
  TriangleColoring: {
    year: { k: 'VII. (13/14)', v: '13/14' },
    round: 'döntő',
    category: ['C'],
    icon: 'coloring',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  FourPilesTwoGrabs: {
    year: { k: 'VII. (13/14)', v: '13/14' },
    round: 'döntő',
    category: ['D'],
    icon: 'piles'
  },
  PileSplitter: {
    year: { k: 'VIII. (14/15)', v: '14/15' },
    round: 'döntő',
    category: ['A'],
    featured: true,
    icon: 'piles',
    credit: { developedBy: ['Szűcs Gábor'] }
  },
  PileSplitter3: {
    year: { k: 'VIII. (14/15)', v: '14/15' },
    round: 'döntő',
    category: ['B'],
    icon: 'piles',
    credit: { developedBy: ['Soós Máté'] }
  },
  PileUnion: {
    year: { k: 'VIII. (14/15)', v: '14/15' },
    round: 'döntő',
    category: ['C'],
    icon: 'piles'
  },
  MatchstickPiles: {
    year: { k: 'VIII. (14/15)', v: '14/15' },
    round: 'döntő',
    category: ['D'],
    icon: 'piles'
  },
  Policemanthief: {
    year: { k: 'IX. (15/16)', v: '15/16' },
    round: 'döntő',
    category: ['A', 'B'],
    icon: 'pursuit',
    credit: { developedBy: ['Halasi Gergő'] }
  },
  PolicemanthiefC: {
    year: { k: 'IX. (15/16)', v: '15/16' },
    round: 'döntő',
    category: ['C', 'D'],
    icon: 'pursuit'
  },
  DiscsFlipOrRemove: {
    year: { k: 'X. (16/17)', v: '16/17' },
    round: 'döntő',
    category: ['A', 'B'],
    icon: 'piles',
    credit: { developedBy: ['Hajós Balázs'] }
  },
  Bacteria: {
    year: { k: 'X. (16/17)', v: '16/17' },
    round: 'döntő',
    category: ['C', 'D', 'E', 'E+'],
    icon: 'pursuit',
    credit: { developedBy: ['Tárkányi Damján'] }
  },
  NumberCovering: {
    year: { k: 'XI. (17/18)', v: '17/18' },
    round: 'döntő',
    category: ['A', 'B'],
    icon: 'number',
    credit: { developedBy: ['Hajós Balázs'] }
  },
  RemoveRowOrColumn: {
    year: { k: 'XI. (17/18)', v: '17/18' },
    round: 'döntő',
    category: ['C', 'E'],
    icon: 'board'
  },
  TicTacToeDoubleStart: {
    year: { k: 'XII. (18/19)', v: '18/19' },
    round: 'döntő',
    category: ['A'],
    icon: 'board',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  AntiTicTacToe: {
    year: { k: 'XII. (18/19)', v: '18/19' },
    round: 'döntő',
    category: ['B'],
    icon: 'board',
    featured: true,
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  Dominoes4x4: {
    year: { k: 'XII. (18/19)', v: '18/19' },
    round: 'döntő',
    category: ['C', 'D'],
    icon: 'dominoes'
  },
  TakeAndPoint: {
    year: { k: 'XII. (18/19)', v: '18/19' },
    round: 'döntő',
    category: ['E', 'E+'],
    icon: 'piles'
  },
  TwoTimesTwo: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['A'],
    icon: 'board',
    credit: { developedBy: ['Soós Máté'] }
  },
  FiveSquares: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['B'],
    icon: 'board',
    featured: true,
    credit: { developedBy: ['Soós Máté'] }
  },
  TicTacToe: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['C'],
    icon: 'board',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  SuperstitiousCounting: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['D', 'E'],
    icon: 'number',
    credit: { developedBy: ['Soós Máté'] }
  },
  PileSplitter4: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['E+'],
    icon: 'piles',
    credit: { developedBy: ['Soós Máté'] }
  },
  RookToCorner: {
    year: { k: 'XIV. (20/21)', v: '20/21' },
    round: 'online',
    category: ['C'],
    icon: 'chess'
  },
  TriangularGridRopes: {
    year: { k: 'XIV. (20/21)', v: '20/21' },
    round: 'döntő',
    category: ['C', 'D'],
    icon: 'small-graph',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  TriangularGridRopes15: {
    year: { k: 'XIV. (20/21)', v: '20/21' },
    round: 'döntő',
    category: ['E', 'E+'],
    icon: 'small-graph'
  },
  ModifiedMill: {
    year: { k: 'XIV. (20/21)', v: '20/21' },
    round: 'online',
    category: ['D'],
    icon: 'board'
  },
  SumFifteen: {
    year: { k: 'XIV. (20/21)', v: '20/21' },
    round: 'online',
    category: ['E'],
    icon: 'number'
  },
  CoinsIn3Piles: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'döntő',
    category: ['A', 'B'],
    icon: 'coins',
    credit: { developedBy: ['Czeller Ildikó'] }
  },
  ChessDucks: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'online',
    category: ['C', 'E'],
    icon: 'chess',
    featured: true,
    credit: { developedBy: ['Jánosik Áron'] }
  },
  CubeColoring: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'döntő',
    category: ['C', 'D'],
    icon: 'coloring',
    featured: true,
    credit: { suggestedBy: ['Nagy Kartal'], developedBy: ['Szűcs Gábor'] }
  },
  TakePowerOfTwo: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'online',
    category: ['D'],
    icon: 'number',
    credit: { developedBy: ['Jánosik Áron'] }
  },
  RecolouringDiscs: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'döntő',
    category: ['E'],
    icon: 'board',
    credit: { suggestedBy: ['Váli Benedek'] }
  },
  LatinSquareFilling: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'döntő',
    category: ['C'],
    icon: 'board',
    credit: { suggestedBy: ['Nagy Kartal'] }
  },
  TenCoins: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'online',
    category: ['C', 'D'],
    icon: 'coins'
  },
  AddReduceDouble: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'döntő',
    category: ['D'],
    icon: 'piles',
    credit: { suggestedBy: ['Imolay András'], developedBy: ['Matolcsi Dávid'] }
  },
  FourPilesSpreadAhead: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'döntő',
    category: ['E', 'E+'],
    icon: 'piles',
    credit: { suggestedBy: ['Fraknói Ádám'], developedBy: ['Matolcsi Dávid'] }
  },
  ArchitectAndBandits: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'döntő',
    category: ['A'],
    icon: 'house'
  },
  ArchitectAndBanditsB: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'döntő',
    category: ['B'],
    icon: 'house'
  },
  SharkChase4: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'döntő',
    category: ['C'],
    featured: true,
    icon: 'pursuit',
    credit: {
      suggestedBy: ['Páhán Anita'],
      developedBy: ['Csizmadia Miklós', 'Kempf Alex']
    }
  },
  Take1OrHalve: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'online',
    category: ['C', 'D', 'E'],
    icon: 'piles',
    credit: { developedBy: ['Jánosik Áron'] }
  },
  SharkChase5: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'döntő',
    category: ['D'],
    icon: 'pursuit',
    credit: {
      suggestedBy: ['Páhán Anita'],
      developedBy: ['Szemerédi Levente']
    }
  },
  MatchesOnEdges: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'döntő',
    category: ['E+'],
    icon: 'board',
    credit: { suggestedBy: ['Németh Márton'] }
  },
  ThiefSheriffMean: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['A'],
    icon: 'cards',
    credit: { developedBy: ['Turu Tamás'], suggestedBy: ['Győrffi Ádám György'] }
  },
  ThiefSheriffMean9: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['B'],
    icon: 'cards',
    credit: { developedBy: ['Czeller Ildikó', 'Turu Tamás'], suggestedBy: ['Győrffi Ádám György'] }
  },
  ChessKnight: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['C', 'D'],
    icon: 'chess',
    credit: {
      suggestedBy: ['Hegedűs Dániel'],
      developedBy: ['Czeller Ildikó']
    }
  },
  BankRobbers: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'online',
    category: ['C', 'D', 'E'],
    icon: 'house',
    credit: { developedBy: ['Hajós Balázs'] }
  },
  PairsOfNumbers: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['E', 'E+'],
    icon: 'number'
  },
  MagicBox: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'döntő',
    category: ['A'],
    icon: 'board',
    featured: true
  },
  MagicBoxB: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'döntő',
    icon: 'board',
    category: ['B']
  },
  TwoOfThreeTakeaway: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'döntő',
    category: ['C'],
    icon: 'piles'
  },
  SixFieldsCircle: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'döntő',
    category: ['D', 'E'],
    icon: 'small-graph'
  },
  RemoveDivisorMultiple: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'online',
    category: ['C', 'D'],
    icon: 'cards',
    credit: { developedBy: ['Hajós Balázs'] }
  },
  StonesRemoveOneNotTwiceFromLeft: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'online',
    category: ['E'],
    icon: 'piles',
    credit: { developedBy: ['Turu Tamás'] }
  },
  NumberPyramid: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'döntő',
    category: ['E+'],
    featured: true,
    icon: 'pyramid',
    credit: { suggestedBy: ['Imolay András'] }
  },
  TwoXsOneO: {
    year: { k: 'XX. (26/27)', v: '26/27' },
    round: 'online',
    category: ['C'],
    icon: 'board',
    credit: { developedBy: ['Hajós Balázs'] }
  },
  TwoXsOneODE: {
    year: { k: 'XX. (26/27)', v: '26/27' },
    round: 'online',
    category: ['D', 'E'],
    icon: 'board',
    credit: { developedBy: ['Hajós Balázs'] }
  }
};
