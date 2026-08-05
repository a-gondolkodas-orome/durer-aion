// @vitest-environment jsdom
import { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { GameEndDialog } from './game-end-dialog';
import type { Ctx, Variant } from '../types';

// The dialog offers a *draft* mode/variant that only takes effect on "new
// game". Abandoning the dialog has to discard the draft, which is why the
// controls live in a child `Dialog` unmounts rather than in state the parent
// keeps and re-seeds with an effect.

const ctxWith = (isHumanVsHumanGame: boolean): Ctx => ({
  isHumanVsHumanGame,
  resolvedPlayerNames: ['Anna', 'Bea'],
  chosenRoleIndex: 0,
  phase: 'gameEnd',
  turnState: null,
  currentPlayer: 0,
  isClientMoveAllowed: false,
  winnerIndex: 0,
  moveCount: 4
});

const variants: Variant[] = [
  { originalIndex: 0, label: { hu: 'Könnyű', en: 'Easy' }, disabled: false } as Variant,
  { originalIndex: 1, label: { hu: 'Nehéz', en: 'Hard' }, disabled: false } as Variant
];

const Harness = ({ isHumanVsHumanGame = false }: { isHumanVsHumanGame?: boolean }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <button data-testid="reopen" onClick={() => setIsOpen(true)}>reopen</button>
      <GameEndDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        ctx={ctxWith(isHumanVsHumanGame)}
        selectedVariantIndex={0}
        getVariantsForMode={() => variants}
        onNewGame={() => {}}
      />
    </>
  );
};

describe('GameEndDialog', () => {
  it('seeds the draft mode from the game that just ended', () => {
    const { getByTestId } = render(<Harness isHumanVsHumanGame />);

    expect((getByTestId('mode-vsHuman') as HTMLInputElement).checked).toBe(true);
  });

  it('lets the player draft a different mode', () => {
    const { getByTestId } = render(<Harness />);

    fireEvent.click(getByTestId('mode-vsHuman'));

    expect((getByTestId('mode-vsHuman') as HTMLInputElement).checked).toBe(true);
  });

  // The behaviour the removed effect existed for: a draft the player walked
  // away from must not come back the next time the dialog opens.
  it('discards an abandoned draft when reopened', async () => {
    const { getByTestId, queryByTestId, getByText, findByTestId } = render(<Harness />);

    fireEvent.click(getByTestId('mode-vsHuman'));
    expect((getByTestId('mode-vsHuman') as HTMLInputElement).checked).toBe(true);

    // Closing unmounts the controls, which is what discards the draft.
    fireEvent.click(getByText('×'));
    await waitFor(() => expect(queryByTestId('mode-vsHuman')).toBeNull());

    fireEvent.click(getByTestId('reopen'));

    expect(((await findByTestId('mode-vsComputer')) as HTMLInputElement).checked).toBe(true);
    expect((getByTestId('mode-vsHuman') as HTMLInputElement).checked).toBe(false);
  });
});
