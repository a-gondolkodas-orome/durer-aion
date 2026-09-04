// vite/client's ImportMetaEnv types unlisted keys as `any`; merging in the keys
// this app reads is what makes env access typed (#367). A key is required when
// something always sets it — VITE_LANGUAGE via .env from the sample,
// VITE_GIT_COMMIT_HASH via vite.config.ts — and optional when the code has a
// fallback for a build without it.
interface ImportMetaEnv {
  readonly VITE_ACCENT_COLOR?: string;
  readonly VITE_LANGUAGE: string;
  readonly VITE_GIT_COMMIT_HASH: string;
}
