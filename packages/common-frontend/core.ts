// The `common-frontend/core` entry: what an app module needs without the UI —
// the storage keys, the DTOs, the repository's interface and the local apps'
// transport. Nothing here may reach React, MUI or i18next at runtime, so a
// plain node suite can load it from source, and a module that only stores a
// score does not pull in the components.
export * from './src/client/utils/storage-keys';
export * from './src/client/dto/TeamStateDto';
export * from './src/client/api-repository-interface';
export * from './src/common/local-with-bots';
