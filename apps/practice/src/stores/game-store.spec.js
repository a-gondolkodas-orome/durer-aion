import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from './game-store';

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
      expect(game.ctaText).toMatch(/elindítani a játékot/);
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

      game.gameStatus = 'inProgress';
      expect(game.isEnemyMoveInProgress).toBe(false);

      game.makeAiMove();
      expect(game.isEnemyMoveInProgress).toBe(true);
      jest.advanceTimersToNextTimer();
      expect(game.isEnemyMoveInProgress).toBe(false);
    });
  });
});
