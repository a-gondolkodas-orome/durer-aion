import { createStore } from 'vuex';
import { gameList } from '../components/games/games';

export default () => createStore({
  state: {
    gameDefinition: null,
    board: null,
    gameStatus: null,
    isPlayerTheFirstToMove: null,
    shouldPlayerMoveNext: null,
    isPlayerWinner: null,
    enemyMoveTimeoutHandle: null,
    isEnemyMoveInProgress: null
  },
  getters: {
    isGameInProgress: (state) => state.gameStatus === 'inProgress',
    isGameReadyToStart: (state) => state.gameStatus === 'readyToStart',
    isGameFinished: (state) => state.gameStatus === 'finished',
    isEnemyMoveInProgress: (state) => state.isEnemyMoveInProgress && state.enemyMoveTimeoutHandle !== null,
    ctaText: (state, getters) => {
      if (getters.isGameInProgress) {
        return state.shouldPlayerMoveNext ? 'Te jössz.' : 'Mi jövünk.';
      } else if (getters.isGameFinished) {
        return state.isPlayerWinner ? 'Nyertél. Gratulálunk! :)' : 'Sajnos, most nem nyertél, de ne add fel.';
      } else { // ready to start
        return 'A gombra kattintva tudod elindítani a játékot.';
      }
    }
  },
  mutations: {
    setGameDefinition(state, { gameId }) {
      state.gameDefinition = gameList[gameId] || null;
    },
    setGameStatus(state, status) {
      state.gameStatus = status;
    },
    setBoard(state, board) {
      state.board = board;
    }
  },
  actions: {
    initializeGame({ state, commit }) {
      clearTimeout(state.enemyMoveTimeoutHandle);
      state.isEnemyMoveInProgress = false;
      state.shouldPlayerMoveNext = null;
      state.isPlayerWinner = null;
      state.isPlayerTheFirstToMove = null;

      state.board = state.gameDefinition.strategy.generateNewBoard();
      commit('setGameStatus', 'readyToStart');
    },
    startGameWithRoleSelection: ({ state, dispatch }, { isFirst = true }) => {
      state.isPlayerTheFirstToMove = isFirst;
      state.shouldPlayerMoveNext = isFirst;
      state.gameStatus = 'inProgress';
      if (!isFirst) dispatch('makeAiMove');
    },
    endPlayerTurn: ({ dispatch }, { board, isGameEnd, hasFirstPlayerWon }) => {
      dispatch('endTurn', { board, isGameEnd, hasFirstPlayerWon });
      if (!isGameEnd) {
        dispatch('makeAiMove');
      }
    },
    makeAiMove: async ({ state, dispatch }) => {
      state.isEnemyMoveInProgress = true;
      const time = Math.floor(Math.random() * 750 + 750);
      state.enemyMoveTimeoutHandle = setTimeout(() => {
        dispatch('endTurn', state.gameDefinition.strategy.getGameStateAfterAiMove(state.board, state.isPlayerTheFirstToMove));
        state.isEnemyMoveInProgress = false;
      }, time);
    },
    endTurn({ state, dispatch }, { board, isGameEnd, hasFirstPlayerWon }) {
      state.board = board;
      state.shouldPlayerMoveNext = !state.shouldPlayerMoveNext;
      if (isGameEnd) {
        const isPlayerWinner = state.gameDefinition.strategy.isTheLastMoverTheWinner === null
          ? state.isPlayerTheFirstToMove === hasFirstPlayerWon
          : state.gameDefinition.strategy.isTheLastMoverTheWinner === !state.shouldPlayerMoveNext;
        dispatch('endGame', { isPlayerWinner });
      }
    },
    endGame({ state }, { isPlayerWinner }) {
      state.isPlayerWinner = isPlayerWinner;
      clearTimeout(state.enemyMoveTimeoutHandle);
      state.gameStatus = 'finished';
      state.shouldPlayerMoveNext = null;
    }
  }
});
