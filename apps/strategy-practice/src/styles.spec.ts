import { describe, expect, it } from 'vitest';
import source from './styles.css?raw';

// A bare `:hover` sticks on a touch device: the tap that activates an element
// leaves it in its hover look, since nothing moves the pointer away. The
// `hocus` variant in styles.css skips hover while index.html reports touch use,
// and it is the only way this stylesheet may state a hover.
describe('styles.css', () => {
  const rules = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@custom-variant hocus \{[\s\S]*?\n\}/, '');

  it('states every hover through the hocus variant', () => {
    expect(rules).not.toMatch(/:hover/);
    expect(rules).not.toMatch(/\bhover:/);
  });
});
