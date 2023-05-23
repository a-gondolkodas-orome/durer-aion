import { defineStore } from 'pinia';
import { gameList } from '../components/games/games';

export const useGameStore = defineStore('game', {
  state: () => ({
    // game-agnostic
    gameStatus: null,
    shouldPlayerMoveNext: false,
    isPlayerWinner: false,
    isEnemyMoveInProgress: false,
    // game-specific
    gameDefinition: null,
    board: null
  }),
  getters: {
    isGameInProgress: state => state.gameStatus === 'inProgress',
    isGameReadyToStart: state => state.gameStatus === 'readyToStart',
    isGameFinished: state => state.gameStatus === 'finished',
    ctaText(state) {
      if (this.isGameInProgress) {
        return state.shouldPlayerMoveNext ? 'Te jössz.' : 'Mi jövünk.';
      } else if (this.isGameFinished) {
        return state.isPlayerWinner ? 'Nyertél. Gratulálunk! :)' : 'Sajnos, most nem nyertél, de ne add fel.';
      } else { // ready to start
        return 'A gombra kattintva tudod elindítani a játékot.';
      }
    }
  },
  actions: {
    resetCurrentGame() {
      if (this.gameDefinition !== null) {
        this.gameStatus = 'readyToStart';
        this.shouldPlayerMoveNext = false;
        this.isPlayerWinner = false;
        this.isEnemyMoveInProgress = false;

        this.board = this.gameDefinition.strategy.generateNewBoard();
      }
    },
    initializeGame(gameId) {
      this.$reset();

      this.gameDefinition = gameList[gameId] || null;
      this.resetCurrentGame();
    },
    startGameWithRoleSelection({ isFirst = true }) {
      this.isPlayerTheFirstToMove = isFirst;
      this.shouldPlayerMoveNext = isFirst;
      this.gameStatus = 'inProgress';
      if (!isFirst) this.makeAiMove();
    },
    endTurn({ board, isGameEnd, hasFirstPlayerWon }) {
      this.board = board;
      this.shouldPlayerMoveNext = !this.shouldPlayerMoveNext;
      if (isGameEnd) {
        const isPlayerWinner = this.gameDefinition.strategy.isTheLastMoverTheWinner === null
          ? this.isPlayerTheFirstToMove === hasFirstPlayerWon
          : this.gameDefinition.strategy.isTheLastMoverTheWinner === !this.shouldPlayerMoveNext;
        this.endGame({ isPlayerWinner });
      }
    },
    endPlayerTurn({ board, isGameEnd, hasFirstPlayerWon }) {
      this.endTurn({ board, isGameEnd, hasFirstPlayerWon });
      if (!isGameEnd) {
        this.makeAiMove();
      }
    },
    endGame({ isPlayerWinner }) {
      this.isPlayerWinner = isPlayerWinner;
      this.gameStatus = 'finished';
      this.shouldPlayerMoveNext = null;
    },
    makeAiMove() {
      this.isEnemyMoveInProgress = true;
      const time = Math.floor(Math.random() * 750 + 750);
      setTimeout(() => {
        this.endTurn(this.gameDefinition.strategy.getGameStateAfterAiMove(this.board, this.isPlayerTheFirstToMove));
        this.isEnemyMoveInProgress = false;
      }, time);
    }
  }
});
