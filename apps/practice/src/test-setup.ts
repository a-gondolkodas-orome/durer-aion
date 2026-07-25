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
