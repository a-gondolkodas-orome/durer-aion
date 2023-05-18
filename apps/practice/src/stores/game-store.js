import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({
    gameStatus: null,
    shouldPlayerMoveNext: false,
    isPlayerWinner: false,
    isEnemyMoveInProgress: false
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
    makeAiMove() {
      this.isEnemyMoveInProgress = true;
      const time = Math.floor(Math.random() * 750 + 750);
      this.enemyMoveTimeoutHandle = setTimeout(() => {
        // this.endTurn(this.gameDefinition.strategy.getGameStateAfterAiMove(this.board, this.isPlayerTheFirstToMove));
        this.isEnemyMoveInProgress = false;
      }, time);
    }
  }
});
