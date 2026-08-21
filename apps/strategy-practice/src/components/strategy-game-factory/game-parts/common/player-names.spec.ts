import { translate, type I18nString } from 'language';
import { DEFAULT_PLAYER_NAMES, resolvePlayerNames, havePlayerNameCollision } from './player-names';

const t = (texts: I18nString) => translate(texts, 'hu');
const [firstDefault, secondDefault] = DEFAULT_PLAYER_NAMES.map(t);

describe('resolvePlayerNames', () => {
  it('keeps the typed names', () => {
    expect(resolvePlayerNames(['Alice', 'Bob'], t)).toEqual(['Alice', 'Bob']);
  });

  it('fills in the default name of the seat left empty', () => {
    expect(resolvePlayerNames(['Alice', ''], t)).toEqual(['Alice', secondDefault]);
    expect(resolvePlayerNames([], t)).toEqual([firstDefault, secondDefault]);
  });

  it('treats a blank name as empty', () => {
    expect(resolvePlayerNames(['   ', 'Bob'], t)).toEqual([firstDefault, 'Bob']);
  });
});

describe('havePlayerNameCollision', () => {
  it('accepts two different names', () => {
    expect(havePlayerNameCollision(['Alice', 'Bob'], t)).toBe(false);
  });

  it('accepts both names left empty, since the defaults differ', () => {
    expect(havePlayerNameCollision(['', ''], t)).toBe(false);
    expect(havePlayerNameCollision([], t)).toBe(false);
  });

  it('rejects the same name typed twice, however it is capitalised', () => {
    expect(havePlayerNameCollision(['Alice', 'Alice'], t)).toBe(true);
    expect(havePlayerNameCollision(['Alice', 'alice'], t)).toBe(true);
  });

  it('rejects a typed default name next to an empty field', () => {
    expect(havePlayerNameCollision(['', firstDefault], t)).toBe(true);
    expect(havePlayerNameCollision([firstDefault, ''], t)).toBe(true);
    expect(havePlayerNameCollision(['', secondDefault], t)).toBe(true);
    expect(havePlayerNameCollision([secondDefault, ''], t)).toBe(true);
  });

  it('accepts a typed default name when the other player typed one too', () => {
    expect(havePlayerNameCollision([firstDefault, 'Bob'], t)).toBe(false);
  });
});
