import path from 'node:path'
import type { UserConfig } from 'vite'

const root = import.meta.dirname

/**
 * How the two local frontends — the offline dry run and the relay practice
 * site — reach the workspace packages. apps/online-frontend needs none of it:
 * its packages resolve through their exports maps with the defaults.
 *
 * The production build comes out the same without the alias table; the dev
 * server does not. Without it the packages load through their node_modules
 * links, outside the prebundle, and the page dies on a CommonJS dependency of
 * theirs served raw.
 */
export const workspacePackages = {
  resolve: {
    // Anchored patterns, not string keys: a string key matches as a prefix too, so
    // `game` alone would send `game/bot` to the package *directory* plus `/bot` —
    // that is, to the source entry bot.ts — while `game` itself resolves through
    // the exports map to the built dist, and the rules end up in the bundle twice,
    // once from each. Each subpath names its dist file, so the three entries share
    // one copy of the rules. Only the dry run imports the subpaths.
    alias: [
      { find: 'boardgame.io', replacement: path.resolve(root, 'node_modules/boardgame.io') },
      { find: /^game$/, replacement: path.resolve(root, 'packages/game') },
      { find: /^game\/(bot|client)$/, replacement: path.resolve(root, 'packages/game/dist/$1.mjs') },
      { find: /^schemas$/, replacement: path.resolve(root, 'packages/schemas') },
      { find: /^relay-bot$/, replacement: path.resolve(root, 'packages/relay-bot') },
      { find: /^common-frontend$/, replacement: path.resolve(root, 'packages/common-frontend') },
    ],
    dedupe: ['react', 'react-dom', 'boardgame.io'],
    preserveSymlinks: true,
  },
  optimizeDeps: {
    exclude: ['game', 'schemas', 'relay-bot', 'common-frontend'],
    include: ['boardgame.io'],
  },
} satisfies UserConfig

/**
 * Splits the game description files into a chunk of their own: they carry the
 * problem text, which should load only when the game starts.
 */
export function manualChunks(id: string): string | undefined {
  if (id.includes('/ReactClient.')) {
    return 'react-client'
  }
}
