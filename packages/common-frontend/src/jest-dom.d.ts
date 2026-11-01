// The suites import `@testing-library/jest-dom`, which registers its matchers on
// vitest's `expect` at runtime but types them only on the global `jest.Matchers`,
// and its `/vitest` entry augments `Assertion<T>` — neither of which vitest 5's
// `Assertion<R, T>` reads. Adding them to `Matchers<R, T>` is the route vitest 5
// documents for custom matchers. The first argument is the asymmetric matcher a
// matcher also accepts, as jest-dom's own jest.d.ts passes it.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import type { expect } from 'vitest';

declare module 'vitest' {
  // Merging needs vitest's exact type parameters, `T` included, and adds no
  // members of its own.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown>
    extends TestingLibraryMatchers<ReturnType<typeof expect.stringContaining>, R> {}
}
