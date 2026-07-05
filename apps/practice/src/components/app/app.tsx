import { StrictMode, type ComponentType } from 'react';
import { createHashRouter, RouterProvider, Outlet } from 'react-router';
import { Overview } from '../overview/overview';
import { ErrorPage } from '../error-page';
import { LanguageProvider } from '../language';
import { ThemeProvider } from '../theme';
import { usePageviewTracking } from './use-pageview-tracking';
import { gameList } from '../games/gameList';
import * as gameComponents from '../games';

const components = gameComponents as Record<string, ComponentType>;

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
  const gameRoutes = Object.keys(gameList).map(gameId => {
    const Game = components[gameId];
    return { path: `/game/${gameId}`, element: <Game /> };
  });

  const routes = [
    { path: '/', element: <Overview /> },
    ...gameRoutes
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
