import { describe, it, expect } from 'vitest';
import { escapeLike } from './db';

describe('escapeLike', () => {
  it('leaves an ordinary fragment alone', () => {
    expect(escapeLike('Budapest')).toBe('Budapest');
  });

  it('escapes the wildcards and the escape character itself', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('back\\slash')).toBe('back\\\\slash');
  });
});
