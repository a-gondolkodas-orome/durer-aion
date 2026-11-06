// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ErrorPage } from './error-page';

// react-router logs every error it catches; the two failing routes below are the
// point of the test, so their stack traces are noise.
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

const renderRouter = (route: object) => {
  const router = createMemoryRouter([route], { initialEntries: ['/'] });
  return render(<RouterProvider router={router} />);
};

const homeLink = () => screen.getByRole('link');

describe('ErrorPage', () => {
  it('says the page does not exist for an unmatched route, where there is no error to read', () => {
    renderRouter({ path: '*', element: <ErrorPage /> });

    expect(screen.getByText(/nem található/)).toBeDefined();
    expect(homeLink().getAttribute('href')).toBe('/');
  });

  it('says the same for a 404 thrown by a route', async () => {
    renderRouter({
      path: '/',
      loader: () => { throw new Response(null, { status: 404 }); },
      element: <div />,
      errorElement: <ErrorPage />,
      // a route with a loader renders this for the tick before the loader settles
      hydrateFallbackElement: <div />
    });

    expect(await screen.findByText(/nem található/)).toBeDefined();
  });

  it('reports an unexpected error separately, so a broken page is not read as a wrong address', () => {
    const Boom = () => { throw new Error('boom'); };
    renderRouter({ path: '/', element: <Boom />, errorElement: <ErrorPage /> });

    expect(screen.getByText(/váratlan hiba/)).toBeDefined();
    expect(screen.queryByText(/nem található/)).toBeNull();
  });
});
