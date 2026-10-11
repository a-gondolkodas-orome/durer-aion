// A label in the host's translations: handed the host's translate function, it
// returns the text, `t => t('shark-chase:role.shark')`. A function rather than
// a key, so the key stays a literal at a `t` call, where the host's tooling
// reads it, and so the engine names no i18n library.
export type Label = (t: (key: string) => string) => string
