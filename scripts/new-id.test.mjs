import { ENTITY_ID_PATTERN } from '../packages/schemas/src/competition';
import { newId } from './new-id.mjs';

describe('new-id.mjs', () => {
  it('makes ids the schema accepts', () => {
    for (const slug of ['hatszog-terulet', 'online-c', '20o']) {
      expect(newId(slug)).toMatch(ENTITY_ID_PATTERN);
      expect(newId(slug).endsWith(`--${slug}`)).toBe(true);
    }
  });

  it('makes a different id each time', () => {
    expect(newId('a')).not.toBe(newId('a'));
  });

  it.each(['Hatszog', 'hatszög', 'a--b', '-a', 'a_b', ''])('refuses the slug "%s"', (slug) => {
    expect(() => newId(slug)).toThrow();
  });
});
