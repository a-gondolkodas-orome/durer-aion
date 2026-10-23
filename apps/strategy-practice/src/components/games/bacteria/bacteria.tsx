import { useState } from 'react';
import { range } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory, testVariantLabel, GameBoard, type BoardClientProps, type Ctx
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import {
  isJump,
  isSpread,
  isShiftRight,
  isShiftLeft,
  hasBacterium,
  moves,
  ATTACKER,
  type AttackZone,
  type Board,
  type Cell,
  type MoveType
} from './gameplay';
import {
  adjacentStartBoards,
  scatteredStartBoards,
  testStartBoards
} from './start-boards';

const BacteriaDisplay = (
  { count, onGoal, dimmed = false }: { count: number; onGoal: boolean; dimmed?: boolean }
) => {
  if (count === 0) return null;
  const dotColor = dimmed
    ? 'bg-transparent border-2 border-green-500'
    : onGoal ? 'bg-green-300' : 'bg-green-600';
  const sizeClass = count === 1 ? 'w-[45%]' : count <= 4 ? 'w-[35%]' : 'w-[25%]';
  return (
    <div className="flex flex-wrap justify-center items-center gap-[4%] p-[8%] w-full h-full">
      {range(count).map(i => (
        <div key={i} className={`${dotColor} ${sizeClass} rounded-full aspect-square`} />
      ))}
    </div>
  );
};

const GoalMarker = () => (
  <span className="text-base leading-none">🚩</span>
);

// Board-driven: reads its width from the board, so it renders any goal layout.
const BoardClient = ({ board: { bacteria, goals }, ctx, moves }: BoardClientProps<Board>) => {
  const [attackRow, setAttackRow] = useState<number | null>(null);
  const [attackCol, setAttackCol] = useState<number | null>(null);

  const boardWidth = bacteria[0].length;

  const isPlayerAttacker = ctx.currentPlayer === ATTACKER;

  // Which of the four attacks the second click means is decided by where it
  // lands relative to the first.
  const attackMoveName = (
    { attackRow, attackCol, row, col }:
      Cell & { attackRow: number | null; attackCol: number | null }
  ): MoveType | null => {
    // No source cell selected yet, so the click cannot spell out an attack.
    if (attackRow === null || attackCol === null) return null;
    const attack: AttackZone = { attackRow, attackCol, row, col };
    if (isJump(attack)) return 'jump';
    if (isSpread(attack)) return 'spread';
    if (isShiftRight(attack)) return 'shiftRight';
    if (isShiftLeft(attack)) return 'shiftLeft';
    return null;
  };

  // A second click is a real attack when the target exists on the board, its
  // position spells out one of the four attacks, and that attack's own
  // validator accepts the selected source cell.
  const isAllowedAttack = ({ row, col }: Cell) => {
    if (bacteria[row][col] === undefined) return false;
    const name = attackMoveName({ attackRow, attackCol, row, col });
    return name !== null
      && moves[name].isAllowed({ bacteria, goals }, { row: attackRow, col: attackCol });
  };

  const isGoal = ({ row, col }: Cell) => row === (bacteria.length - 1) && goals.includes(col);

  const clickField = ({ row, col }: Cell) => {
    if (!ctx.isClientMoveAllowed) return;
    if (attackRow === null && !(bacteria[row][col] >= 1)) return;
    if (isPlayerAttacker && attackRow === row && attackCol === col) {
      setAttackRow(null);
      setAttackCol(null);
      return;
    }
    if (attackRow !== null && !isAllowedAttack({ row, col })) return;

    if (isPlayerAttacker && attackRow === null) {
      setAttackRow(row);
      setAttackCol(col);
      return;
    }

    if (!isPlayerAttacker) {
      moves.defend({ bacteria, goals }, { row, col });
      return;
    }

    const name = attackMoveName({ attackRow, attackCol, row, col });
    if (name) moves[name]({ bacteria, goals }, { row: attackRow, col: attackCol });

    setAttackRow(null);
    setAttackCol(null);
  };

  const rowShift = (row: number) => row % 2 === 0 ? '0px' : `${100 / (2 * boardWidth)}%`;

  const isForbidden = ({ row, col }: Cell) => {
    if (attackRow !== null && row === attackRow && col === attackCol) return false;
    if (attackRow !== null && !isAllowedAttack({ row, col })) return true;
    if (attackRow === null && !hasBacterium({ bacteria, goals }, { row, col })) return true;
    return false;
  };

  const isEdgeCell = ({ row, col }: Cell) => row % 2 === 1 && col === boardWidth - 1;

  const isDisabled = ({ row, col }: Cell) => (
    !ctx.isClientMoveAllowed
    || isForbidden({ row, col })
    || isEdgeCell({ row, col })
  );

  const cellClassName = ({ row, col }: Cell) => {
    if (isEdgeCell({ row, col })) return 'aspect-4/3 w-full';
    const isSelected = row === attackRow && col === attackCol;
    const isValidTarget = attackRow !== null && isAllowedAttack({ row, col });
    const goal = isGoal({ row, col });
    let bg, border;
    if (isSelected) {
      bg = 'bg-yellow-200'; border = 'border-yellow-500';
    } else if (isValidTarget) {
      bg = 'bg-amber-300'; border = 'border-amber-500';
    } else if (goal) {
      bg = 'bg-blue-700'; border = 'border-blue-900';
    } else {
      bg = 'bg-amber-100'; border = 'border-stone-400';
    }
    const isDefenderTarget = !isPlayerAttacker && ctx.isClientMoveAllowed && bacteria[row][col] >= 1;
    return [
      'aspect-4/3 w-full border-2 rounded-sm flex items-center justify-center',
      bg,
      border,
      isForbidden({ row, col }) ? 'opacity-50' : '',
      isDefenderTarget ? 'enabled:hocus:bg-red-100 enabled:hocus:border-red-400' : ''
    ].filter(Boolean).join(' ');
  };

  const cellContent = ({ row, col }: Cell) => {
    if (isEdgeCell({ row, col })) return null;
    const count = bacteria[row][col] || 0;
    const goal = isGoal({ row, col });
    if (attackRow !== null && isAllowedAttack({ row, col })) {
      const attack = { attackRow, attackCol: attackCol!, row, col };
      const previewCount = isJump(attack) ? 1 : bacteria[attackRow][attackCol!];
      return <BacteriaDisplay count={previewCount} onGoal={goal} dimmed />;
    }
    if (count > 0) return <BacteriaDisplay count={count} onGoal={goal} />;
    if (goal) return <GoalMarker />;
    return null;
  };

  return (
    <GameBoard>
      <table
        className="w-[95%] table-fixed"
        style={{ transform: 'scaleY(-1)' }}
      >
        <tbody>
          {range(bacteria.length).map((row) => (
            <tr
              style={{ transform: `translateX(${rowShift(row)})` }}
              key={row}
            >
              {range(boardWidth).map((col) => (
                <td key={col}>
                  <button
                    disabled={isDisabled({ row, col })}
                    onClick={() => clickField({ row, col })}
                    className={cellClassName({ row, col })}
                    style={{ transform: 'scaleY(-1)' }}
                  >
                    {cellContent({ row, col })}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </GameBoard>
  );
};

const StepDescription = ({ ctx }: { ctx: Ctx }) => {
  const { t } = useTranslation('bacteria');
  return ctx.currentPlayer === ATTACKER ? t('step.attacker') : t('step.defender');
};

// The variants differ only in how the rule describes the GOAL squares.
const Rule = ({ goals }: { goals: 'any' | 'adjacent' | 'scattered' }) => {
  const { t } = useTranslation('bacteria');
  if (goals === 'adjacent') return <Trans t={t} i18nKey="rule.adjacent" />;
  if (goals === 'scattered') return <Trans t={t} i18nKey="rule.scattered" />;
  return <Trans t={t} i18nKey="rule.any" />;
};

export const Bacteria = strategyGameFactory({
  presentation: {
    rule: <Rule goals="any" />,
    roleLabels: [t => t('bacteria:role.attacker'), t => t('bacteria:role.defender')],
    getPlayerStepDescription: ({ ctx }) => <StepDescription ctx={ctx} />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      startBoards: testStartBoards,
      label: testVariantLabel
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: adjacentStartBoards,
      rule: <Rule goals="adjacent" />,
      label: t => t('bacteria:variant.adjacent'),
      isDefault: true
    },
    {
      botStrategy: smartBotStrategy,
      startBoards: scatteredStartBoards,
      rule: <Rule goals="scattered" />,
      label: t => t('bacteria:variant.scattered')
    }
  ]
});
