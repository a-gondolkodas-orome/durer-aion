import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  strategyGameFactory,
  testVariantLabel,
  fullVariantLabel,
  type BoardClientProps,
  GameBoard,
  useHoverPreview
} from 'strategy-game-factory';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';
import { getAllowedSuperset, moves, vertices, type Board } from './gameplay';

const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => {
  const [firstNode, setFirstNode] = useState<number | null>(null);
  const { value: validHoveredNode, hoverProps } = useHoverPreview<number>(ctx.moveCount);

  // The click handler keeps its guards: a rejected click must leave the local
  // node selection alone, which the engine's silent gating cannot do for us.
  const connectNode = (node: number) => {
    if (!ctx.isClientMoveAllowed) return;
    if (firstNode === null) {
      setFirstNode(node);
    } else if (node === firstNode) {
      setFirstNode(null);
    } else {
      if (!moves.stretchRope.isAllowed(board, { from: firstNode, to: node })) return;
      moves.stretchRope(board, { from: firstNode, to: node });
      setFirstNode(null);
    }
  };

  const isCandidateAllowed = moves.stretchRope.isAllowed(board, { from: firstNode, to: validHoveredNode });

  const candidateEdge = getAllowedSuperset(board, { from: firstNode, to: validHoveredNode });
  const candidateFromV = candidateEdge ? vertices[candidateEdge.from] : null;
  const candidateToV = candidateEdge ? vertices[candidateEdge.to] : null;

  return (
  <GameBoard>
  <svg className="aspect-square">

    {/* edges */}
    {board.map(({ from, to }, idx) => (
      <line
        key={`${from}-${to}`}
        x1={vertices[from].cx} y1={vertices[from].cy}
        x2={vertices[to].cx} y2={vertices[to].cy}
        stroke={idx % 2 === 0 ? 'var(--color-blue-500)' : 'var(--color-green-500)'}
        strokeWidth="4"
      />
    ))}

    {/* candidate next edge */}
    {firstNode !== null && validHoveredNode !== null &&
      firstNode !== validHoveredNode && candidateFromV && candidateToV && (
      <line
      x1={candidateFromV.cx} y1={candidateFromV.cy}
      x2={candidateToV.cx} y2={candidateToV.cy}
      stroke={
        isCandidateAllowed
        ? (ctx.currentPlayer === 0 ? 'var(--color-blue-500)' : 'var(--color-green-500)')
        : 'var(--color-red-500)'
      }
      strokeWidth="2" strokeDasharray="4"
      />
    )}

    {/* grid nodes */}
    {vertices.map(vertex => {
      const isClickable = ctx.isClientMoveAllowed && (
        firstNode === null ||
        vertex.id === firstNode ||
        moves.stretchRope.isAllowed(board, { from: firstNode, to: vertex.id })
      );
      const isInvalidHover = firstNode !== null &&
        vertex.id === validHoveredNode &&
        firstNode !== validHoveredNode &&
        !isCandidateAllowed;
      return (
      <circle
        key={vertex.id}
        cx={vertex.cx} cy={vertex.cy} r="2%"
        className={`
          ${vertex.id === firstNode
            ? (ctx.currentPlayer === 0 ? 'fill-blue-500' : 'fill-green-500')
            : isInvalidHover ? 'fill-red-500' : 'fill-slate-900 dark:fill-slate-300'
          }
        `}
        onClick={() => connectNode(vertex.id)}
        onKeyUp={(event) => {
          if (event.key === 'Enter') connectNode(vertex.id);
        }}
        tabIndex={isClickable ? 0 : undefined}
        role={isClickable ? 'button' : undefined}
        aria-label={isClickable ? `Node ${vertex.id + 1}` : undefined}
        {...hoverProps(vertex.id)}
      />
      );
    })}
  </svg>
  </GameBoard>
  );
};

const Rule = () => {
  const { t } = useTranslation('totem-poles');
  return <Trans t={t} i18nKey="rule" values={{ poles: 10 }} />;
};

const StepDescription = () => {
  const { t } = useTranslation('totem-poles');
  return t('step');
};

export const TriangularGridRopes = strategyGameFactory({
  presentation: {
    rule: <Rule />,
    getPlayerStepDescription: () => <StepDescription />
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    { botStrategy: randomBotStrategy, label: testVariantLabel },
    {
      botStrategy: smartBotStrategy,
      startBoards: [[]],
      label: fullVariantLabel,
      isDefault: true
    }
  ]
});
