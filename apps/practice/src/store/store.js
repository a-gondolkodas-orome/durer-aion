import { createStore } from 'vuex';
import { gameList } from '../components/games/games';

export default () => createStore({
  state: {
    gameId: null,
    board: null,
    gameStatus: null,
    isPlayerTheFirstToMove: null,
    shouldPlayerMoveNext: null,
    isPlayerWinner: null,
    enemyMoveTimeoutHandle: null,
    isEnemyMoveInProgress: null
  },
  getters: {
    game: (state) => gameList.find((game) => game.component === state.gameId),
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
    setGameId(state, gameId) {
      state.gameId = gameId;
    },
    setGameStatus(state, status) {
      state.gameStatus = status;
    },
    startGameAsPlayer(state, { isFirst }) {
      state.isPlayerTheFirstToMove = isFirst;
      state.shouldPlayerMoveNext = isFirst;
      state.gameStatus = 'inProgress';
    },
    setBoard(state, board) {
      state.board = board;
    }
  },
  actions: {
    startGameAsPlayer: ({ commit, dispatch }, { isFirst = true }) => {
      commit('startGameAsPlayer', { isFirst });
      if (!isFirst) dispatch('aiMove');
    },
    applyMove({ state, commit }, { board, isGameEnd, hasFirstPlayerWon }) {
      commit('setBoard', board);
      state.shouldPlayerMoveNext = !state.shouldPlayerMoveNext;
      if (isGameEnd) {
        clearTimeout(state.enemyMoveTimeoutHandle);
        state.gameStatus = 'finished';
        state.isPlayerWinner = hasFirstPlayerWon === undefined
          ? !state.shouldPlayerMoveNext
          : state.isPlayerTheFirstToMove === hasFirstPlayerWon;
      }
    },
    initializeGame({ state, commit, getters }) {
      clearTimeout(state.enemyMoveTimeoutHandle);
      state.isEnemyMoveInProgress = false;
      state.shouldPlayerMoveNext = null;
      state.isPlayerWinner = null;
      state.isPlayerTheFirstToMove = null;

      state.board = getters.game.strategy.generateNewBoard();
      commit('setGameStatus', 'readyToStart');
    },
    aiMove: async ({ state, getters, dispatch }) => {
      state.isEnemyMoveInProgress = true;
      const time = Math.floor(Math.random() * 750 + 750);
      state.enemyMoveTimeoutHandle = setTimeout(() => {
        dispatch('applyMove', getters.game.strategy.makeAiMove(state.board, state.isPlayerTheFirstToMove));
        state.isEnemyMoveInProgress = false;
      }, time);
    },
    playerMove: ({ dispatch }, { board, isGameEnd, hasFirstPlayerWon }) => {
      dispatch('applyMove', { board, isGameEnd, hasFirstPlayerWon });
      if (!isGameEnd) {
        dispatch('aiMove');
      }
    }
  }
});
