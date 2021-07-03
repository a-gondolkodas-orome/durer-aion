import Vue from 'vue'
import Vuex from 'vuex'
import { makeAiMove } from '../components/kupac-ketteoszto/ai-strategy/ai-strategy';
import { isGameEnd, generateNewBoard } from '../components/kupac-ketteoszto/rules/rules';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    gameStatus: 'readyToStart',
    shouldPlayerMoveNext: false,
    isPlayerWinner: false,
    board: null,
    enemyMoveTimeoutHandle: null,
    isEnemyMoveInProgress: false
  },
  getters: {
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
    setEnemyMoveInProgress(state, isInProgress) {
      state.isEnemyMoveInProgress = isInProgress;
    },
    startGameAsPlayer(state, isFirstPlayer) {
      state.gameStatus = 'inProgress';
      state.shouldPlayerMoveNext = isFirstPlayer;
    },
    applyMove(state, board) {
      state.board = board;
      state.shouldPlayerMoveNext = !state.shouldPlayerMoveNext;
      if (isGameEnd(board)) {
        clearTimeout(state.enemyMoveTimeoutHandle);
        state.gameStatus = 'finished';
        state.isPlayerWinner = !state.shouldPlayerMoveNext;
      }
    },
    resetGame(state) {
      clearTimeout(state.enemyMoveTimeoutHandle);
      state.board = generateNewBoard();
      state.isEnemyMoveInProgress = false;
      state.gameStatus = 'readyToStart';
      state.shouldPlayerMoveNext = false;
      state.isPlayerWinner = false;
    }
  },
  actions: {
    startGameAsPlayer: ({ commit, dispatch }, isFirstPlayer) => {
      commit('startGameAsPlayer', isFirstPlayer);
      if (!isFirstPlayer) {
        dispatch('aiMove');
      }
    },
    aiMove: async ({ state, commit }) => {
      commit('setEnemyMoveInProgress', true);
      const time = Math.floor(Math.random() * 750 + 750);
      state.enemyMoveTimeoutHandle = setTimeout(() => {
        commit('applyMove', makeAiMove(state.board))
        commit('setEnemyMoveInProgress', false);
      }, time);
    },
    playerMove: ({ getters, commit, dispatch }, board) => {
      commit('applyMove', board);
      if (!getters.isGameFinished) {
        dispatch('aiMove');
      }
    }
  }
});
