import { Link, useRouteError } from 'react-router';

export const ErrorPage = () => {
  const error = useRouteError() as { status?: number } | null;

  if (!error || error?.status === 404) {
    return <main className="p-2">
      <p>Sajnáljuk, a keresett oldal nem található.</p>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link to="/">Vissza a főoldalra / Back to home</Link>
    </main>;
  }
  return (
    <main>
      <p>Sajnáljuk, egy váratlan hiba történt.</p>
      <p>Sorry, an unexpected error occurred.</p>
      <Link to='/'>Vissza a főoldalra / Back to home</Link>
    </main>
  );
};
