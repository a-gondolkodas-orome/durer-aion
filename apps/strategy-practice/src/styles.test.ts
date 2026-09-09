import { describe, expect, it } from 'vitest';
import source from './styles.css?raw';

// A bare `:hover` sticks on a touch device: the tap that activates an element
// leaves it in its hover look, since nothing moves the pointer away. The
// `hocus` variant in styles.css skips hover while index.html reports touch use,
// and it is the only way this stylesheet may state a hover.
// (`css: true` in vite.config.js is what makes the import above deliver the
// file rather than vitest's empty stub.)
describe('styles.css', () => {
  it('states every hover through the hocus variant', () => {
    // Counted rather than cut out: a regex that removes the variant's own block
    // first is anchored on a brace, and once that brace moves it swallows
    // whatever follows — leaving the rules this is here to check unchecked.
    const hovers = source.replace(/\/\*[\s\S]*?\*\//g, '').match(/:hover|\bhover:/g);

    expect(hovers).toEqual([':hover']); // the one inside `@custom-variant hocus`
  });
});
