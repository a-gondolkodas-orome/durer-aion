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

// Headless UI's `Dialog` keeps working after the synchronous render — it
// portals the panel and wraps it in a `Transition`. A test that reads the
// controls straight off `render` can therefore finish before that work lands,
// and React reports the late state update as one escaping `act(...)`. Awaiting
// a control keeps the settling inside `act`.
const openDialog = async (props: { isHumanVsHumanGame?: boolean } = {}) => {
  const view = render(<Harness {...props} />);
  await view.findByTestId('mode-vsComputer');
  return view;
};

describe('GameEndDialog', () => {
  it('seeds the draft mode from the game that just ended', async () => {
    const { getByTestId } = await openDialog({ isHumanVsHumanGame: true });

    expect((getByTestId('mode-vsHuman') as HTMLInputElement).checked).toBe(true);
  });

  it('lets the player draft a different mode', async () => {
    const { getByTestId } = await openDialog();

    fireEvent.click(getByTestId('mode-vsHuman'));

    expect((getByTestId('mode-vsHuman') as HTMLInputElement).checked).toBe(true);
  });

  // The behaviour the removed effect existed for: a draft the player walked
  // away from must not come back the next time the dialog opens.
  it('discards an abandoned draft when reopened', async () => {
    const { getByTestId, queryByTestId, getByText, findByTestId } = await openDialog();

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
