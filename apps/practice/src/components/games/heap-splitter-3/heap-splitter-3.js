import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { isEqual } from 'lodash-es';

export default {
  name: 'heap-splitter-3',
  template: require('./heap-splitter-3.html'),
  components: { GameSidebar },
  data: () => ({
    removedRowIndex: null,
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['game', 'board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'isGameInProgress',
      'isGameReadyToStart',
      'isGameFinished'
    ]),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Először kattints az eltávolítandó kupacra, majd arra a korongra, ahol ketté akarod vágni a kupacot.'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'initializeGame']),
    rowColor({ rowIndex }) {
      if (!this.isGameInProgress) return 'blue';
      if (rowIndex === this.removedRowIndex) {
        if (this.hoveredPiece === null) return 'red';
        if (this.hoveredPiece.rowIndex === rowIndex) return 'blue';
        return 'red';
      }
      if (this.hoveredPiece === null) return 'blue';
      if (this.removedRowIndex === null && this.hoveredPiece.rowIndex === rowIndex) return 'red';
      return 'blue';
    },
    pieceClickNotAllowed({ rowIndex, pieceIndex }) {
      if (this.removedRowIndex === null) return false;
      if (this.removedRowIndex === rowIndex) return false;
      return pieceIndex === 0;
    },
    clickPiece({ rowIndex, pieceIndex }) {
      if (!this.shouldPlayerMoveNext) return;
      if (this.removedRowIndex === rowIndex) {
        this.removedRowIndex = null;
        return;
      }
      if (this.removedRowIndex === null) {
        this.removedRowIndex = rowIndex;
        return;
      }
      if (pieceIndex === 0) return;
      this.playerMove(this.game.strategy.getGameStateAfterMove(this.board, {
        removedRowIndex: this.removedRowIndex,
        splitRowIndex: rowIndex,
        pieceIndex
      }));
      this.hoveredPiece = null;
      this.removedRowIndex = null;
    },
    shouldShowDividerToTheLeft(piece) {
      if (this.removedRowIndex === null) return false;
      if (this.removedRowIndex === piece.rowIndex) return false;
      return isEqual(this.hoveredPiece, piece) && piece.pieceIndex !== 0;
    },
    currentChoiceDescription(rowIndex) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[rowIndex];

      if (this.isGameReadyToStart || !this.shouldPlayerMoveNext) return pieceCountInPile;
      if (rowIndex === this.removedRowIndex) {
        if (this.hoveredPiece && this.hoveredPiece.rowIndex === rowIndex) {
          return 'Eldobás visszavonása?';
        }
        return `${pieceCountInPile} → 🗑️`;
      }
      if (!this.hoveredPiece) return pieceCountInPile;
      if (this.removedRowIndex === null && this.hoveredPiece.rowIndex === rowIndex) {
        return `${pieceCountInPile} → 🗑️`;
      }
      if (this.hoveredPiece.rowIndex !== rowIndex || this.hoveredPiece.pieceIndex === 0) return pieceCountInPile;

      return `${pieceCountInPile} → ${this.hoveredPiece.pieceIndex}, ${pieceCountInPile - this.hoveredPiece.pieceIndex}`;
    }
  },
  created() {
    this.initializeGame();
  }
};
