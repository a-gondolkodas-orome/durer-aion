import type { I18nString } from '../language';

export type Phase = 'roleSelection' | 'play' | 'gameEnd'
export type Mode = 'vsComputer' | 'vsHuman'

export interface Ctx {
  isHumanVsHumanGame: boolean
  resolvedPlayerNames: [string, string]
  chosenRoleIndex: number | null
  phase: Phase
  turnState: unknown
  currentPlayer: number | null
  isClientMoveAllowed: boolean
  winnerIndex: number | null
}

export interface Events {
  endTurn: () => void
  endGame: (winnerIndex?: number | null) => void
  setTurnState: (state: unknown) => void
}

export type MoveResult<TBoard> = { nextBoard: TBoard; autoEndOfTurn?: boolean }
export type MoveFunction<TBoard> = (
  board: TBoard, meta: { ctx: Ctx; events: Events }, ...args: any[]
) => MoveResult<TBoard>
export type GameMoves<TBoard> = Record<string, (board: TBoard, ...args: any[]) => MoveResult<TBoard>>
export type StrategyArgs<TBoard> = { board: TBoard; ctx: Ctx; moves: GameMoves<TBoard> }
export type BoardClientProps<TBoard> = StrategyArgs<TBoard> & { events: Events }

export interface Variant {
  originalIndex: number
  disabled?: boolean
  label?: I18nString
  botStrategy?: unknown
  notAlwaysOptimal?: boolean
}

export interface VariantInput<TBoard> {
  label?: I18nString
  isDefault?: boolean
  generateStartBoard?: () => TBoard
  botStrategy?: (args: StrategyArgs<TBoard>) => void
  notAlwaysOptimal?: boolean
}
