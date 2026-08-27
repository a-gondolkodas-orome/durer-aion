import { Ctx } from "boardgame.io";
import { GameStateMixin, MyGameState as RelayGameState } from "game";

// The team-shaped DTOs live in packages/schemas, next to the backend that
// serves them; re-exported here so the apps keep importing everything from
// common-frontend. MatchStateDto stays local: its G comes from the game
// package, which schemas cannot depend on.
export {
  parseTeamModelDto,
} from "schemas";
export type {
  FinishedMatchStatus,
  InProgressMatchStatus,
  MatchStatus,
  NotStartedMatchStatus,
  PageState,
  TeamModelDto,
} from "schemas";

/// One admin endpoint serves both kinds of match, and the payload carries no
/// discriminant of its own: a relay match's G is the relay game state, a
/// strategy match's is whatever the game defines plus gameWrapper's mixin — of
/// which only the mixin half is common to every strategy game. A reader tells
/// the two apart by a field only one of them has.
export interface MatchStateDto {
  G: RelayGameState | GameStateMixin;
  ctx:	Ctx;
  deltalog:	MatchStateLogDto[];
}

export interface MatchStateLogDto {
  action: 'MAKE_MOVE' | 'GAME_EVENT' | 'UNDO' | 'REDO';
  _stateID:	number;
  turn:	number;
  phase: string;
  redact: boolean;
  automatic: boolean;
}

// Shallow by design, unlike parseTeamModelDto: G's inner shape is whatever
// the year's game defines, and the only consumer is the admin dialog, which
// already reads G by the discriminant convention above. Checking that the
// containers are there catches a wrong-endpoint or error payload; the rest
// stays the game's contract.
export function parseMatchStateDto(value: unknown): MatchStateDto | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  if (
    !('G' in value) || typeof value.G !== 'object' || value.G === null ||
    !('ctx' in value) || typeof value.ctx !== 'object' || value.ctx === null
  ) {
    return null;
  }
  return value as MatchStateDto;
}
