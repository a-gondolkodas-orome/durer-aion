import { mapGetters, mapMutations, mapActions } from 'vuex';
import { getBoardAfterPlayerStep } from './rules/rules';
import EnemyLoader from '../common/enemy-loader/enemy-loader';

export default {
  name: 'kupac-ketteoszto',
  template: require('./kupac-ketteoszto.html'),
  components: { EnemyLoader },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapGetters([
      'ctaText',
      'isEnemyMoveInProgress',
      'getBoard',
      'shouldPlayerMoveNext',
      'isGameInProgress',
      'isGameReadyToStart'
    ]),
    pieceOpacity() {
      return ({ rowIndex, pieceIndex }) => {
        if (!this.shouldPlayerMoveNext) return 0.5;
        if (!this.hoveredPiece) return 1;
        return rowIndex === this.hoveredPiece.rowIndex && pieceIndex >= this.hoveredPiece.pieceIndex ? 0.5 : 1;
      };
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
