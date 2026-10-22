// vite/client's ImportMetaEnv types unlisted keys as `any`; merging in the keys
// this app reads is what makes env access typed (#367). A key is required when
// something always sets it — VITE_GIT_COMMIT_HASH via vite.config.ts — and
// optional when the code has a fallback for a build without it: without
// VITE_SENTRY_DSN, index.tsx skips error reporting.
interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_HASH: string;
  readonly VITE_SENTRY_DSN?: string;
}
