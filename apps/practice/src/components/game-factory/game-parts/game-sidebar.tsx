import React from 'react';
import { Input } from '@headlessui/react';
import { useTranslation, type I18nString } from '../../language';
import {
  ModeSelector,
  DifficultySelector,
  getCtaText
} from './game-controls';
import type { Ctx, Mode, Variant } from '../types';

import type { Stats } from '../use-game-stats';

export interface SidebarMoves {
  switchMode: (mode: Mode) => void
  startGame: (roleIndex?: number | null) => void
  setPlayerNames: (names: [string, string]) => void
  setDifficulty: (index: number) => void
  resetGameState: () => void
  undo: () => void
  canUndo: boolean
}

interface GameSidebarProps {
  roleLabels?: [I18nString, I18nString]
  stepDescription: React.ReactNode
  ctx: Ctx
  playerNames: string[]
  moves: SidebarMoves
  variants: Variant[]
  selectedVariantIndex: number
  stats?: Stats | null
  onResetStats?: () => void
}

export const GameSidebar = ({
  roleLabels,
  stepDescription,
  ctx,
  playerNames,
  moves,
  variants,
  selectedVariantIndex,
  stats,
  onResetStats
}: GameSidebarProps) => {
  const { t } = useTranslation();
  const isNewGameAllowed = ctx.phase !== 'play' || ctx.isClientMoveAllowed;
  const activeVariantHasBotStrategy = !!variants.find(v => v.originalIndex === selectedVariantIndex)?.botStrategy;

  const selectedVariant = variants.find(v => v.originalIndex === selectedVariantIndex);
  const modeSummaryLabel = t(ctx.isHumanVsHumanGame
    ? { hu: '🤝 2 játékos', en: '🤝 2 players' }
    : { hu: '🤖 Gép ellen', en: '🤖 vs Computer' }
  );
  const defaultVariantLabel = { hu: `${selectedVariantIndex + 1}. szint`, en: `Level ${selectedVariantIndex + 1}` };
  const variantSummaryLabel = variants.length > 1
    ? ' · ' + t(selectedVariant?.label ?? defaultVariantLabel)
    : '';

  return (
    <div className="p-2 flex flex-col grow shrink-0 basis-64 gap-3">
      <div className="rounded-lg border bg-slate-100 dark:bg-slate-800 p-2 sm:p-3 mb-2 sm:mb-8 flex flex-col gap-3">
        {ctx.isHumanVsHumanGame
          ? ctx.phase !== 'roleSelection' && <PlayerTurnPanel ctx={ctx} />
          : <p className="text-center font-bold text-base sm:text-lg">{t(getCtaText(ctx))}</p>
        }

        {ctx.phase === 'play' && (
          <div className="flex flex-col gap-2">
            <div className="relative flex justify-center">
              {!ctx.isHumanVsHumanGame && !ctx.isClientMoveAllowed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner />
                </div>
              )}
              <p className={`italic text-justify ${!ctx.isClientMoveAllowed ? 'invisible' : ''}`}>
                {stepDescription}
              </p>
            </div>
            <button
              data-testid="undo-btn"
              className="secondary-button text-sm"
              disabled={!moves.canUndo}
              onClick={() => moves.undo()}
            >
              ↶ {t({ hu: 'Visszavonás', en: 'Undo' })}
            </button>
          </div>
        )}

        {ctx.phase === 'roleSelection' && (
          ctx.isHumanVsHumanGame
            ? <PlayerNameSetup
                roleLabels={roleLabels}
                playerNames={playerNames}
                setPlayerNames={moves.setPlayerNames}
                onStart={moves.startGame}
              />
            : <RoleSelector
                roleLabels={roleLabels}
                onRoleSelection={moves.startGame}
                disabled={!activeVariantHasBotStrategy}
              />
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {ctx.phase !== 'play' ? (
          <ModeDifficultySelectors
            ctx={ctx}
            moves={moves}
            variants={variants}
            selectedVariantIndex={selectedVariantIndex}
            disabled={!isNewGameAllowed}
          />
        ) : (
          <details className="border rounded-lg p-2 text-sm">
            <summary className="cursor-pointer text-slate-500 hocus:text-slate-600
              dark:text-slate-400 dark:hocus:text-slate-300">
              {modeSummaryLabel}{variantSummaryLabel}
            </summary>
            <div className="mt-2 flex flex-col gap-3">
              <ModeDifficultySelectors
                ctx={ctx}
                moves={moves}
                variants={variants}
                selectedVariantIndex={selectedVariantIndex}
                disabled={!isNewGameAllowed}
              />
            </div>
          </details>
        )}

        <button
          data-testid="new-game-btn"
          className="secondary-button"
          disabled={!isNewGameAllowed}
          onClick={() => moves.resetGameState()}
        >
          {t({ hu: 'Új játék', en: 'New game' })}
        </button>
      </div>
      {!ctx.isHumanVsHumanGame && stats && (
        <WinLossCounter stats={stats} onReset={onResetStats!} />
      )}
    </div>
  );
};

const ModeDifficultySelectors = ({
  ctx, moves, variants, selectedVariantIndex, disabled
}: {
  ctx: Ctx
  moves: SidebarMoves
  variants: Variant[]
  selectedVariantIndex: number
  disabled: boolean
}) => (
  <>
    <ModeSelector
      isHumanVsHumanGame={ctx.isHumanVsHumanGame}
      onSwitchMode={moves.switchMode}
      disabled={disabled}
    />
    {variants.length > 1 && (
      <DifficultySelector
        variants={variants}
        selectedIndex={selectedVariantIndex}
        onSelect={moves.setDifficulty}
        disabled={disabled}
      />
    )}
  </>
);

const RoleSelector = ({ roleLabels, onRoleSelection, disabled }: {
  roleLabels?: [I18nString, I18nString]
  onRoleSelection: (roleIndex: number) => void
  disabled: boolean
}) => {
  const { t } = useTranslation();
  return <div className="flex flex-row flex-wrap sm:flex-col gap-2">
    {[
      { hu: 'Kezdő leszek', en: "I'll go first" },
      { hu: 'Második leszek', en: "I'll go second" }
    ].map((defaultLabel, i) => (
      <button
        key={i}
        data-testid={`role-btn-${i}`}
        className="primary-button flex-1 min-w-24 sm:flex-none sm:min-w-0"
        disabled={disabled}
        onClick={() => onRoleSelection(i)}
      >
        {t(roleLabels ? roleLabels[i] : defaultLabel)}
      </button>
    ))}
  </div>;
};

const PlayerNameSetup = ({ roleLabels, playerNames, setPlayerNames, onStart }: {
  roleLabels?: [I18nString, I18nString]
  playerNames: string[]
  setPlayerNames: (names: [string, string]) => void
  onStart: () => void
}) => {
  const { t } = useTranslation();
  return (
  <div className="flex flex-col gap-2 sm:gap-3">
    {([0, 1] as const).map(i => (
      <div key={i} className="flex items-center gap-2 flex-wrap">
        <Input
          name={i === 0 ? 'name_of_first_player' : 'name_of_second_player'}
          className="border rounded-md text-slate-600 dark:text-slate-200
           bg-surface-elevated
            px-2 py-1 text-sm flex-1 min-w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder={t([
            { hu: 'Neved (Nyuszika)', en: 'Your name (Pip)' },
            { hu: 'Neved (Teknős)', en: 'Your name (Dot)' }
          ][i])}
          value={playerNames[i]}
          onChange={e => {
            const updated: [string, string] = [playerNames[0], playerNames[1]];
            updated[i] = e.target.value.trim();
            setPlayerNames(updated);
          }}
        />
        <button
          data-testid={`start-hh-game-${i}`}
          className="shrink-0 px-2 py-1 text-sm font-semibold rounded-md
            bg-blue-500 text-white hocus:bg-blue-600"
          onClick={() => {
            setPlayerNames([playerNames[i], playerNames[1 - i]]);
            onStart();
          }}
        >
          {t({ hu: 'Kezdek', en: 'I start' })}
          {roleLabels && ` (${t(roleLabels[0])})`}
        </button>
      </div>
    ))}
  </div>
  );
};

const Spinner = () => (
  <div
    role="status" aria-label="Loading"
    className="animate-spin h-8 w-8 border-t-blue-600 rounded-full border-4"
  ></div>
);

const PlayerTurnPanel = ({ ctx }: { ctx: Ctx }) => {
  const playerName = (i: number) => ctx.resolvedPlayerNames[i];
  const isEnd = ctx.phase === 'gameEnd';

  return (
    <div className="flex flex-row flex-wrap sm:flex-col gap-2" aria-live="polite">
      {[0, 1].map(i => {
        const isActive = !isEnd && ctx.currentPlayer === i;
        const isWinner = isEnd && ctx.winnerIndex === i;
        const highlighted = isActive || isWinner;
        return (
          <div
            key={i}
            className={`
              flex-1 sm:flex-none flex items-center gap-2 rounded-md px-2 py-1 sm:px-3 sm:py-2
              border-l-4 drop-shadow-sm
              ${highlighted
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-700'
                : 'bg-surface-elevated'}
            `}
          >
            <span className={`flex-1 ${highlighted ? 'font-bold text-blue-700 dark:text-blue-300' : ''}`}>
              {playerName(i)}
            </span>
            {isWinner && <span>🏆</span>}
          </div>
        );
      })}
    </div>
  );
};

const WinLossCounter = ({ stats, onReset }: { stats: Stats; onReset: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <span title={t({
        hu: `Megnyert játékok: ${stats.win}, Elvesztett játékok: ${stats.loss}`,
        en: `Wins: ${stats.win}, Losses: ${stats.loss}`
      })}>
        🏆 {stats.win} · 💀 {stats.loss}
      </span>
      <button
        onClick={onReset}
        aria-label={t({ hu: 'Számlálók nullázása', en: 'Reset counters' })}
        className="text-xs hocus:text-slate-600 dark:hocus:text-slate-300"
      >
        ↻
      </button>
    </div>
  );
};
