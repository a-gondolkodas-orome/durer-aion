// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Ctx } from 'boardgame.io';
import { GUESSER_PLAYER, JUDGE_PLAYER } from 'game';
import type { GameStateMixin } from 'game';
import { ClientRepoProvider } from '../client/client-repo-context';
import { MockClientRepository } from '../client/mock-client-repository';
import { MockTeamState } from '../client/hooks/mock-user-hooks';
import { boardWrapper } from './boardwrapper';
import type { StrategyBoardProps } from './boardwrapper';

const i18n = vi.hoisted(() => ({ language: 'hu' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n }),
}));
vi.mock('../client/hooks/user-hooks', () => MockTeamState.mockHook);

afterEach(() => {
  i18n.language = 'hu';
});

const DefaultBoard = boardWrapper<object>(() => <div />, { rules: {} });

/// Only the fields the wrapper reads; boardgame.io hands a board plenty more.
function renderBoard(ctx: Partial<Ctx>, game: Partial<GameStateMixin> = {}, Board = DefaultBoard) {
  const G: GameStateMixin = {
    millisecondsRemaining: 10 * 60 * 1000,
    start: new Date().toISOString(),
    end: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    firstPlayer: null,
    difficulty: 'live',
    winner: null,
    numberOfTries: 1,
    numberOfLoss: 0,
    winningStreak: 0,
    points: 0,
    liveResults: [],
    ...game,
  };
  const props = {
    G,
    ctx: { numPlayers: 2, playOrder: ['0', '1'], playOrderPos: 0, activePlayers: null, turn: 1, ...ctx },
    moves: { getTime: vi.fn(), chooseNewGameType: vi.fn(), chooseRole: vi.fn() },
  } as unknown as StrategyBoardProps<object>;
  render(
    <ClientRepoProvider value={new MockClientRepository()}>
      <Board {...props} />
    </ClientRepoProvider>
  );
}

describe('the strategy board on the judge\'s turn', () => {
  // The judge sets the opening position of each new game, so it moves in
  // `startNewGame` too — and the team used to
  // be offered the two new-game buttons there, which refuse the move.
  test('says it is waiting while the judge opens a new game', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: '1' });

    expect(screen.getByText('strategy.guide.waitingForServer')).toBeInTheDocument();
    expect(screen.getByText('strategy.guide.liveStarted')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.newGame')).not.toBeInTheDocument();
    expect(screen.queryByText('strategy.testGameButton')).not.toBeInTheDocument();
    expect(screen.queryByText('strategy.realGameButton')).not.toBeInTheDocument();
  });

  test('says it is waiting during a game', () => {
    renderBoard({ phase: 'play', currentPlayer: '1' });

    expect(screen.getByText('strategy.guide.waitingForServer')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.yourTurn')).not.toBeInTheDocument();
  });

  // `startNewGame` with the team to move is the gap between games, never a
  // move inside one: the match opens on it, and a game that ends returns to it.
  test('offers the first game of the match', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: '0' });

    expect(screen.getByText('strategy.guide.newGame')).toBeInTheDocument();
    expect(screen.getByText('strategy.testGameButton')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.waitingForServer')).not.toBeInTheDocument();
  });

  test('offers the next game once one has ended, under its result', () => {
    renderBoard({ phase: 'startNewGame', currentPlayer: '0' }, { winner: JUDGE_PLAYER });

    expect(screen.getByText('strategy.guide.botWins')).toBeInTheDocument();
    expect(screen.getByText('strategy.testGameButton')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.newGame')).not.toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.waitingForServer')).not.toBeInTheDocument();
  });

  test('says it is the team\'s turn during a game', () => {
    renderBoard({ phase: 'play', currentPlayer: '0' });

    expect(screen.getByText('strategy.guide.yourTurn')).toBeInTheDocument();
    expect(screen.queryByText('strategy.guide.waitingForServer')).not.toBeInTheDocument();
  });
});

describe('the strategy board\'s description', () => {
  test('is the one given, whatever the page language, when it is given once', () => {
    i18n.language = 'en';
    renderBoard({ phase: 'play', currentPlayer: '0' }, {}, boardWrapper<object>(() => <div />, { rules: <p>egyetlen szabály</p> }));

    expect(screen.getByText('egyetlen szabály')).toBeInTheDocument();
  });

  test('is in the page language', () => {
    i18n.language = 'en';
    renderBoard({ phase: 'play', currentPlayer: '0' }, {}, boardWrapper<object>(() => <div />, { rules: { hu: 'magyar szabály', en: 'English rule' } }));

    expect(screen.getByText('English rule')).toBeInTheDocument();
    expect(screen.queryByText('magyar szabály')).not.toBeInTheDocument();
  });

  test('is in another language where the game has none in the page\'s', () => {
    i18n.language = 'en';
    renderBoard({ phase: 'play', currentPlayer: '0' }, {}, boardWrapper<object>(() => <div />, { rules: { hu: 'magyar szabály' } }));

    expect(screen.getByText('magyar szabály')).toBeInTheDocument();
  });
});

describe('the game\'s own words on its roles and moves', () => {
  // A board that, like the 5×5 one, holds half a move before sending it.
  const StepBoard = boardWrapper<object>(({ setTurnState }) =>
    <button data-testid="cell" onClick={() => setTurnState?.({ picked: true })}>cell</button>, {
    rules: {},
    roleLabels: [{ hu: 'Kezdő (1 O)', en: 'First (1 O)' }, { hu: 'Második (2 X)', en: 'Second (2 X)' }],
    getPlayerStepDescription: ({ turnState }) => (turnState as { picked?: boolean } | null)?.picked ? 'second step' : 'first step',
  });

  test('name the role buttons in the page language', () => {
    i18n.language = 'en';
    renderBoard({ phase: 'chooseRole', currentPlayer: GUESSER_PLAYER }, {}, StepBoard);

    expect(screen.getByRole('button', { name: 'First (1 O)' })).toBeInTheDocument();
    expect(screen.queryByText('strategy.firstPlayer')).not.toBeInTheDocument();
  });

  test('tell the team its next step, as the board reports it, and the role it chose', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { firstPlayer: JUDGE_PLAYER }, StepBoard);

    expect(screen.getByText('first step')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cell'));
    expect(screen.getByText('second step')).toBeInTheDocument();
    expect(screen.getByText(/Második \(2 X\)/)).toBeInTheDocument();
  });

  test('say nothing of a step on the bot\'s turn', () => {
    renderBoard({ phase: 'play', currentPlayer: JUDGE_PLAYER }, { firstPlayer: JUDGE_PLAYER }, StepBoard);

    expect(screen.queryByText('first step')).not.toBeInTheDocument();
  });

  test('call the roles of a game that names none by who starts', () => {
    renderBoard({ phase: 'play', currentPlayer: GUESSER_PLAYER }, { firstPlayer: GUESSER_PLAYER });

    expect(screen.getByText(/strategy\.role\.first/)).toBeInTheDocument();
  });
});
