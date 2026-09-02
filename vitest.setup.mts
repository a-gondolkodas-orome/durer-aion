/*
Registered via `test.setupFiles`, so it applies to every test file.

A run writes its report and nothing else, so a real message stands out. Anything
the code under test logs breaks that: issue #294 was a run buried under a few
hundred lines of state dumps, ads and React warnings, and once cleaned up the
noise came back within days, because nothing stopped the next stray
`console.log` from landing. So console output is a failure here, named against
the test that wrote it, rather than a line that scrolls past.

A test that exercises a logging path on purpose stubs the method:
`vi.spyOn(console, 'error').mockImplementation(() => undefined)` replaces the
recorder below for that test, and hands the test the calls to assert on.
*/
import { afterAll, afterEach } from 'vitest';
import { format } from 'node:util';

const written: string[] = [];

// `log`, `info`, `warn` and `error` are what leaks in practice; the rest are
// here so that reaching for one of them is not a way around this.
const writingMethods = ['debug', 'dir', 'error', 'info', 'log', 'table', 'trace', 'warn'] as const;

for (const method of writingMethods) {
  console[method] = (...args: unknown[]) => {
    written.push(`console.${method}: ${format(...args)}`);
  };
}

function failOnConsoleOutput() {
  if (written.length === 0) return;
  // Emptied as it is read, so one noisy test does not fail every later one.
  const lines = written.splice(0).join('\n');
  throw new Error(
    `Wrote to the console, which the test report is meant to have to itself:\n${lines}\n`
    + 'Drop the call, or stub the method if the test means to exercise a logging path.'
  );
}

// afterEach names the test that wrote; afterAll takes the rest — what a module
// wrote as it loaded, and what work still running after the last test wrote.
afterEach(failOnConsoleOutput);
afterAll(failOnConsoleOutput);
