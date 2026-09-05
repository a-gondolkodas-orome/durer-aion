// game_for_testing.ts is deliberately absent. It is a fixture, and `index.ts`
// re-exports this barrel wholesale, so listing it here put three stub games and
// a scoring table into the package's published build and named all three of its
// helpers in the public types. gamewrapper.test.ts imports it by its own path
// instead, and entries.test.ts pins that no entry reaches it again.
export * from './gamewrapper';
export * from './types';
