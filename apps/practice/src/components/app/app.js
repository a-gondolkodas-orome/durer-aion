import React, { StrictMode } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Overview } from '../overview/overview';
import { ErrorPage } from '../error-page';
import { AddReduceDouble } from '../games/pile-splitting-games/add-reduce-double/add-reduce-double';
import { AntiTicTacToe } from '../games/tictactoe-alikes/anti-tictactoe/anti-tictactoe';
import { ChessBishops } from '../games/chess-bishops/chess-bishops';
import { ChessRook } from '../games/chess-rook/chess-rook';
import { Coin123 } from '../games/coin-3-piles/coin123';
import { Coin357 } from '../games/coin-3-piles/coin357';
import { CubeColoring } from '../games/cube-coloring/cube-coloring';
import { FiveSquares } from '../games/five-squares/five-squares';
import { FourPilesSpreadAhead } from '../games/four-piles-spread-ahead/four-piles-spread-ahead';
import { HunyadiAndTheJanissaries } from '../games/hunyadi-and-the-janissaries/hunyadi-and-the-janissaries';
import { PileSplitter } from '../games/pile-splitting-games/pile-splitter/pile-splitter';
import { PileSplitter3 } from '../games/pile-splitting-games/pile-splitter-3/pile-splitter-3';
import { PileSplitter4 } from '../games/pile-splitting-games/pile-splitter-4/pile-splitter-4';
import { SuperstitiousCounting } from '../games/superstitious-counting/superstitious-counting';
import { TicTacToe } from '../games/tictactoe-alikes/tictactoe/tictactoe';
import { TicTacToeDoubleStart } from '../games/tictactoe-alikes/tictactoe-doublestart/tictactoe-doublestart';
import { TriangularGridRopes } from '../games/triangular-grid-ropes/triangular-grid-ropes';
import { TwoTimesTwo } from '../games/two-times-two/two-times-two';
import { RockPaperScissor } from '../games/rockPaperScissor/rockPaperScissor';
import { NumberCovering8, NumberCovering10 } from '../games/number-covering/number-covering';
import { TwelveSquares } from '../games/twelve-squares/twelve-squares';
import { Bacteria } from '../games/bacteria/bacteria';
import { SixDiscs, TenDiscs } from '../games/discs-turn-or-remove/discs-turn-or-remove';
import { PrimeExponentials } from '../games/prime-exponentials/prime-exponentials';

export const App = () => {
  const router = createHashRouter([
    { path: '/', element: <Overview />, errorElement: <ErrorPage /> },
    { path: '/game/AddReduceDouble', element: <AddReduceDouble /> },
    { path: '/game/AntiTicTacToe', element: <AntiTicTacToe /> },
    { path: '/game/ChessBishops', element: <ChessBishops /> },
    { path: '/game/ChessRook', element: <ChessRook /> },
    { path: '/game/Coin123', element: <Coin123 /> },
    { path: '/game/Coin357', element: <Coin357 /> },
    { path: '/game/CubeColoring', element: <CubeColoring /> },
    { path: '/game/FiveSquares', element: <FiveSquares /> },
    { path: '/game/FourPilesSpreadAhead', element: <FourPilesSpreadAhead /> },
    { path: '/game/HunyadiAndTheJanissaries', element: <HunyadiAndTheJanissaries /> },
    { path: '/game/PileSplitter', element: <PileSplitter /> },
    { path: '/game/PileSplitter3', element: <PileSplitter3 /> },
    { path: '/game/PileSplitter4', element: <PileSplitter4 /> },
    { path: '/game/SuperstitiousCounting', element: <SuperstitiousCounting /> },
    { path: '/game/TicTacToe', element: <TicTacToe /> },
    { path: '/game/TicTacToeDoubleStart', element: <TicTacToeDoubleStart /> },
    { path: '/game/TriangularGridRopes', element: <TriangularGridRopes /> },
    { path: '/game/TwoTimesTwo', element: <TwoTimesTwo /> },
    { path: '/game/rockPaperScissor', element: <RockPaperScissor /> },
    { path: '/game/NumberCovering8', element: <NumberCovering8 /> },
    { path: '/game/NumberCovering10', element: <NumberCovering10 /> },
    { path: '/game/TwelveSquares', element: <TwelveSquares />},
    { path: '/game/Bacteria', element: <Bacteria />},
    { path: '/game/SixDiscs', element: <SixDiscs />},
    { path: '/game/TenDiscs', element: <TenDiscs />},
    { path: '/game/PrimeExponentials', element: <PrimeExponentials />}
  ]);
  return <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>;
};
