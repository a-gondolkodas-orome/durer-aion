/*
Each element of gameList should look like the following:

```
// key should match path in router (app.js)
DominoesOnChessboard : {
  year: { k: 'III. (09/10)', v: '09/10' },
  round: 'döntő',
  category: ['C'],
  // name on card in overview list
  name: 'Sakktáblára Dominók',
  // optional, longer title to show on game page instead of name
  title: 'Sakktáblára Dominók felváltva',
  // Optional credit with optional suggestedBy and developedBy fields.
  // If present, both should be array even if only one person.
  credit: { suggestedBy: ['???'], developedBy: ['Czeller Ildikó'] }
}
```

When you add a new game, keep the order by year first, category second.
*/

export const gameList = {
  ChessBishops: {
    year: { k: "I. (07/08)", v: "07/08" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Futók lerakása", en: "Placing bishops" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  ChessRook: {
    year: { k: "I. (07/08)", v: "07/08" },
    round: "döntő",
    category: ["C"],
    name: { hu: "Barangolás bástyával", en: "Roaming with a rook" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  PrimeExponentials: {
    year: { k: "I. (07/08)", v: "07/08" },
    round: "döntő",
    category: ["D"],
    name: { hu: "Prímhatványok kivonása", en: "Subtract a prime power" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  DominoesOnChessboard: {
    year: { k: "III. (09/10)", v: "09/10" },
    round: "döntő",
    category: ["C"],
    name: { hu: "Sakktáblára dominók", en: "Dominoes on a chessboard" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  PlusOneTwoThree: {
    year: { k: "V. (11/12)", v: "11/12" },
    round: "döntő",
    category: ["A"],
    name: { hu: "+1, +2, +3", en: "+1, +2, +3" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  TenDigitNumber: {
    year: { k: "V. (11/12)", v: "11/12" },
    round: "döntő",
    category: ["D"],
    name: { hu: "Párbaj számjegyekkel", en: "Digit duel" }
  },
  TwelveSquares: {
    year: { k: "VI. (12/13)", v: "12/13" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Tizenkét mező", en: "Twelve squares" },
    credit: { developedBy: ["Melján Dávid"] }
  },
  HunyadiAndTheJanissaries: {
    year: { k: "VI. (12/13)", v: "12/13" },
    round: "döntő",
    category: ["D"],
    name: { hu: "Hunyadi és a janicsárok", en: "Hunyadi and the janissaries" },
    credit: { developedBy: ["Czeller Ildikó", "Schweitzer Ádám"] }
  },
  RockPaperScissor: {
    year: { k: "VII. (13/14)", v: "13/14" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Kő-papír-olló", en: "Rock-paper-scissors" },
    credit: { developedBy: ["Máté Lőrinc"] }
  },
  FiveFiveCard: {
    year: { k: "VII. (13/14)", v: "13/14" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Párbaj 5 lappal", en: "Duel with 5 cards" },
    credit: { developedBy: ["Máté Lőrinc"] }
  },
  TriangleColoring: {
    year: { k: "VII. (13/14)", v: "13/14" },
    round: "döntő",
    category: ["C"],
    name: { hu: "Háromszög színezés", en: "Triangle colouring" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  PileSplitter: {
    year: { k: "VIII. (14/15)", v: "14/15" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Kupac kettéosztó", en: "Pile splitter" },
    credit: { developedBy: ["Szűcs Gábor"] }
  },
  PileSplitter3: {
    year: { k: "VIII. (14/15)", v: "14/15" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Kupac kettéosztó 3 kupaccal", en: "Pile splitter (3 piles)" },
    credit: { developedBy: ["Soós Máté"] }
  },
  PileUnion: {
    year: { k: "VIII. (14/15)", v: "14/15" },
    round: "döntő",
    category: ["C"],
    name: { hu: "Kupac egyesítés", en: "Pile union" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  Policemanthief: {
    year: { k: "IX. (15/16)", v: "15/16" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Rendőrök, tolvaj (A)", en: "Policemen and thief (A)" },
    title: { hu: "Rendőrök, tolvaj (A kategória)", en: "Policemen and thief (category A)" },
    credit: { developedBy: ["Halasi Gergő"] }
  },
  PolicemanthiefB: {
    year: { k: "IX. (15/16)", v: "15/16" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Rendőrök, tolvaj (B)", en: "Policemen and thief (B)" },
    title: { hu: "Rendőrök, tolvaj (B kategória)", en: "Policemen and thief (category B)" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  SixDiscs: {
    year: { k: "X. (16/17)", v: "16/17" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Átfordítás, elvétel (6)", en: "Flip or remove (6)" },
    title: { hu: "Átfordítás, elvétel (6 korong)", en: "Flip or remove (6 discs)" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  TenDiscs: {
    year: { k: "X. (16/17)", v: "16/17" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Átfordítás, elvétel (10)", en: "Flip or remove (10)" },
    title: { hu: "Átfordítás, elvétel (10 korong)", en: "Flip or remove (10 discs)" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  Bacteria: {
    year: { k: "X. (16/17)", v: "16/17" },
    round: "döntő",
    category: ["C", "D"],
    name: { hu: "Baktériumok terjedése", en: "Spreading of bacteria" },
    credit: { developedBy: ["Tárkányi Damján"] }
  },
  NumberCovering8: {
    year: { k: "XI. (17/18)", v: "17/18" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Számok lefedése 1-től 8-ig", en: "Covering numbers 1 to 8" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  NumberCovering10: {
    year: { k: "XI. (17/18)", v: "17/18" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Számok lefedése 1-től 10-ig", en: "Covering numbers 1 to 10" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  TicTacToeDoubleStart: {
    year: { k: "XII. (18/19)", v: "18/19" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Duplánkezdő 3x3 amőba", en: "Double-starting tic-tac-toe" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  AntiTicTacToe: {
    year: { k: "XII. (18/19)", v: "18/19" },
    round: "döntő",
    category: ["B"],
    name: { hu: "3x3-as antiamőba", en: "3×3 anti-tic-tac-toe" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  TwoTimesTwo: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["A"],
    name: { hu: "4 mezőbe különbözőt", en: "4 distinct squares" },
    credit: { developedBy: ["Soós Máté"] }
  },
  FiveSquares: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["B"],
    name: { hu: "5 mezőbe különbözőt", en: "5 distinct squares" },
    credit: { developedBy: ["Soós Máté"] }
  },
  TicTacToe: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["C"],
    name: { hu: "Átszínezős tic-tac-toe", en: "Recolouring tic-tac-toe" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  SuperstitiousCounting: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["D", "E"],
    name: { hu: "Babonás lépkedés", en: "Superstitious counting" },
    credit: { developedBy: ["Soós Máté"] }
  },
  PileSplitter4: {
    year: { k: "XIII.(19/20)", v: "19/20" },
    round: "döntő",
    category: ["E+"],
    name: { hu: "Kupac kettéosztó 4 kupaccal", en: "Pile splitting (4 piles)" },
    credit: { developedBy: ["Soós Máté"] }
  },
  TriangularGridRopes: {
    year: { k: "XIV. (20/21)", v: "20/21" },
    round: "döntő",
    category: ["C", "D"],
    name: { hu: "10 totemoszlop", en: "10 totem poles" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  Coin357: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "döntő",
    category: ["A"],
    name: { hu: "15 érme beváltása", en: "Change 15 coins" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  Coin123: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Érmék beváltása", en: "Coin change" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  ChessDucksC: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "online",
    category: ["C"],
    name: { hu: "Békés kacsák (4 × 6)", en: "Peaceful ducks (4 × 6)" },
    title: { hu: "Békés kacsák a 4 × 6-os sakktáblán", en: "Peaceful ducks on the 4 × 6 board" },
    credit: { developedBy: ["Jánosik Áron"] }
  },
  CubeColoring: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "döntő",
    category: ["C", "D"],
    name: { hu: "Kockaszínezés", en: "Cube colouring" },
    credit: { suggestedBy: ["Nagy Kartal"], developedBy: ["Szűcs Gábor"] }
  },
  TakePowerOfTwo: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "online",
    category: ["D"],
    name: { hu: "Kettőhatványok kivonása", en: "Subtract 2^n" },
    credit: { developedBy: ["Jánosik Áron"] }
  },
  ChessDucksE: {
    year: { k: "XV. (21/22)", v: "21/22" },
    round: "online",
    category: ["E"],
    name: { hu: "Békés kacsák (4 × 7)", en: "Peaceful ducks (4 × 7)" },
    title: { hu: "Békés kacsák a 4 × 7-es sakktáblán", en: "Peaceful ducks on the 4 × 7 board" },
    credit: { developedBy: ["Jánosik Áron"] }
  },
  AddReduceDouble: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "döntő",
    category: ["D"],
    name: { hu: "Kettőt vesz, egyet kap", en: "Add N, take 2N" },
    credit: { suggestedBy: ["Imolay András"], developedBy: ["Matolcsi Dávid"] }
  },
  FourPilesSpreadAhead: {
    year: { k: "XVI. (22/23)", v: "22/23" },
    round: "döntő",
    category: ["E", "E+"],
    name: { hu: "4 kupacban előrepakolás", en: "4 piles: spread ahead" },
    credit: { suggestedBy: ["Fraknói Ádám"], developedBy: ["Matolcsi Dávid"] }
  },
  ArchitectAndBandits: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Építész és banditák (A)", en: "Architect and Bandits (A)" },
    title: { hu: "Építész és banditák (8 torony)", en: "Architect and Bandits (8 towers)" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  ArchitectAndBanditsB: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Építész és banditák (B)", en: "Architect and Bandits (B)" },
    title: { hu: "Építész és banditák (10 torony)", en: "Architect and Bandits (10 towers)" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  SharkChase4: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["C"],
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
    name: { hu: "Egyet vegyél vagy felezz", en: "Take one or halve" },
    credit: { developedBy: ["Jánosik Áron"] }
  },
  SharkChase5: {
    year: { k: "XVII. (23/24)", v: "23/24" },
    round: "döntő",
    category: ["D"],
    name: { hu: "Cápa üldözés (5 x 5)", en: "Shark chase (5 × 5)" },
    credit: {
      suggestedBy: ["Páhán Anita"],
      developedBy: ["Szemerédi Levente"]
    }
  },
  ThievesMean: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["A"],
    name: { hu: "Tolvajnál átlag (1-7)", en: "Thief's mean (1–7)" },
    credit: { developedBy: ["Turu Tamás"] }
  },
  ThievesMean9: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["B"],
    name: { hu: "Tolvajnál átlag (1-9)", en: "Thief's mean (1–9)" },
    credit: { developedBy: ["Czeller Ildikó", "Turu Tamás"] }
  },
  ChessKnight: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["C", "D"],
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
    name: { hu: "Bankrablók: 7-10 bank", en: "Bank robbers: 7–10 banks" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  PairsOfNumbers: {
    year: { k: "XVIII. (24/25)", v: "24/25" },
    round: "döntő",
    category: ["E", "E+"],
    name: { hu: "Számpár módosítás", en: "Pairs of numbers" },
    credit: { developedBy: ["Czeller Ildikó"] }
  },
  RemoveDivisorMultiple: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "online",
    category: ["C", "D"],
    name: { hu: "Osztó/többszörös törlés", en: "Remove a divisor/multiple" },
    credit: { developedBy: ["Hajós Balázs"] }
  },
  StonesRemoveOneNotTwiceFromLeft: {
    year: { k: "XIX. (25/26)", v: "25/26" },
    round: "online",
    category: ["E"],
    name: { hu: "Kavicsgyűjtés egyesével", en: "Collecting stones 1 by 1" },
    credit: { developedBy: ["Turu Tamás"] }
  }
};
