import { useEffect } from "react";
import type { ComponentType } from "react";
import type { Ctx } from "boardgame.io";
import { JUDGE_PLAYER } from "game";
import { useClientRepo } from "../client-repo-context";

export const JUDGE_RESUME_DELAY_MS = 3000;

interface JudgeTurnProps {
  ctx: Ctx;
  _stateID: number;
  matchID: string;
  isConnected: boolean;
}

/// While the judge is to move, asks the server every JUDGE_RESUME_DELAY_MS to
/// take its turn. The server takes it unprompted after each of the team's
/// moves, well inside the delay; this is for a turn that was lost, or a board
/// that missed the push of it (`resumeBotTurn` in socketio_botmoves.ts says
/// how either happens).
///
/// A failed ask is not reported: the board asks again while it keeps waiting,
/// and the server reports its own errors.
///
/// Socket.io clients only: a local bot is its transport's to resume.
export function withJudgeResume<P extends JudgeTurnProps>(Board: ComponentType<P>) {
  return (props: P) => {
    const repo = useClientRepo();
    const { ctx, _stateID, matchID, isConnected } = props;
    const waiting = isConnected && ctx.gameover === undefined && ctx.currentPlayer === JUDGE_PLAYER;

    // Keyed on the state as well: the judge can be to move in two states in a
    // row, and each one gets the full delay.
    useEffect(() => {
      if (!waiting) {
        return;
      }
      const timer = setInterval(() => {
        repo.resumeJudgeTurn(matchID).catch(() => undefined);
      }, JUDGE_RESUME_DELAY_MS);
      return () => clearInterval(timer);
    }, [waiting, repo, matchID, _stateID]);

    return <Board {...props}/>;
  };
}
