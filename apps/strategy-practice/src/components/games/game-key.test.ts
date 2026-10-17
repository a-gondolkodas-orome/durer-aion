import { gameKeyOf } from './game-key';

describe('gameKeyOf', () => {
  it('reads the registered key off a game path', () => {
    expect(gameKeyOf('/game/ChessRook')).toBe('ChessRook');
  });

  it('matches as the router does: ignoring case and a trailing slash', () => {
    expect(gameKeyOf(`/game/${'ChessRook'.toUpperCase()}/`)).toBe('ChessRook');
  });

  it('is undefined for a path that names no game', () => {
    expect(gameKeyOf('/')).toBeUndefined();
    expect(gameKeyOf('/game/NoSuchGame')).toBeUndefined();
    expect(gameKeyOf('/game/ChessRook/rules')).toBeUndefined();
  });
});
