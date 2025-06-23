import React from 'react';
import { Link, useRouteError } from 'react-router';

export const ErrorPage = () => {
  const error = useRouteError();

  if (error && error.status === 404) {
    return <main className="p-2">
      <p>
        Sajnáljuk, a keresett oldal nem található. Az alábbi gombra kattintva válassz egy játékot.
      </p>
      <Link
        to = "/"
        className="rounded-lg px-2 py-1 bg-blue-400 hover:bg-blue-600 focus:bg-blue-600 text-black"
      >Vissza a főoldalra</Link>
    </main>;
  }
  return (
    <main id="error-page">
      <p>Sajnáljuk, egy váratlan hiba történt.</p>
      <Link to='/'>Vissza a főoldalra</Link>
    </main>
  );
};
