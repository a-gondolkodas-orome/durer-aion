import Vue from 'vue'
import Vuex from 'vuex'
import { makeAiMove } from '../components/kupac-ketteoszto/ai-strategy/ai-strategy';
import { generateNewBoard } from '../components/kupac-ketteoszto/initial-state/initial-state';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    gameStatus: 'readyToStart',
    shouldPlayerMoveNext: null,
    isPlayerWinner: null,
    board: null,
    enemyMoveTimeoutHandle: null,
    isEnemyMoveInProgress: false
  },
  getters: {
    isEnemyMoveInProgress: state => state.isEnemyMoveInProgress && state.enemyMoveTimeoutHandle != null,
    isGameInProgress: state => state.gameStatus === 'inProgress',
    isGameFinished: state => state.gameStatus === 'finished',
    isGameReadyToStart: state => state.gameStatus === 'readyToStart',
    shouldPlayerMoveNext: state => state.gameStatus === 'inProgress' ? state.shouldPlayerMoveNext : undefined,
    isPlayerWinner: state => state.gameStatus === 'finished' ? state.isPlayerWinner : undefined,
    getBoard: state => state.board
  },
  mutations: {
    setEnemyMoveInProgress(state, isInProgress) {
      state.isEnemyMoveInProgress = isInProgress;
    },
    setBoard(state, board) {
      state.board = board;
    },
    startGameAsPlayer(state, isFirstPlayer) {
      state.gameStatus = 'inProgress';
      state.shouldPlayerMoveNext = isFirstPlayer;
    },
    applyMove(state, board) {
      state.board = board;
      state.shouldPlayerMoveNext = !state.shouldPlayerMoveNext;
      if (board[0] === 1 && board[1] === 1) {
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
      state.shouldPlayerMoveNext = null;
      state.isPlayerWinner = null;
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
