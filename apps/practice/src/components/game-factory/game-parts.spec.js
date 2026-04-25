import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { getCtaText, GameSidebar } from './game-parts';

describe('getCtaText', () => {
  describe('vsHuman mode', () => {
    it('roleSelection: returns "Decide who goes first"', () => {
      expect(getCtaText({ phase: 'roleSelection', isHumanVsHumanGame: true }))
        .toEqual({ hu: 'Döntsétek el, hogy ki kezd.', en: 'Decide who goes first.' });
    });

    it('play: returns "Next: [player name]"', () => {
      expect(getCtaText({ phase: 'play', isHumanVsHumanGame: true, currentPlayerName: 'Alice' }))
        .toEqual({ hu: 'Következik: Alice', en: 'Next: Alice' });
    });

    it('gameEnd: returns "Winner: [winner name]"', () => {
      expect(getCtaText({ phase: 'gameEnd', isHumanVsHumanGame: true, winnerName: 'Bob' }))
        .toEqual({ hu: 'A játékot nyerte: Bob', en: 'Winner: Bob' });
    });
  });

  describe('vsComputer mode', () => {
    it('roleSelection: returns "Choose a role"', () => {
      expect(getCtaText({ phase: 'roleSelection', isHumanVsHumanGame: false }))
        .toEqual({ hu: 'Válassz szerepet, utána indul a játék!', en: 'Choose a role to start the game!' });
    });

    it('play: returns "Your turn" when client move is allowed', () => {
      expect(getCtaText({ phase: 'play', isHumanVsHumanGame: false, isClientMoveAllowed: true }))
        .toEqual({ hu: 'Te jössz', en: 'Your turn' });
    });

    it("play: returns \"Computer's turn\" when client move is not allowed", () => {
      expect(getCtaText({ phase: 'play', isHumanVsHumanGame: false, isClientMoveAllowed: false }))
        .toEqual({ hu: 'Mi jövünk', en: "Computer's turn" });
    });

    it('gameEnd: returns win message when role selector won', () => {
      expect(getCtaText({ phase: 'gameEnd', isHumanVsHumanGame: false, isRoleSelectorWinner: true }))
        .toEqual({ hu: 'Nyertél. Gratulálunk! :)', en: 'You won. Congratulations! :)' });
    });

    it('gameEnd: returns lose message when role selector did not win', () => {
      expect(getCtaText({ phase: 'gameEnd', isHumanVsHumanGame: false, isRoleSelectorWinner: false }))
        .toEqual({
          hu: 'Sajnos, most nem nyertél, de ne add fel.',
          en: "Unfortunately you didn't win this time, but don't give up."
        });
    });
  });
});

const defaultVariants = [{ botStrategy: () => {}, generateStartBoard: () => {}, originalIndex: 0, disabled: false }];

const renderSidebar = (ctxOverrides = {}, movesOverrides = {}, variants = defaultVariants) => {
  const ctx = {
    isHumanVsHumanGame: false,
    phase: 'roleSelection',
    isClientMoveAllowed: false,
    isRoleSelectorWinner: false,
    playerNames: ['Player 1', 'Player 2'],
    currentPlayerName: 'Player 1',
    winnerName: null,
    ...ctxOverrides
  };
  const moves = {
    switchMode: vi.fn(),
    startGame: vi.fn(),
    startNewGame: vi.fn(),
    setPlayerNames: vi.fn(),
    setDifficulty: vi.fn(),
    ...movesOverrides
  };
  const { container } = render(
    <MemoryRouter>
      <GameSidebar
        roleLabels={undefined}
        stepDescription=""
        ctx={ctx}
        moves={moves}
        variants={variants}
        selectedVariantIndex={0}
      />
    </MemoryRouter>
  );
  return { container, moves };
};

describe('GameSidebar', () => {
  it('shows name inputs in vsHuman roleSelection', () => {
    renderSidebar({ isHumanVsHumanGame: true, phase: 'roleSelection' });
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('does not show name inputs in vsComputer roleSelection', () => {
    renderSidebar({ isHumanVsHumanGame: false, phase: 'roleSelection' });
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('shows spinner in vsComputer play when it is the computer turn', () => {
    const { container } = renderSidebar({
      isHumanVsHumanGame: false,
      phase: 'play',
      isClientMoveAllowed: false
    });
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('does not show spinner in vsHuman play', () => {
    const { container } = renderSidebar({
      isHumanVsHumanGame: true,
      phase: 'play',
      isClientMoveAllowed: true
    });
    expect(container.querySelector('.animate-spin')).toBeNull();
  });
});
