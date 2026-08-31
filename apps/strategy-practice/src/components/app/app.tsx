import { StrictMode, type ComponentType } from 'react';
import { createHashRouter, RouterProvider, Outlet } from 'react-router';
import { Overview } from '../overview/overview';
import { ErrorPage } from '../error-page/error-page';
import { LanguageProvider } from 'language';
import { ThemeProvider } from '../../theme';
import { usePageviewTracking } from '../../tracking';
import { gameList } from '../games/gameList';
import * as gameComponents from '../games';

const components = gameComponents as Record<string, ComponentType>;

const RootLayout = () => {
  usePageviewTracking();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
          <Outlet />
          <footer className="mt-auto text-center text-slate-500 dark:text-slate-400 text-xs py-4">
            <div>{import.meta.env.VITE_GIT_COMMIT_HASH}</div>
          </footer>
        </div>
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
