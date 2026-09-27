// vite/client's ImportMetaEnv types unlisted keys as `any`; merging in the keys
// this app reads is what makes env access typed (#367). A key is required when
// something always sets it — VITE_GIT_COMMIT_HASH via vite.config.ts — and
// optional when the code has a fallback for a build without it: index.tsx
// skips error reporting without VITE_SENTRY_DSN, and sendData.ts drops play
// data rather than upload it without the S3 pair, which the /valto/ deploy
// leaves unset.
interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_HASH: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_S3_BUCKET_NAME?: string;
  readonly VITE_S3_FOLDER?: string;
}
