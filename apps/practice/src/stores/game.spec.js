import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from './game';

describe('game store', () => {
  beforeEach(() => setActivePinia(createPinia()));

  describe('gameStatus', () => {
    it('isGameInProgress returns true if gameStatus is inProgress', () => {
      const game = useGameStore();
      expect(game.isGameInProgress).toBe(false);
      game.gameStatus = 'inProgress';
      expect(game.isGameInProgress).toBe(true);
      game.$reset();
      expect(game.isGameInProgress).toBe(false);
    });

    it('isGameReadyToStart returns true if gameStatus is readyToStart', () => {
      const game = useGameStore();
      expect(game.isGameReadyToStart).toBe(false);
      game.gameStatus = 'readyToStart';
      expect(game.isGameReadyToStart).toBe(true);
      game.$reset();
      expect(game.isGameReadyToStart).toBe(false);
    });

    it('isGameFinished returns true if gameStatus is finished', () => {
      const game = useGameStore();
      expect(game.isGameFinished).toBe(false);
      game.gameStatus = 'finished';
      expect(game.isGameFinished).toBe(true);
      game.$reset();
      expect(game.isGameFinished).toBe(false);
    });
  });

  describe('ctaText', () => {
    it('should return selectRole prompt at the start of game', () => {
      const game = useGameStore();
      game.gameStatus = 'readyToStart';
      expect(game.ctaText).toMatch(/Válassz szerepet/);
    });

    it('should return who is next during game', () => {
      const game = useGameStore();
      game.gameStatus = 'inProgress';

      game.shouldPlayerMoveNext = true;
      expect(game.ctaText).toMatch(/Te jössz/);

      game.shouldPlayerMoveNext = false;
      expect(game.ctaText).toMatch(/Mi jövünk/);
    });

    it('should return congratulations text at the end of game if player is the winner', () => {
      const game = useGameStore();

      game.gameStatus = 'finished';
      game.shouldPlayerMoveNext = false;
      game.isPlayerWinner = true;
      expect(game.ctaText).toMatch(/Gratulálunk/);
    });

    it('should return keepTrying text at the end of game if player is the loser', () => {
      const game = useGameStore();

      game.gameStatus = 'finished';
      game.shouldPlayerMoveNext = false;
      game.isPlayerWinner = false;

      expect(game.ctaText).toMatch(/Sajnos.*ne add fel/);
    });
  });

  describe('makeAiMove', () => {
    it('should simulate slow thinking', async () => {
      jest.useFakeTimers();
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.gameStatus = 'inProgress';
      expect(game.isEnemyMoveInProgress).toBe(false);

      game.makeAiMove();
      expect(game.isEnemyMoveInProgress).toBe(true);
      jest.advanceTimersToNextTimer();
      expect(game.isEnemyMoveInProgress).toBe(false);
    });
  });

  describe('endPlayerTurn', () => {
    it('should apply the move', () => {
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.startGameWithRoleSelection({ isFirst: true });

      game.endPlayerTurn({ board: [1, 1], isGameEnd: true });

      expect(game.board).toEqual([1, 1]);
      expect(game.isGameFinished).toBe(true);
      expect(game.isPlayerWinner).toBe(true);
      expect(game.isEnemyMoveInProgress).toBe(false);
    });

    it('should initiate AI move if game did not end', () => {
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.startGameWithRoleSelection({ isFirst: true });

      game.endPlayerTurn({ board: [2, 1], isGameEnd: false });
      expect(game.isEnemyMoveInProgress).toBe(true);
    });
  });

  describe('endTurn', () => {
    it('should set the board', () => {
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.board = [5, 3];
      game.startGameWithRoleSelection({ isFirst: true });

      game.endTurn({ board: [2, 3], isGameEnd: false });

      expect(game.board).toEqual([2, 3]);
    });

    it('should mark the other player as next', () => {
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.startGameWithRoleSelection({ isFirst: true });

      game.endTurn({ board: [2, 3], isGameEnd: false });
      expect(game.shouldPlayerMoveNext).toBe(false);
      game.endTurn({ board: [1, 2], isGameEnd: false });
      expect(game.shouldPlayerMoveNext).toBe(true);
    });

    it('should mark as nobody should move next if game ended', () => {
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.startGameWithRoleSelection({ isFirst: true });

      game.endTurn({ board: [1, 1], isGameEnd: true });
      expect(game.shouldPlayerMoveNext).toBe(null);
    });

    it('should mark the player winner in a game where the last to move is always the winner', () => {
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.board = [2, 9];
      game.startGameWithRoleSelection({ isFirst: true });

      game.endTurn({ board: [1, 1], isGameEnd: true });
      expect(game.isGameFinished).toBe(true);
      expect(game.isPlayerWinner).toBe(true);
    });

    it('should mark the player loser in a game where the last to move is always the winner', () => {
      const game = useGameStore();
      game.initializeGame('PileSplitter');
      game.board = [2, 1]; // ensure win for AI in one step
      game.startGameWithRoleSelection({ isFirst: false });

      game.endTurn({ board: [1, 1], isGameEnd: true });
      expect(game.isGameFinished).toBe(true);
      expect(game.isPlayerWinner).toBe(false);
    });

    it('should mark the player playing first winner according to hasFirstPlayerWon if passed', () => {
      const game = useGameStore();
      game.initializeGame('HunyadiAndTheJanissaries');
      game.startGameWithRoleSelection({ isFirst: true });
      game.endTurn({ board: [['red', 'blue']], isGameEnd: false });

      game.endTurn({ board: [[]], isGameEnd: true, hasFirstPlayerWon: true });

      expect(game.isGameFinished).toBe(true);
      expect(game.isPlayerWinner).toBe(true);
    });

    it('should mark the player playing first loser according to hasFirstPlayerWon if passed', () => {
      const game = useGameStore();
      game.initializeGame('HunyadiAndTheJanissaries');
      game.startGameWithRoleSelection({ isFirst: true });
      game.endTurn({ board: [['red']], isGameEnd: false });

      game.endTurn({ board: [[]], isGameEnd: true, hasFirstPlayerWon: false });

      expect(game.isGameFinished).toBe(true);
      expect(game.isPlayerWinner).toBe(false);
    });

    it('should mark the player playing second winner according to hasFirstPlayerWon if passed', () => {
      const game = useGameStore();
      game.initializeGame('HunyadiAndTheJanissaries');
      game.startGameWithRoleSelection({ isFirst: false });
      game.endTurn({ board: [['red', 'blue']], isGameEnd: false });

      game.endTurn({ board: [[]], isGameEnd: true, hasFirstPlayerWon: true });

      expect(game.isGameFinished).toBe(true);
      expect(game.isPlayerWinner).toBe(false);
    });

    it('should mark the player playing second loser according to hasFirstPlayerWon if passed', () => {
      const game = useGameStore();
      game.initializeGame('HunyadiAndTheJanissaries');
      game.startGameWithRoleSelection({ isFirst: false });
      game.endTurn({ board: [['red']], isGameEnd: false });

      game.endTurn({ board: [[]], isGameEnd: true, hasFirstPlayerWon: false });

      expect(game.isGameFinished).toBe(true);
      expect(game.isPlayerWinner).toBe(true);
    });
  });
});
