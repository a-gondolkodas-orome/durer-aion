import { colors } from './gameplay';
import { nodeColors } from './cube-coloring';

describe('cube-coloring palette', () => {
  it('logic-side colors stay in sync with the styling palette nodeColors', () => {
    expect(Object.keys(nodeColors)).toEqual(colors);
  });
});
