/*
Barrel re-exporting every game's page component under its `gameList` key. The
router (`app.tsx`) loops over `gameList` and looks each key up in this module's
namespace, so a game's route is its key and nothing else.

This is the component-wiring half of the pair; game metadata lives in the sibling
`gameList.ts`, kept separate so metadata-only consumers (the overview homepage,
game chrome) don't pull the whole game-component graph into their bundle. This
barrel is imported in exactly one runtime place — the router.

Each game is listed here exactly once. Where a component's export name differs
from the key, alias it on re-export (`export { PolicemanthiefA as Policemanthief }`).
That indirection is the point: renaming or moving a component only touches its
line here — the key, and therefore the route, never changes. Keep entries in abc
order by key. `gameList.spec.ts` guards that this set of keys and
`gameList` stay in one-to-one sync.
*/

export { AddReduceDouble } from './add-reduce-double/add-reduce-double';
export { AmorAndCupido } from './amor-and-cupido/amor-and-cupido';
export { AntiTicTacToe } from './tictactoe-alikes/anti-tictactoe/anti-tictactoe';
export { ArchitectAndBandits } from './architect-and-bandits/architect-and-bandits-a/architect-and-bandits-a';
export { ArchitectAndBanditsB } from './architect-and-bandits/architect-and-bandits-b/architect-and-bandits-b';
export { Bacteria } from './bacteria/bacteria';
export { BankRobbers } from './bank-robbers/bank-robbers';
export { ChessBishops } from './chess-bishops/chess-bishops';
export { ChessDucks } from './chess-ducks/chess-ducks';
export { ChessKnight } from './chess-knight/chess-knight';
export { ChessRook } from './chess-rook/chess-rook';
export { ChocolateBreaking } from './chocolate-breaking/chocolate-breaking';
export { CoinsIn3Piles } from './coins-in-3-piles/coins-in-3-piles';
export { CubeColoring } from './cube-coloring/cube-coloring';
export { DigitSubtraction } from './digit-subtraction/digit-subtraction';
export { Dominoes4x4 } from './dominoes-4x4/dominoes-4x4';
export { DominoesOnChessboard } from './dominoes-on-chessboard/dominoes-on-chessboard';
export { DoublingReduction } from './single-pile-removal/doubling-reduction/doubling-reduction';
export { FiveConnectedFields } from './five-connected-fields/five-connected-fields';
export { FiveFiveCard } from './five-five-card/five-five-card';
export { FiveSquares } from './distinct-squares/five-squares/five-squares';
export { FourConnectedFields } from './four-connected-fields/four-connected-fields';
export { FourPilesSpreadAhead } from './four-piles-spread-ahead/four-piles-spread-ahead';
export { FourPilesTwoGrabs } from './four-piles-two-grabs/four-piles-two-grabs';
export { HunyadiAndTheJanissaries } from './hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
export { IncrementOrDouble } from './single-number-increase/increment-or-double/increment-or-double';
export { LatinSquareFilling } from './latin-square-filling/latin-square-filling';
export { MagicBox } from './magic-box/magic-box-a/magic-box-a';
export { MagicBoxB } from './magic-box/magic-box-b/magic-box-b';
export { MatchesOnEdges } from './matches-on-edges/matches-on-edges';
export { MatchstickPiles } from './matchstick-piles/matchstick-piles';
export { ModifiedMill } from './modified-mill/modified-mill';
export { NumberCovering } from './number-covering/number-covering';
export { NumberPyramid } from './number-pyramid/number-pyramid';
export { PairsOfNumbers } from './pairs-of-numbers/pairs-of-numbers';
export { PileSplitter } from './pile-splitting-games/pile-splitter/pile-splitter';
export { PileSplitter3 } from './pile-splitting-games/pile-splitter-3/pile-splitter-3';
export { PileSplitter4 } from './pile-splitting-games/pile-splitter-4/pile-splitter-4';
export { PileUnion } from './pile-union/pile-union';
export { PlusOneTwoThree } from './single-number-increase/plus-one-two-three/plus-one-two-three';
export { Policemanthief } from './policeman-thief/policeman-thief-ab/policeman-thief-ab';
export { PolicemanthiefC } from './policeman-thief/policeman-thief-c/policeman-thief-c';
export { PolynomialBuilding } from './polynomial-building/polynomial-building';
export { PrimeExponentials } from './single-pile-removal/prime-exponentials/prime-exponentials';
export { PrimelyToZero } from './single-pile-removal/primely-to-zero/primely-to-zero';
export { RecolouringDiscs } from './recolouring-discs/recolouring-discs';
export { RemoveDivisorMultiple } from './remove-divisor-multiple/remove-divisor-multiple';
export { RemoveRowOrColumn } from './remove-row-or-column/remove-row-or-column';
export { RockPaperScissor } from './rock-paper-scissor/rock-paper-scissor';
export { RookToCorner } from './rook-to-corner/rook-to-corner';
export { SharkChase4 } from './shark-chase/shark-4-by-4/shark-chase';
export { SharkChase5 } from './shark-chase/shark-5-by-5/shark-chase';
export { DiscsFlipOrRemove } from './discs-flip-or-remove/discs-flip-or-remove';
export { SixFieldsCircle } from './six-fields-circle/six-fields-circle';
export {
  StonesRemoveOneNotTwiceFromLeft
} from './stones-remove-one-not-twice-from-left/stones-remove-one-not-twice-from-left';
export { SumFifteen } from './sum-fifteen/sum-fifteen';
export { SuperstitiousCounting } from './single-number-increase/superstitious-counting/superstitious-counting';
export { Take1OrHalve } from './single-pile-removal/take-1-or-halve/take-1-or-halve';
export { TakeAndPoint } from './take-and-point/take-and-point';
export { TakePowerOfTwo } from './single-pile-removal/take-power-of-two/take-power-of-two';
export { TenCoins } from './ten-coins/ten-coins';
export { TenDigitNumber } from './ten-digit-number/ten-digit-number';
export { ThiefSheriffMean7 as ThiefSheriffMean } from './thief-sheriff-mean/thief-sheriff-mean-7/thief-sheriff-mean-7';
export { ThiefSheriffMean9 } from './thief-sheriff-mean/thief-sheriff-mean-9/thief-sheriff-mean-9';
export { ThreeMore } from './single-pile-removal/three-more/three-more';
export { ThreePilesRebuild } from './three-piles-rebuild/three-piles-rebuild';
export { TicTacToe } from './tictactoe-alikes/tictactoe/tictactoe';
export { TicTacToeDoubleStart } from './tictactoe-alikes/tictactoe-doublestart/tictactoe-doublestart';
export { TriangleCircleGame } from './triangle-circle-game/triangle-circle-game';
export { TriangleColoring } from './triangle-coloring/triangle-coloring';
export { TriangularGridRopes } from './totem-poles/triangular-grid-ropes-10/triangular-grid-ropes-10';
export { TriangularGridRopes15 } from './totem-poles/triangular-grid-ropes-15/triangular-grid-ropes-15';
export { TwelveSquares } from './twelve-squares/twelve-squares';
export { TwoOfThreeTakeaway } from './two-of-three-takeaway/two-of-three-takeaway';
export { TwoTimesTwo } from './distinct-squares/two-times-two/two-times-two';
export { WaningStones } from './single-pile-removal/waning-stones/waning-stones';
