import type { BotStrategy, Gameplay } from 'engine';

// The react-free slice of a game a competition server runs: the rules, the
// bots by difficulty, and the hand-out data per category. Assembled in each
// game's folder (competition.ts) so the self-contained-folder principle holds
// for the competition consumer too — the server never touches the game's .tsx
// half, which is what keeps the optimal bot out of every client bundle.
export interface CompetitionGame<TBoard> {
  // The practice site's key for the same game (gameList.ts) — one id names
  // the game everywhere, including in CompetitionMatchState.gameId, which is
  // how a frontend later picks the matching BoardClient.
  gameId: string
  gameplay: Gameplay<TBoard>
  liveBot: BotStrategy<TBoard>
  testBot: BotStrategy<TBoard>
  // In hand-out order — consecutive pairs share a loss count, a pair's two
  // members are a streak's two boards (competition's startBoardIndexForTally
  // is the reader). Append, never reorder.
  liveStartBoardsByCategory: Record<string, TBoard[]>
  generateTestStartBoard: () => TBoard
}
