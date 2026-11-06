import { useLocation } from 'react-router';
import { gameList } from './gameList';

// The registered game a path shows. The router matches `/game/<key>` ignoring
// case and a trailing slash, so this does too: the path's own spelling would
// miss the catalog, the credits and the stats of a game the page still plays.
export const gameKeyOf = (pathname: string): string | undefined => {
  const segment = /^\/game\/([^/]+)\/?$/.exec(pathname)?.[1].toLowerCase();
  return segment === undefined ? undefined : Object.keys(gameList).find(key => key.toLowerCase() === segment);
};

export const useGameKey = () => gameKeyOf(useLocation().pathname);
