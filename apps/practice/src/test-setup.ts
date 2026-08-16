/*
Registered via `test.setupFiles` in vite.config.js, so it applies to every test
file. Needed because of `isolate: false`: @testing-library/react's automatic
afterEach(cleanup) registers as a module-evaluation side effect, and with the
module cache shared per worker it only takes effect in the first test file that
imports it there. Later files in the same worker would accumulate rendered DOM
across tests ("Found multiple elements" flakes). Registering cleanup here makes
it run after every test in every file.
*/
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

/*
Deep-freeze every start board a game module exports, so that a spec editing one
in place throws where it does it.

These are module-scope values, and `isolate: false` shares one module registry
across every spec file in a worker — so `const board = startBoard` followed by
an in-place edit used to corrupt that board for every later file, surfacing as a
failure in an unrelated game and only in some file orderings. One reached a
deploy that way. The engine takes its own copy of a start board, so freezing
costs the games nothing; specs take theirs with `cloneDeep`.

Frozen here rather than at each export so it stays test-only, and so a board
added later is covered without anyone remembering to opt in.
*/
const boardModules = import.meta.glob(
  './components/games/**/{gameplay,start-boards}.ts', { eager: true }
) as Record<string, Record<string, unknown>>;

const deepFreeze = (value: unknown) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
};

for (const module of Object.values(boardModules)) {
  for (const [name, value] of Object.entries(module)) {
    if (/[Ss]tartBoards?/.test(name) && typeof value !== 'function') deepFreeze(value);
  }
}
