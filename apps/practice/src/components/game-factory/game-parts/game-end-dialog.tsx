import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { useTranslation } from '../../language';
import { ModeSelector, DifficultySelector, getCtaText } from './game-controls';
import type { Ctx, Variant, Mode } from '../types';

export const GameEndDialog = ({
  isOpen, setIsOpen, ctx,
  selectedVariantIndex, getVariantsForMode, onNewGame
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  ctx: Ctx
  selectedVariantIndex: number
  getVariantsForMode: (mode: Mode) => Variant[]
  onNewGame: (mode: Mode, variantIndex: number) => void
}) => {
  const { t } = useTranslation();
  const [localMode, setLocalMode] = useState<Mode>(ctx.isHumanVsHumanGame ? 'vsHuman' : 'vsComputer');
  const [localVariantIndex, setLocalVariantIndex] = useState(selectedVariantIndex);

  useEffect(() => {
    if (isOpen) {
      setLocalMode(ctx.isHumanVsHumanGame ? 'vsHuman' : 'vsComputer');
      setLocalVariantIndex(selectedVariantIndex);
    }
  }, [isOpen, ctx.isHumanVsHumanGame, selectedVariantIndex]);

  const localVariants = getVariantsForMode(localMode);

  const handleModeChange = (newMode: Mode) => {
    const newVariants = getVariantsForMode(newMode);
    setLocalMode(newMode);
    const stillAvailable = newVariants.find(v => v.originalIndex === localVariantIndex && !v.disabled);
    if (!stillAvailable) {
      const firstEnabled = newVariants.find(v => !v.disabled);
      setLocalVariantIndex(firstEnabled?.originalIndex ?? newVariants[0]?.originalIndex ?? 0);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true"></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="rounded-sm bg-surface-elevated max-w-sm w-full p-2">
          <header className="flex items-baseline mb-2">
            <DialogTitle className="grow block text-xl sm:text-2xl text-center">
              {t({ hu: 'A játék véget ért', en: 'Game over' })}
            </DialogTitle>
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t({ hu: 'Bezárás', en: 'Close' })}
              className="bg-slate-200 dark:bg-slate-700 rounded-sm text-xl sm:text-2xl px-1
                hocus:bg-slate-300 dark:hocus:bg-slate-600"
            >×</button>
          </header>
          <Description className="text-base sm:text-lg block text-justify mb-2">
            {t(getCtaText(ctx))}
          </Description>
          <div className="rounded-lg border bg-surface-elevated p-3 flex flex-col gap-3">
            <ModeSelector
              isHumanVsHumanGame={localMode === 'vsHuman'}
              onSwitchMode={handleModeChange}
              disabled={false}
            />
            {localVariants.length > 1 && (
              <DifficultySelector
                variants={localVariants}
                selectedIndex={localVariantIndex}
                onSelect={setLocalVariantIndex}
                disabled={false}
              />
            )}
            <button
              onClick={() => onNewGame(localMode, localVariantIndex)}
              className="primary-button"
            >
              {t({ hu: 'Új játék', en: 'New game' })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
