/**
 * Puts each app's ReactClient in a chunk named react-client. Rolldown moves the
 * dependencies the entry shares with it there too, and the entry then imports
 * the chunk eagerly, so this does not defer the game descriptions ReactClient
 * imports — the React.lazy import of it alone would.
 */
export function manualChunks(id: string): string | undefined {
  if (id.includes('/ReactClient.')) {
    return 'react-client'
  }
}
