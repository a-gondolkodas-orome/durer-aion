import { mapGetters, mapActions, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';
import { isEqual } from 'lodash-es';

export default {
  name: 'heap-splitter',
  template: require('./heap-splitter.html'),
  components: { EnemyLoader },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['game', 'board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'ctaText',
      'isEnemyMoveInProgress',
      'isGameInProgress',
      'isGameReadyToStart',
      'isGameFinished'
    ]),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'startGameAsPlayer', 'initializeGame']),
    clickPiece({ rowIndex, pieceIndex }) {
      if (!this.shouldPlayerMoveNext || pieceIndex === 0) return;
      this.playerMove(this.game.strategy.getBoardAfterPlayerStep(this.board, { rowIndex, pieceIndex }));
      this.hoveredPiece = null;
    },
    shouldShowDividerToTheLeft(piece) {
      return isEqual(this.hoveredPiece, piece) && piece.pieceIndex !== 0;
    },
    currentChoiceDescription(rowIndex) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[rowIndex];

      if (this.isGameReadyToStart || !this.shouldPlayerMoveNext || !this.hoveredPiece) return pieceCountInPile;
      if (this.hoveredPiece.rowIndex !== rowIndex || this.hoveredPiece.pieceIndex === 0) return pieceCountInPile;

      return `${pieceCountInPile} --> ${this.hoveredPiece.pieceIndex}, ${pieceCountInPile - this.hoveredPiece.pieceIndex}`;
    }
  },
  created() {
    this.initializeGame();
  }
};
