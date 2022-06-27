import createStore from './store';

const initializeStoreWithGame = (gameId = 'HeapSplitter') => {
  const store = createStore();
  store.commit('setGameDefinition', { gameId });
  store.dispatch('initializeGame');
  return store;
};

describe('store', () => {
  describe('ctaText', () => {
    it('should return selectRole prompt at the start of game', () => {
      const store = initializeStoreWithGame();
      expect(store.getters.ctaText).toMatch(/elindítani a játékot/);
    });

    it('should return who is next during game', () => {
      const store = initializeStoreWithGame('HeapSplitter');

      store.dispatch('startGameWithRoleSelection', { isFirst: true });
      expect(store.getters.ctaText).toMatch(/Te jössz/);

      store.dispatch('endPlayerTurn', { board: [2, 3], isGameEnd: false });
      expect(store.getters.ctaText).toMatch(/Mi jövünk/);
    });

    it('should return congratulations text at the end of game if player is the winner', () => {
      const store = initializeStoreWithGame('HeapSplitter');

      store.dispatch('startGameWithRoleSelection', { isFirst: true });
      store.dispatch('endPlayerTurn', { board: [1, 1], isGameEnd: true, hasFirstPlayerWon: true });
      expect(store.getters.ctaText).toMatch(/Gratulálunk/);
    });

    it('should return keepTrying text at the end of game if player is the loser', () => {
      jest.useFakeTimers();
      const store = initializeStoreWithGame('HeapSplitter');

      store.commit('setBoard', [2, 1]); // ensure win for AI in one step
      store.dispatch('startGameWithRoleSelection', { isFirst: false });
      jest.advanceTimersToNextTimer();

      expect(store.getters.ctaText).toMatch(/Sajnos.*ne add fel/);
    });
  });

  describe('endTurn', () => {
    it('should set the board', () => {
      const store = initializeStoreWithGame('HeapSplitter');
      store.commit('setBoard', [5, 3]);
      store.dispatch('startGameWithRoleSelection', { isFirst: true });

      store.dispatch('endTurn', { board: [2, 3], isGameEnd: false });

      expect(store.state.board).toEqual([2, 3]);
    });

    it('should mark the other player as next', () => {
      const store = initializeStoreWithGame('HeapSplitter');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });

      store.dispatch('endTurn', { board: [2, 3], isGameEnd: false });
      expect(store.state.shouldPlayerMoveNext).toBe(false);
      store.dispatch('endTurn', { board: [1, 2], isGameEnd: false });
      expect(store.state.shouldPlayerMoveNext).toBe(true);
    });

    it('should mark as nobody should move next if game ended', () => {
      const store = initializeStoreWithGame('HeapSplitter');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });

      store.dispatch('endTurn', { board: [1, 1], isGameEnd: true });
      expect(store.state.shouldPlayerMoveNext).toBe(null);
    });

    it('should mark the player winner in a game where the last to move is always the winner', () => {
      const store = initializeStoreWithGame('HeapSplitter');
      store.commit('setBoard', [2, 9]);
      store.dispatch('startGameWithRoleSelection', { isFirst: true });

      store.dispatch('endTurn', { board: [1, 1], isGameEnd: true });
      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(true);
    });

    it('should mark the player loser in a game where the last to move is always the winner', () => {
      const store = initializeStoreWithGame('HeapSplitter');
      store.commit('setBoard', [2, 1]); // ensure win for AI in one step
      store.dispatch('startGameWithRoleSelection', { isFirst: false });

      store.dispatch('endTurn', { board: [1, 1], isGameEnd: true });
      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(false);
    });

    it('should mark the player playing first winner according to hasFirstPlayerWon if passed', () => {
      const store = initializeStoreWithGame('HunyadiAndTheJanissaries');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });
      store.dispatch('endTurn', { board: [['red', 'blue']], isGameEnd: false });

      store.dispatch('endTurn', { board: [[]], isGameEnd: true, hasFirstPlayerWon: true });

      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(true);
    });

    it('should mark the player playing first loser according to hasFirstPlayerWon if passed', () => {
      const store = initializeStoreWithGame('HunyadiAndTheJanissaries');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });
      store.dispatch('endTurn', { board: [['red']], isGameEnd: false });

      store.dispatch('endTurn', { board: [[]], isGameEnd: true, hasFirstPlayerWon: false });

      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(false);
    });

    it('should mark the player playing second winner according to hasFirstPlayerWon if passed', () => {
      const store = initializeStoreWithGame('HunyadiAndTheJanissaries');
      store.dispatch('startGameWithRoleSelection', { isFirst: false });
      store.dispatch('endTurn', { board: [['red', 'blue']], isGameEnd: false });

      store.dispatch('endTurn', { board: [[]], isGameEnd: true, hasFirstPlayerWon: true });

      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(false);
    });

    it('should mark the player playing second loser according to hasFirstPlayerWon if passed', () => {
      const store = initializeStoreWithGame('HunyadiAndTheJanissaries');
      store.dispatch('startGameWithRoleSelection', { isFirst: false });
      store.dispatch('endTurn', { board: [['red']], isGameEnd: false });

      store.dispatch('endTurn', { board: [[]], isGameEnd: true, hasFirstPlayerWon: false });

      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(true);
    });
  });

  describe('makeAiMove', () => {
    it('should apply move according to the AI strategy of the game', () => {
      jest.useFakeTimers();
      const store = initializeStoreWithGame('HeapSplitter');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });
      store.dispatch('endTurn', { board: [2, 1], isGameEnd: false });

      store.dispatch('makeAiMove');
      jest.advanceTimersToNextTimer();

      expect(store.state.board).toEqual([1, 1]);
      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(false);
    });

    it('should simulate slow thinking', () => {
      jest.useFakeTimers();
      const store = initializeStoreWithGame('HeapSplitter');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });
      store.dispatch('endTurn', { board: [3, 5], isGameEnd: false });

      store.dispatch('makeAiMove');
      expect(store.getters.isEnemyMoveInProgress).toBe(true);
      jest.advanceTimersToNextTimer();
      expect(store.getters.isEnemyMoveInProgress).toBe(false);
    });
  });

  describe('endPlayerTurn', () => {
    it('should apply the move', () => {
      const store = initializeStoreWithGame('HeapSplitter');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });

      store.dispatch('endPlayerTurn', { board: [1, 1], isGameEnd: true });

      expect(store.state.board).toEqual([1, 1]);
      expect(store.getters.isGameFinished).toBe(true);
      expect(store.state.isPlayerWinner).toBe(true);
      expect(store.getters.isEnemyMoveInProgress).toBe(false);
    });

    it('should initiate AI move if game did not end', () => {
      const store = initializeStoreWithGame('HeapSplitter');
      store.dispatch('startGameWithRoleSelection', { isFirst: true });

      store.dispatch('endPlayerTurn', { board: [2, 1], isGameEnd: false });
      expect(store.getters.isEnemyMoveInProgress).toBe(true);
    });
  });
});
