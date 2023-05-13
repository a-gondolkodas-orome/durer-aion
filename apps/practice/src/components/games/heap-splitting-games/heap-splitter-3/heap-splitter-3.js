import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import { isEqual } from 'lodash-es';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./heap-splitter-3.html'),
  components: { GameSidebar },
  data: () => ({
    removedheapId: null,
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters(['isGameInProgress', 'isGameFinished'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    rowColor({ heapId }) {
      if (!this.isGameInProgress) return 'blue';

      if (heapId === this.removedheapId) {
        if (this.hoveredPiece === null) return 'red';
        if (this.hoveredPiece.heapId === heapId) return 'blue';
        return 'red';
      }
      if (this.hoveredPiece === null) return 'blue';
      if (this.removedheapId === null && this.hoveredPiece.heapId === heapId) return 'red';
      return 'blue';
    },
    pieceClickNotAllowed({ heapId, pieceId }) {
      if (this.removedheapId === null) return false;
      if (this.removedheapId === heapId) return false;
      return pieceId === 0;
    },
    clickPiece({ heapId, pieceId }) {
      if (!this.shouldPlayerMoveNext) return;

      if (this.removedheapId === heapId) {
        this.removedheapId = null;
        return;
      }
      if (this.removedheapId === null) {
        this.removedheapId = heapId;
        return;
      }
      if (pieceId === 0) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, {
        removedheapId: this.removedheapId,
        splitheapId: heapId,
        pieceId
      }));
      this.resetTurnState();
    },
    shouldShowDividerToTheLeft(piece) {
      if (this.removedheapId === null) return false;
      if (this.removedheapId === piece.heapId) return false;
      return isEqual(this.hoveredPiece, piece) && piece.pieceId !== 0;
    },
    currentChoiceDescription(heapId) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[heapId];

      if (!this.shouldPlayerMoveNext) return pieceCountInPile;
      if (heapId === this.removedheapId) {
        if (this.hoveredPiece && this.hoveredPiece.heapId === heapId) {
          return 'Mégse?';
        }
        return `${pieceCountInPile} → 🗑️`;
      }
      if (!this.hoveredPiece) return pieceCountInPile;
      if (this.removedheapId === null && this.hoveredPiece.heapId === heapId) {
        return `${pieceCountInPile} → 🗑️`;
      }
      if (this.hoveredPiece.heapId !== heapId || this.hoveredPiece.pieceId === 0) return pieceCountInPile;

      return `${pieceCountInPile} → ${this.hoveredPiece.pieceId}, ${pieceCountInPile - this.hoveredPiece.pieceId}`;
    },
    resetTurnState() {
      this.hoveredPiece = null;
      this.removedheapId = null;
    }
  },
  created() {
    this.initializeGame();
  }
};
