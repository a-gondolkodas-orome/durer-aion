import React, { StrictMode } from 'react';
import { createHashRouter, RouterProvider } from 'react-router';
import { Overview } from '../overview/overview';
import { ErrorPage } from '../error-page';

/*
Import all the games individually. Aim to keep abc ordering for easy navigation.
*/

import { AddReduceDouble } from '../games/pile-splitting-games/add-reduce-double/add-reduce-double';
import { AntiTicTacToe } from '../games/tictactoe-alikes/anti-tictactoe/anti-tictactoe';
import { Bacteria } from '../games/bacteria/bacteria';
import { BankRobbers } from '../games/bank-robbers/bank-robbers';
import { ChessBishops } from '../games/chess-bishops/chess-bishops';
import { ChessDucksC, ChessDucksE } from '../games/chess-ducks/chess-ducks';
import { ChessKnight } from '../games/chess-knight/chess-knight';
import { ChessRook } from '../games/chess-rook/chess-rook';
import { Coin123 } from '../games/coin-3-piles/coin123';
import { Coin357 } from '../games/coin-3-piles/coin357';
import { CubeColoring } from '../games/cube-coloring/cube-coloring';
import { DominoesOnChessboard } from '../games/dominoes-on-chessboard/dominoes-on-chessboard';
import { FiveFiveCard } from '../games/five-five-card/five-five-card';
import { FiveSquares } from '../games/five-squares/five-squares';
import { FourPilesSpreadAhead } from '../games/pile-splitting-games/four-piles-spread-ahead/four-piles-spread-ahead';
import { HunyadiAndTheJanissaries } from '../games/hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
import { NumberCovering8, NumberCovering10 } from '../games/number-covering/number-covering';
import { PairsOfNumbers } from '../games/pairs-of-numbers/pairs-of-numbers';
import { PileSplitter } from '../games/pile-splitting-games/pile-splitter/pile-splitter';
import { PileSplitter3 } from '../games/pile-splitting-games/pile-splitter-3/pile-splitter-3';
import { PileSplitter4 } from '../games/pile-splitting-games/pile-splitter-4/pile-splitter-4';
import { PlusOneTwoThree } from '../games/plus-one-two-three/plus-one-two-three';
import { PolicemanthiefA, PolicemanthiefB } from '../games/policeman-thief/policeman-thief';
import { PrimeExponentials } from '../games/prime-exponentials/prime-exponentials';
import { RemoveDivisorMultiple } from '../games/remove-divisor-multiple/remove-divisor-multiple';
import { RockPaperScissor } from '../games/rock-paper-scissor/rock-paper-scissor';
import { SharkChase4 } from '../games/shark-chase/shark-4-by-4/shark-chase';
import { SharkChase5 } from '../games/shark-chase/shark-5-by-5/shark-chase';
import { SixDiscs, TenDiscs } from '../games/discs-turn-or-remove/discs-turn-or-remove';
import { StonesRemoveOneNotTwiceFromLeft } from '../games/stones-remove-one-not-twice-from-left/stones-remove-one-not-twice-from-left';
import { SuperstitiousCounting } from '../games/superstitious-counting/superstitious-counting';
import { Take1OrHalve } from '../games/take-1-or-halve/take-1-or-halve';
import { TakePowerOfTwo } from '../games/take-power-of-two/take-power-of-two';
import { ThievesMean7 } from '../games/thieves-mean/thieves-mean-7/thieves-mean-7';
import { ThievesMean9 } from '../games/thieves-mean/thieves-mean-9/thieves-mean-9';
import { TicTacToe } from '../games/tictactoe-alikes/tictactoe/tictactoe';
import { TicTacToeDoubleStart } from '../games/tictactoe-alikes/tictactoe-doublestart/tictactoe-doublestart';
import { TriangleColoring } from '../games/triangle-coloring/triangle-coloring';
import { TriangularGridRopes } from '../games/triangular-grid-ropes/triangular-grid-ropes';
import { TwelveSquares } from '../games/twelve-squares/twelve-squares';
import { TwoTimesTwo } from '../games/two-times-two/two-times-two';

export const App = () => {
  const routes = [
    { path: '/', element: <Overview /> },
    { path: '/game/AddReduceDouble', element: <AddReduceDouble /> },
    { path: '/game/AntiTicTacToe', element: <AntiTicTacToe /> },
    { path: '/game/Bacteria', element: <Bacteria />},
    { path: '/game/BankRobbers', element: <BankRobbers /> },
    { path: '/game/ChessBishops', element: <ChessBishops /> },
    { path: '/game/ChessDucksC', element: <ChessDucksC />},
    { path: '/game/ChessDucksE', element: <ChessDucksE />},
    { path: '/game/ChessKnight', element: <ChessKnight />},
    { path: '/game/ChessRook', element: <ChessRook /> },
    { path: '/game/Coin123', element: <Coin123 /> },
    { path: '/game/Coin357', element: <Coin357 /> },
    { path: '/game/CubeColoring', element: <CubeColoring /> },
    { path: '/game/DominoesOnChessboard', element: <DominoesOnChessboard />},
    { path: '/game/FiveFiveCard', element: <FiveFiveCard /> },
    { path: '/game/FiveSquares', element: <FiveSquares /> },
    { path: '/game/FourPilesSpreadAhead', element: <FourPilesSpreadAhead /> },
    { path: '/game/HunyadiAndTheJanissaries', element: <HunyadiAndTheJanissaries /> },
    { path: '/game/NumberCovering10', element: <NumberCovering10 /> },
    { path: '/game/NumberCovering8', element: <NumberCovering8 /> },
    { path: '/game/PairsOfNumbers', element: <PairsOfNumbers />},
    { path: '/game/PileSplitter', element: <PileSplitter /> },
    { path: '/game/PileSplitter3', element: <PileSplitter3 /> },
    { path: '/game/PileSplitter4', element: <PileSplitter4 /> },
    { path: '/game/PlusOneTwoThree', element: <PlusOneTwoThree />},
    { path: '/game/Policemanthief', element: <PolicemanthiefA />},
    { path: '/game/PolicemanthiefB', element: <PolicemanthiefB />},
    { path: '/game/PrimeExponentials', element: <PrimeExponentials />},
    { path: '/game/RemoveDivisorMultiple', element: <RemoveDivisorMultiple />},
    { path: '/game/rockPaperScissor', element: <RockPaperScissor /> },
    { path: '/game/SharkChase4', element: <SharkChase4 />},
    { path: '/game/SharkChase5', element: <SharkChase5 />},
    { path: '/game/SixDiscs', element: <SixDiscs />},
    { path: '/game/StonesRemoveOneNotTwiceFromLeft', element: <StonesRemoveOneNotTwiceFromLeft />},
    { path: '/game/SuperstitiousCounting', element: <SuperstitiousCounting /> },
    { path: '/game/Take1OrHalve', element: <Take1OrHalve /> },
    { path: '/game/TakePowerOfTwo', element: <TakePowerOfTwo />},
    { path: '/game/TenDiscs', element: <TenDiscs />},
    { path: '/game/ThievesMean', element: <ThievesMean7 />},
    { path: '/game/ThievesMean9', element: <ThievesMean9 />},
    { path: '/game/TicTacToe', element: <TicTacToe /> },
    { path: '/game/TicTacToeDoubleStart', element: <TicTacToeDoubleStart /> },
    { path: '/game/TriangleColoring', element: <TriangleColoring />},
    { path: '/game/TriangularGridRopes', element: <TriangularGridRopes /> },
    { path: '/game/TwelveSquares', element: <TwelveSquares />},
    { path: '/game/TwoTimesTwo', element: <TwoTimesTwo /> }
  ];

  const router = createHashRouter(
    routes.map(route => ({...route, errorElement: <ErrorPage /> }))
  );

return <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>;
};
