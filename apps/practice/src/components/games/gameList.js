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
*/

export const gameList = {
  FiveFiveCard: {
    year: { k: 'VII. (13/14)', v: '13/14' },
    round: 'döntő',
    category: ['B'],
    name: 'Párbaj 5 lappal',
    credit: { developedBy: ['Máté Lőrinc'] }
  }
  , RockPaperScissor: {
    year: { k: 'VII. (13/14)', v: '13/14' },
    round: 'döntő',
    category: ['A'],
    name: 'Kő-papír-olló',
    credit: { developedBy: ['Máté Lőrinc'] }
  }
  , ChessBishops: {
    year: { k: 'I. (07/08)', v: '07/08' },
    round: 'döntő',
    category: ['B'],
    name: 'Futók lerakása',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , ChessRook: {
    year: { k: 'I. (07/08)', v: '07/08' },
    round: 'döntő',
    category: ['C'],
    name: 'Barangolás bástyával',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , HunyadiAndTheJanissaries: {
    year: { k: 'VI. (12/13)', v: '12/13' },
    round: 'döntő',
    category: ['D'],
    name: 'Hunyadi és a janicsárok',
    credit: { developedBy: ['Czeller Ildikó', 'Schweitzer Ádám'] }
  }
  , PileSplitter: {
    year: { k: 'VIII. (14/15)', v: '14/15' },
    round: 'döntő',
    category: ['A'],
    name: 'Kupac kettéosztó',
    credit: { developedBy: ['Szűcs Gábor'] }
  }
  , PileSplitter3: {
    year: { k: 'VIII. (14/15)', v: '14/15' },
    round: 'döntő',
    category: ['B'],
    name: 'Kupac kettéosztó 3 kupaccal',
    credit: { developedBy: ['Soós Máté'] }
  }
  , TicTacToeDoubleStart: {
    year: { k: 'XII. (18/19)', v: '18/19' },
    round: 'döntő',
    category: ['A'],
    name: 'Duplánkezdő 3x3 amőba',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , AntiTicTacToe: {
    year: { k: 'XII. (18/19)', v: '18/19' },
    round: 'döntő',
    category: ['B'],
    name: '3x3-as antiamőba',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , TwoTimesTwo: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['A'],
    name: '4 mezőbe különbözőt',
    credit: { developedBy: ['Soós Máté'] }
  }
  , FiveSquares: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['B'],
    name: '5 mezőbe különbözőt',
    credit: { developedBy: ['Soós Máté'] }
  }
  , TicTacToe: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['C'],
    name: 'Átszínezős tic-tac-toe',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , SuperstitiousCounting: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['D', 'E'],
    name: 'Babonás lépkedés',
    credit: { developedBy: ['Soós Máté'] }
  }
  , PileSplitter4: {
    year: { k: 'XIII.(19/20)', v: '19/20' },
    round: 'döntő',
    category: ['E+'],
    name: 'Kupac kettéosztó 4 kupaccal',
    credit: { developedBy: ['Soós Máté'] }
  }
  , TriangularGridRopes: {
    year: { k: 'XIV. (20/21)', v: '20/21' },
    round: 'döntő',
    category: ['C', 'D'],
    name: '10 totemoszlop',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , Coin357: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'döntő',
    category: ['A'],
    name: '15 érme beváltása',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , Coin123: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'döntő',
    category: ['B'],
    name: 'Érmék beváltása',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , CubeColoring: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'döntő',
    category: ['C', 'D'],
    name: 'Kockaszínezés',
    credit: { suggestedBy: ['Nagy Kartal'], developedBy: ['Szűcs Gábor'] }
  }
  , AddReduceDouble: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'döntő',
    category: ['D'],
    name: 'Kettőt vesz, egyet kap',
    credit: { suggestedBy: ['Imolay András'], developedBy: ['Matolcsi Dávid'] }
  }
  , FourPilesSpreadAhead: {
    year: { k: 'XVI. (22/23)', v: '22/23' },
    round: 'döntő',
    category: ['E', 'E+'],
    name: '4 kupacban előrepakolás',
    credit: { suggestedBy: ['Fraknói Ádám'], developedBy: ['Matolcsi Dávid'] }
  }
  , NumberCovering8: {
    year: { k: 'XI. (17/18)', v: '17/18' },
    round: 'döntő',
    category: ['A'],
    name: 'Számok lefedése 1-től 8-ig',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , NumberCovering10: {
    year: { k: 'XI. (17/18)', v: '17/18' },
    round: 'döntő',
    category: ['B'],
    name: 'Számok lefedése 1-től 10-ig',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , TwelveSquares: {
    year: { k: 'VI. (12/13)', v: '12/13' },
    round: 'döntő',
    category: ['A'],
    name: 'Tizenkét mező',
    credit: { developedBy: ['Melján Dávid'] }
  }
  , Bacteria: {
    year: { k: 'X. (16/17)', v: '16/17' },
    round: 'döntő',
    category: ['C', 'D'],
    name: 'Baktériumok terjedése',
    credit: { developedBy: ['Tárkányi Damján'] }
  }
  , SixDiscs: {
    year: { k: 'X. (16/17)', v: '16/17' },
    round: 'döntő',
    category: ['A'],
    name: 'Átfordítás, elvétel (6)',
    title: 'Átfordítás, elvétel (6 korong)',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , TenDiscs: {
    year: { k: 'X. (16/17)', v: '16/17' },
    round: 'döntő',
    category: ['B'],
    name: 'Átfordítás, elvétel (10)',
    title: 'Átfordítás, elvétel (10 korong)',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , PrimeExponentials: {
    year: { k: 'I. (07/08)', v: '07/08' },
    round: 'döntő',
    category: ['D'],
    name: 'Prímhatványok kivonása',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , Policemanthief: {
    year: { k: 'IX. (15/16)', v: '15/16' },
    round: 'döntő',
    category: ['A'],
    name: 'Rendőr, tolvaj',
    credit: { developedBy: ['Halasi Gergő'] }
  }
  , SharkChase4: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'döntő',
    category: ['C'],
    name: 'Cápa üldözés (4 x 4)',
    credit: { suggestedBy: ['Páhán Anita'], developedBy: ['Csizmadia Miklós', 'Kempf Alex'] }
  }
  , SharkChase5: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'döntő',
    category: ['D'],
    name: 'Cápa üldözés (5 x 5)',
    credit: { suggestedBy: ['Páhán Anita'], developedBy: ['Szemerédi Levente'] }
  }
  , PlusOneTwoThree: {
    year: { k: 'V. (11/12)', v: '11/12' },
    round: 'döntő',
    category: ['A'],
    name: '+1, +2, +3',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , BankRobbers: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'online',
    category: ['C', 'D', 'E'],
    name: 'Bankrablók: 7-10 bank',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , Take1OrHalve: {
    year: { k: 'XVII. (23/24)', v: '23/24' },
    round: 'online',
    category: ['C', 'D', 'E'],
    name: 'Egyet vegyél vagy felezz',
    credit: { developedBy: ['Jánosik Áron'] }
  }
  , ChessDucksC: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'online',
    category: ['C'],
    name: 'Békés kacsák (4 × 6)',
    title: 'Békés kacsák a 4 × 6-os sakktáblán',
    credit: { developedBy: ['Jánosik Áron'] }
  }
  , ChessDucksE: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'online',
    category: ['E'],
    name: 'Békés kacsák (4 × 7)',
    title: 'Békés kacsák a 4 × 7-es sakktáblán',
    credit: { developedBy: ['Jánosik Áron'] }
  }
  , TakePowerOfTwo: {
    year: { k: 'XV. (21/22)', v: '21/22' },
    round: 'online',
    category: ['D'],
    name: 'Kettőhatványok kivonása',
    credit: { developedBy: ['Jánosik Áron'] }
  }
  , ThievesMean: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['A'],
    name: 'Tolvajnál átlag (1-7)',
    credit: { developedBy: ['Turu Tamás'] }
  }
  , ThievesMean9: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['B'],
    name: 'Tolvajnál átlag (1-9)',
    credit: { developedBy: ['Czeller Ildikó', 'Turu Tamás'] }
  }
  , TriangleColoring: {
    year: { k: 'VII. (13/14)', v: '13/14' },
    round: 'döntő',
    category: ['C'],
    name: 'Háromszög színezés',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , DominoesOnChessboard : {
    year: { k: 'III. (09/10)', v: '09/10' },
    round: 'döntő',
    category: ['C'],
    name: 'Sakktáblára Dominók',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , PairsOfNumbers: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['E', 'E+'],
    name: 'Számpár módosítás',
    credit: { developedBy: ['Czeller Ildikó'] }
  }
  , ChessKnight: {
    year: { k: 'XVIII. (24/25)', v: '24/25' },
    round: 'döntő',
    category: ['C', 'D'],
    name: 'Barangolás huszárral',
    credit: { suggestedBy: ['Hegedűs Dániel'], developedBy: ['Czeller Ildikó'] }
  }
  , RemoveDivisorMultiple: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'online',
    category: ['C', 'D'],
    name: 'Osztó/Többszörös Törlés',
    credit: { developedBy: ['Hajós Balázs'] }
  }
  , StonesRemoveOneNotTwiceFromLeft: {
    year: { k: 'XIX. (25/26)', v: '25/26' },
    round: 'online',
    category: ['E'],
    name: 'Kavicsgyűjtés egyesével',
    credit: { developedBy: ['Turu Tamás'] }
  }
};
