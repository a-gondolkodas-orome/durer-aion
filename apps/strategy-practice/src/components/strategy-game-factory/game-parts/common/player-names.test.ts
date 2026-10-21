import { resolvePlayerNames, havePlayerNameCollision } from './player-names';

const defaults: [string, string] = ['1. játékos', '2. játékos'];
const [firstDefault, secondDefault] = defaults;

describe('resolvePlayerNames', () => {
  it('keeps the typed names', () => {
    expect(resolvePlayerNames(['Alice', 'Bob'], defaults)).toEqual(['Alice', 'Bob']);
  });

  it('fills in the default name of the seat left empty', () => {
    expect(resolvePlayerNames(['Alice', ''], defaults)).toEqual(['Alice', secondDefault]);
    expect(resolvePlayerNames([], defaults)).toEqual([firstDefault, secondDefault]);
  });

  it('treats a blank name as empty', () => {
    expect(resolvePlayerNames(['   ', 'Bob'], defaults)).toEqual([firstDefault, 'Bob']);
  });
});

describe('havePlayerNameCollision', () => {
  it('accepts two different names', () => {
    expect(havePlayerNameCollision(['Alice', 'Bob'], defaults)).toBe(false);
  });

  it('accepts both names left empty, since the defaults differ', () => {
    expect(havePlayerNameCollision(['', ''], defaults)).toBe(false);
    expect(havePlayerNameCollision([], defaults)).toBe(false);
  });

  it('rejects the same name typed twice, however it is capitalised', () => {
    expect(havePlayerNameCollision(['Alice', 'Alice'], defaults)).toBe(true);
    expect(havePlayerNameCollision(['Alice', 'alice'], defaults)).toBe(true);
  });

  it('rejects a typed default name next to an empty field', () => {
    expect(havePlayerNameCollision(['', firstDefault], defaults)).toBe(true);
    expect(havePlayerNameCollision([firstDefault, ''], defaults)).toBe(true);
    expect(havePlayerNameCollision(['', secondDefault], defaults)).toBe(true);
    expect(havePlayerNameCollision([secondDefault, ''], defaults)).toBe(true);
  });

  it('accepts a typed default name when the other player typed one too', () => {
    expect(havePlayerNameCollision([firstDefault, 'Bob'], defaults)).toBe(false);
  });
});
