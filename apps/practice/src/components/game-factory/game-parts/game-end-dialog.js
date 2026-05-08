import React from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { useTranslation } from '../../language/translate';
import { ModeSelector, DifficultySelector, getCtaText } from './game-controls';

export const GameEndDialog = ({
  isOpen, setIsOpen, resetGameState, ctx,
  isHumanVsHumanGame, onSwitchMode, variants, selectedVariantIndex, onSelectVariant
}) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true"></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="rounded-sm bg-white max-w-sm w-full p-2">
          <header className="flex items-baseline mb-2">
            <DialogTitle className="grow block text-2xl text-center">
              {t({ hu: 'A játék véget ért', en: 'Game over' })}
            </DialogTitle>
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t({ hu: 'Bezárás', en: 'Close' })}
              className="bg-slate-200 rounded-sm text-2xl px-1"
            >×</button>
          </header>
          <Description className="text-lg block text-justify mb-3">
            {t(getCtaText(ctx))}
          </Description>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-col gap-3">
            <ModeSelector
              isHumanVsHumanGame={isHumanVsHumanGame}
              onSwitchMode={onSwitchMode}
              disabled={false}
            />
            {variants.length > 1 && (
              <DifficultySelector
                variants={variants}
                selectedIndex={selectedVariantIndex}
                onSelect={onSelectVariant}
                disabled={false}
              />
            )}
            <button
              onClick={() => resetGameState()}
              className="cta-button"
            >
              {t({ hu: 'Új játék', en: 'New game' })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
