import { createStore } from 'vuex';
import { gameList } from '../components/games/games';

export const store = createStore({
  state: {
    openedGame: null,
    gameStatus: 'readyToStart',
    shouldPlayerMoveNext: false,
    isPlayerWinner: false,
    board: null,
    enemyMoveTimeoutHandle: null,
    isEnemyMoveInProgress: false
  },
  getters: {
    selectedGame: state => gameList.find(game => game.component === state.openedGame),
    isGameInProgress: state => state.gameStatus === 'inProgress',
    isGameFinished: state => state.gameStatus === 'finished',
    isGameReadyToStart: state => state.gameStatus === 'readyToStart',
    isEnemyMoveInProgress: state => state.isEnemyMoveInProgress && state.enemyMoveTimeoutHandle != null,
    shouldPlayerMoveNext: state => state.shouldPlayerMoveNext,
    getBoard: state => state.board,
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
    setOpenedGame(state, openedGame) {
      state.openedGame = openedGame;
    },
    setEnemyMoveInProgress(state, isInProgress) {
      state.isEnemyMoveInProgress = isInProgress;
    },
    startGameAsPlayer(state, isFirstPlayer) {
      state.gameStatus = 'inProgress';
      state.shouldPlayerMoveNext = isFirstPlayer;
    }
  },
  actions: {
    startGameAsPlayer: ({ commit, dispatch }, isFirstPlayer) => {
      commit('startGameAsPlayer', isFirstPlayer);
      if (!isFirstPlayer) {
        dispatch('aiMove');
      }
    },
    applyMove({ state, getters }, board) {
      state.board = board;
      state.shouldPlayerMoveNext = !state.shouldPlayerMoveNext;
      if (getters.selectedGame.rules.isGameEnd(board)) {
        clearTimeout(state.enemyMoveTimeoutHandle);
        state.gameStatus = 'finished';
        state.isPlayerWinner = !state.shouldPlayerMoveNext;
      }
    },
    resetGame({ state, getters }) {
      clearTimeout(state.enemyMoveTimeoutHandle);
      state.board = getters.selectedGame.rules.generateNewBoard();
      state.isEnemyMoveInProgress = false;
      state.gameStatus = 'readyToStart';
      state.shouldPlayerMoveNext = false;
      state.isPlayerWinner = false;
    },
    aiMove: async ({ state, getters, dispatch, commit }) => {
      commit('setEnemyMoveInProgress', true);
      const time = Math.floor(Math.random() * 750 + 750);
      state.enemyMoveTimeoutHandle = setTimeout(() => {
        dispatch('applyMove', getters.selectedGame.strategy.makeAiMove(state.board));
        commit('setEnemyMoveInProgress', false);
      }, time);
    },
    playerMove: ({ getters, dispatch }, board) => {
      dispatch('applyMove', board);
      if (!getters.isGameFinished) {
        dispatch('aiMove');
      }
    }
  }
});
