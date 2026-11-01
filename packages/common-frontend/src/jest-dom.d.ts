// jest-dom adds its matchers (toBeInTheDocument, ...) to vitest's `expect` at
// runtime, but declares their types where vitest 5 no longer looks: Jest's global
// `jest.Matchers`. This adds them to vitest's own `Matchers`, the place vitest 5
// documents for custom matchers. jest-dom's `/vitest` entry targets vitest 4's
// one-parameter `Assertion<T>`, and type-checks only because skipLibCheck hides
// the mismatch. Delete this once jest-dom ships types for vitest 5.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import type { expect } from 'vitest';

declare module 'vitest' {
  // Merging needs vitest's exact type parameters, `T` included, and adds no
  // members of its own.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown>
    extends TestingLibraryMatchers<ReturnType<typeof expect.stringContaining>, R> {}
}
