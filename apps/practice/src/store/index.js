import { createStore } from 'vuex';
import { gameList } from '../components/games/games';

export const store = createStore({
  state: {
    gameId: null,
    gameStatus: 'readyToStart',
    isPlayerTheFirstToMove: null,
    shouldPlayerMoveNext: false,
    isPlayerWinner: false,
    board: null,
    enemyMoveTimeoutHandle: null,
    isEnemyMoveInProgress: false
  },
  getters: {
    game: state => gameList.find(game => game.component === state.gameId),
    strategy: (_, getters) => getters.game.strategy,
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
    setGameId(state, gameId) {
      state.gameId = gameId;
    },
    setEnemyMoveInProgress(state, isInProgress) {
      state.isEnemyMoveInProgress = isInProgress;
    },
    startGameAsPlayer(state, isFirstPlayer) {
      state.isPlayerTheFirstToMove = isFirstPlayer;
      state.gameStatus = 'inProgress';
      state.shouldPlayerMoveNext = isFirstPlayer;
    },
    setBoard(state, board) {
      state.board = board;
    }
  },
  actions: {
    startGameAsPlayer: ({ commit, dispatch }, isFirstPlayer) => {
      commit('startGameAsPlayer', isFirstPlayer);
      if (!isFirstPlayer) {
        dispatch('aiMove');
      }
    },
    applyMove({ state }, { board, isGameEnd, hasFirstPlayerWon }) {
      state.board = board;
      state.shouldPlayerMoveNext = !state.shouldPlayerMoveNext;
      if (isGameEnd) {
        clearTimeout(state.enemyMoveTimeoutHandle);
        state.gameStatus = 'finished';
        state.isPlayerWinner = hasFirstPlayerWon === undefined
          ? !state.shouldPlayerMoveNext
          : state.isPlayerTheFirstToMove === hasFirstPlayerWon;
      }
    },
    resetGame({ state, getters }) {
      clearTimeout(state.enemyMoveTimeoutHandle);
      state.board = getters.strategy.generateNewBoard();
      state.isEnemyMoveInProgress = false;
      state.gameStatus = 'readyToStart';
      state.shouldPlayerMoveNext = false;
      state.isPlayerWinner = false;
      state.isPlayerTheFirstToMove = null;
    },
    aiMove: async ({ state, getters, dispatch, commit }) => {
      commit('setEnemyMoveInProgress', true);
      const time = Math.floor(Math.random() * 750 + 750);
      state.enemyMoveTimeoutHandle = setTimeout(() => {
        dispatch('applyMove', getters.strategy.makeAiMove(state.board, state.isPlayerTheFirstToMove));
        commit('setEnemyMoveInProgress', false);
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
