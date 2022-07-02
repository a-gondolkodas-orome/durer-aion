import { mapGetters, mapActions, mapState } from 'vuex';
import { isEqual } from 'lodash-es';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./heap-splitter.html'),
  components: { GameSidebar },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'isGameReadyToStart',
      'isGameFinished'
    ]),
    stepDescription() {
      return 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickPiece({ rowIndex, pieceIndex }) {
      if (!this.shouldPlayerMoveNext || pieceIndex === 0) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, { rowIndex, pieceIndex }));
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

      return `${pieceCountInPile} → ${this.hoveredPiece.pieceIndex}, ${pieceCountInPile - this.hoveredPiece.pieceIndex}`;
    }
  },
  created() {
    this.initializeGame();
  }
};
