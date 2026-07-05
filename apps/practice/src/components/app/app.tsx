import { StrictMode } from 'react';
import { createHashRouter, RouterProvider, Outlet } from 'react-router';
import { Overview } from '../overview/overview';
import { ErrorPage } from '../error-page';
import { LanguageProvider } from '../language';
import { ThemeProvider } from '../theme';
import { usePageviewTracking } from './use-pageview-tracking';

/*
Import all the games individually. Aim to keep abc ordering for easy navigation.
*/

import { AddReduceDouble } from '../games/add-reduce-double/add-reduce-double';
import { AmorAndCupido } from '../games/amor-and-cupido/amor-and-cupido';
import { AntiTicTacToe } from '../games/tictactoe-alikes/anti-tictactoe/anti-tictactoe';
import { ArchitectAndBandits } from '../games/architect-and-bandits/architect-and-bandits-a/architect-and-bandits-a';
import { ArchitectAndBanditsB } from '../games/architect-and-bandits/architect-and-bandits-b/architect-and-bandits-b';
import { Bacteria } from '../games/bacteria/bacteria';
import { BankRobbers } from '../games/bank-robbers/bank-robbers';
import { ChessBishops } from '../games/chess-bishops/chess-bishops';
import { ChessDucksC, ChessDucksE } from '../games/chess-ducks/chess-ducks';
import { ChessKnight } from '../games/chess-knight/chess-knight';
import { ChessRook } from '../games/chess-rook/chess-rook';
import { ChocolateBreaking } from '../games/chocolate-breaking/chocolate-breaking';
import { Coin123 } from '../games/coin-3-piles/coin123';
import { Coin357 } from '../games/coin-3-piles/coin357';
import { CubeColoring } from '../games/cube-coloring/cube-coloring';
import { DigitSubtraction } from '../games/digit-subtraction/digit-subtraction';
import { Dominoes4x4 } from '../games/dominoes-4x4/dominoes-4x4';
import { DominoesOnChessboard } from '../games/dominoes-on-chessboard/dominoes-on-chessboard';
import { DoublingReduction } from '../games/single-pile-removal/doubling-reduction/doubling-reduction';
import { FiveConnectedFields } from '../games/five-connected-fields/five-connected-fields';
import { FiveFiveCard } from '../games/five-five-card/five-five-card';
import { FiveSquares } from '../games/distinct-squares/five-squares/five-squares';
import { FourConnectedFields } from '../games/four-connected-fields/four-connected-fields';
import { FourPilesSpreadAhead } from '../games/four-piles-spread-ahead/four-piles-spread-ahead';
import { FourPilesTwoGrabs } from '../games/four-piles-two-grabs/four-piles-two-grabs';
import { HunyadiAndTheJanissaries } from '../games/hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
import { IncrementOrDouble } from '../games/single-number-increase/increment-or-double/increment-or-double';
import { LatinSquareFilling } from '../games/latin-square-filling/latin-square-filling';
import { MagicBox } from '../games/magic-box/magic-box-a/magic-box-a';
import { MagicBoxB } from '../games/magic-box/magic-box-b/magic-box-b';
import { MatchstickPiles } from '../games/matchstick-piles/matchstick-piles';
import { ModifiedMill } from '../games/modified-mill/modified-mill';
import { NumberCovering8, NumberCovering10 } from '../games/number-covering/number-covering';
import { NumberPyramid } from '../games/number-pyramid/number-pyramid';
import { PairsOfNumbers } from '../games/pairs-of-numbers/pairs-of-numbers';
import { PileSplitter } from '../games/pile-splitting-games/pile-splitter/pile-splitter';
import { PileSplitter3 } from '../games/pile-splitting-games/pile-splitter-3/pile-splitter-3';
import { PileSplitter4 } from '../games/pile-splitting-games/pile-splitter-4/pile-splitter-4';
import { PileUnion } from '../games/pile-union/pile-union';
import { PlusOneTwoThree } from '../games/single-number-increase/plus-one-two-three/plus-one-two-three';
import { PolicemanthiefA, PolicemanthiefB } from '../games/policeman-thief/policeman-thief-ab/policeman-thief-ab';
import { PolicemanthiefC } from '../games/policeman-thief/policeman-thief-c/policeman-thief-c';
import { PolynomialBuilding } from '../games/polynomial-building/polynomial-building';
import { PrimeExponentials } from '../games/single-pile-removal/prime-exponentials/prime-exponentials';
import { PrimelyToZero } from '../games/single-pile-removal/primely-to-zero/primely-to-zero';
import { RemoveDivisorMultiple } from '../games/remove-divisor-multiple/remove-divisor-multiple';
import { RemoveRowOrColumn } from '../games/remove-row-or-column/single/remove-row-or-column';
import { RemoveRowOrColumnE } from '../games/remove-row-or-column/multiple/remove-row-or-column-e';
import { RockPaperScissor } from '../games/rock-paper-scissor/rock-paper-scissor';
import { RookToCorner } from '../games/rook-to-corner/rook-to-corner';
import { SharkChase4 } from '../games/shark-chase/shark-4-by-4/shark-chase';
import { SharkChase5 } from '../games/shark-chase/shark-5-by-5/shark-chase';
import { SixDiscs, TenDiscs } from '../games/discs-turn-or-remove/discs-turn-or-remove';
import { SixFieldsCircle } from '../games/six-fields-circle/six-fields-circle';
import {
  StonesRemoveOneNotTwiceFromLeft
} from '../games/stones-remove-one-not-twice-from-left/stones-remove-one-not-twice-from-left';
import { SuperstitiousCounting } from '../games/single-number-increase/superstitious-counting/superstitious-counting';
import { Take1OrHalve } from '../games/single-pile-removal/take-1-or-halve/take-1-or-halve';
import { TakeAndPoint } from '../games/take-and-point/take-and-point';
import { TakePowerOfTwo } from '../games/single-pile-removal/take-power-of-two/take-power-of-two';
import { TenCoins } from '../games/ten-coins/ten-coins-c/ten-coins-c';
import { TenCoinsD } from '../games/ten-coins/ten-coins-d/ten-coins-d';
import { TenDigitNumber } from '../games/ten-digit-number/ten-digit-number';
import { ThiefSheriffMean7 } from '../games/thief-sheriff-mean/thief-sheriff-mean-7/thief-sheriff-mean-7';
import { ThiefSheriffMean9 } from '../games/thief-sheriff-mean/thief-sheriff-mean-9/thief-sheriff-mean-9';
import { ThreeMore } from '../games/single-pile-removal/three-more/three-more';
import { ThreePilesRebuild } from '../games/three-piles-rebuild/three-piles-rebuild';
import { TicTacToe } from '../games/tictactoe-alikes/tictactoe/tictactoe';
import { TicTacToeDoubleStart } from '../games/tictactoe-alikes/tictactoe-doublestart/tictactoe-doublestart';
import { TriangleColoring } from '../games/triangle-coloring/triangle-coloring';
import { TriangularGridRopes } from '../games/triangular-grid-ropes/triangular-grid-ropes';
import { TwelveSquares } from '../games/twelve-squares/twelve-squares';
import { TwoOfThreeTakeaway } from '../games/two-of-three-takeaway/two-of-three-takeaway';
import { TwoTimesTwo } from '../games/distinct-squares/two-times-two/two-times-two';
import { WaningStones } from '../games/single-pile-removal/waning-stones/waning-stones';

const RootLayout = () => {
  usePageviewTracking();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Outlet />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export const App = () => {
  const routes = [
    { path: '/', element: <Overview /> },
    { path: '/game/AddReduceDouble', element: <AddReduceDouble /> },
    { path: '/game/AmorAndCupido', element: <AmorAndCupido /> },
    { path: '/game/AntiTicTacToe', element: <AntiTicTacToe /> },
    { path: '/game/ArchitectAndBandits', element: <ArchitectAndBandits /> },
    { path: '/game/ArchitectAndBanditsB', element: <ArchitectAndBanditsB /> },
    { path: '/game/Bacteria', element: <Bacteria />},
    { path: '/game/BankRobbers', element: <BankRobbers /> },
    { path: '/game/ChessBishops', element: <ChessBishops /> },
    { path: '/game/ChessDucksC', element: <ChessDucksC />},
    { path: '/game/ChessDucksE', element: <ChessDucksE />},
    { path: '/game/ChessKnight', element: <ChessKnight />},
    { path: '/game/ChessRook', element: <ChessRook /> },
    { path: '/game/ChocolateBreaking', element: <ChocolateBreaking /> },
    { path: '/game/Coin123', element: <Coin123 /> },
    { path: '/game/Coin357', element: <Coin357 /> },
    { path: '/game/CubeColoring', element: <CubeColoring /> },
    { path: '/game/DigitSubtraction', element: <DigitSubtraction /> },
    { path: '/game/Dominoes4x4', element: <Dominoes4x4 /> },
    { path: '/game/DominoesOnChessboard', element: <DominoesOnChessboard />},
    { path: '/game/DoublingReduction', element: <DoublingReduction /> },
    { path: '/game/FiveConnectedFields', element: <FiveConnectedFields /> },
    { path: '/game/FiveFiveCard', element: <FiveFiveCard /> },
    { path: '/game/FiveSquares', element: <FiveSquares /> },
    { path: '/game/FourConnectedFields', element: <FourConnectedFields /> },
    { path: '/game/FourPilesSpreadAhead', element: <FourPilesSpreadAhead /> },
    { path: '/game/FourPilesTwoGrabs', element: <FourPilesTwoGrabs /> },
    { path: '/game/HunyadiAndTheJanissaries', element: <HunyadiAndTheJanissaries /> },
    { path: '/game/IncrementOrDouble', element: <IncrementOrDouble /> },
    { path: '/game/LatinSquareFilling', element: <LatinSquareFilling /> },
    { path: '/game/MagicBox', element: <MagicBox /> },
    { path: '/game/MagicBoxB', element: <MagicBoxB /> },
    { path: '/game/MatchstickPiles', element: <MatchstickPiles /> },
    { path: '/game/ModifiedMill', element: <ModifiedMill /> },
    { path: '/game/NumberCovering10', element: <NumberCovering10 /> },
    { path: '/game/NumberCovering8', element: <NumberCovering8 /> },
    { path: '/game/NumberPyramid', element: <NumberPyramid /> },
    { path: '/game/PairsOfNumbers', element: <PairsOfNumbers />},
    { path: '/game/PileSplitter', element: <PileSplitter /> },
    { path: '/game/PileSplitter3', element: <PileSplitter3 /> },
    { path: '/game/PileSplitter4', element: <PileSplitter4 /> },
    { path: '/game/PileUnion', element: <PileUnion /> },
    { path: '/game/PlusOneTwoThree', element: <PlusOneTwoThree />},
    { path: '/game/Policemanthief', element: <PolicemanthiefA />},
    { path: '/game/PolicemanthiefB', element: <PolicemanthiefB />},
    { path: '/game/PolicemanthiefC', element: <PolicemanthiefC />},
    { path: '/game/PolynomialBuilding', element: <PolynomialBuilding /> },
    { path: '/game/PrimeExponentials', element: <PrimeExponentials />},
    { path: '/game/PrimelyToZero', element: <PrimelyToZero />},
    { path: '/game/RemoveDivisorMultiple', element: <RemoveDivisorMultiple />},
    { path: '/game/RemoveRowOrColumn', element: <RemoveRowOrColumn />},
    { path: '/game/RemoveRowOrColumnE', element: <RemoveRowOrColumnE />},
    { path: '/game/rockPaperScissor', element: <RockPaperScissor /> },
    { path: '/game/RookToCorner', element: <RookToCorner /> },
    { path: '/game/SharkChase4', element: <SharkChase4 />},
    { path: '/game/SharkChase5', element: <SharkChase5 />},
    { path: '/game/SixDiscs', element: <SixDiscs />},
    { path: '/game/SixFieldsCircle', element: <SixFieldsCircle />},
    { path: '/game/StonesRemoveOneNotTwiceFromLeft', element: <StonesRemoveOneNotTwiceFromLeft />},
    { path: '/game/SuperstitiousCounting', element: <SuperstitiousCounting /> },
    { path: '/game/Take1OrHalve', element: <Take1OrHalve /> },
    { path: '/game/TakeAndPoint', element: <TakeAndPoint /> },
    { path: '/game/TakePowerOfTwo', element: <TakePowerOfTwo />},
    { path: '/game/TenCoins', element: <TenCoins /> },
    { path: '/game/TenCoinsD', element: <TenCoinsD /> },
    { path: '/game/TenDigitNumber', element: <TenDigitNumber /> },
    { path: '/game/TenDiscs', element: <TenDiscs />},
    { path: '/game/ThiefSheriffMean', element: <ThiefSheriffMean7 />},
    { path: '/game/ThiefSheriffMean9', element: <ThiefSheriffMean9 />},
    { path: '/game/ThreeMore', element: <ThreeMore /> },
    { path: '/game/ThreePilesRebuild', element: <ThreePilesRebuild /> },
    { path: '/game/TicTacToe', element: <TicTacToe /> },
    { path: '/game/TicTacToeDoubleStart', element: <TicTacToeDoubleStart /> },
    { path: '/game/TriangleColoring', element: <TriangleColoring />},
    { path: '/game/TriangularGridRopes', element: <TriangularGridRopes /> },
    { path: '/game/TwelveSquares', element: <TwelveSquares />},
    { path: '/game/TwoOfThreeTakeaway', element: <TwoOfThreeTakeaway /> },
    { path: '/game/TwoTimesTwo', element: <TwoTimesTwo /> },
    { path: '/game/WaningStones', element: <WaningStones /> }
  ];

  const router = createHashRouter([{
    element: <RootLayout />,
    children: [
      ...routes.map(route => ({ ...route, errorElement: <ErrorPage /> })),
      { path: '*', element: <ErrorPage /> }
    ]
  }]);

return <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>;
};
