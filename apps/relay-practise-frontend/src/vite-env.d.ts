// vite/client's ImportMetaEnv types unlisted keys as `any`; merging in the keys
// this app reads is what makes env access typed (#367). VITE_GIT_COMMIT_HASH is
// required because vite.config.ts always sets it.
interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_HASH: string;
}
