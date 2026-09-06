// The shape a game writes its own text in. It lives here rather than with the
// React provider that reads it because it is part of a game's configuration —
// a variant's label, a rule — and so the engine has to name it to type that
// configuration at all. The provider, the `t()` hook and the language selector
// stay on the React side, which is the half that resolves one of these to a
// string for a reader.
import type React from 'react';

export interface I18nString { hu: string; en?: string }
export type Language = keyof I18nString
export type Translatable = I18nString | string

// The only React the engine core names, and only as a type: a rule may be
// markup, so the node type has to be React's. `import type` is erased, so
// nothing reaches a bundle or a bare node from here.
export interface I18nNode { hu: React.ReactNode; en?: React.ReactNode }
export type TranslatableNode = I18nNode | React.ReactNode
