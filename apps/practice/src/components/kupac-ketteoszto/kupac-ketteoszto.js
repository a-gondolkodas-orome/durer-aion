import { mapGetters, mapMutations, mapActions } from 'vuex';
import { getBoardAfterPlayerStep } from './player-step/player-step';

export default {
  name: 'kupac-ketteoszto',
  template: require('./kupac-ketteoszto.html'),
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapGetters([
      'isEnemyMoveInProgress', 'getBoard', 'shouldPlayerMoveNext',
      'isGameInProgress', 'isGameFinished', 'isPlayerWinner', 'isGameReadyToStart'
    ]),
    pieceOpacity() {
      return ({ rowIndex, pieceIndex }) => {
        if (!this.shouldPlayerMoveNext) return 0.5;
        if (!this.hoveredPiece) return 1;
        return rowIndex === this.hoveredPiece.rowIndex && pieceIndex >= this.hoveredPiece.pieceIndex ? 0.5 : 1;
      };
    },
    ctaText() {
      if (this.isGameInProgress) {
        return this.shouldPlayerMoveNext ? 'Te jössz.' : 'Mi jövünk.';
      } else if (this.isGameFinished) {
        return this.isPlayerWinner ? 'Nyertél. Gratulálunk! :)' : 'Sajnos, most nem nyertél, de ne add fel.';
      } else { // ready to start
        return 'A gombra kattintva tudod elindítani a játékot.';
      }
    },
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.'
        : '';
    }
  },
  methods: {
    ...mapMutations(['resetGame']),
    ...mapActions(['playerMove', 'startGameAsPlayer']),
    clickPiece(rowIndex, pieceIndex) {
      if (!this.shouldPlayerMoveNext) return;
      if (pieceIndex === 1) return;
      const boardAfterPlayerStep = getBoardAfterPlayerStep(this.getBoard, { rowIndex, pieceIndex });
      this.playerMove(boardAfterPlayerStep);
    },
    handleMouseOverPiece(rowIndex, pieceIndex) {
      if (!this.shouldPlayerMoveNext) return;
      if (pieceIndex === 1) return;
      this.hoveredPiece = { rowIndex, pieceIndex }
    },
    handleMouseOutPiece() {
      this.hoveredPiece = null;
    }
  },
  created() {
    this.resetGame();
  }
}
