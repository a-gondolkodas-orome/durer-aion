import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import { isEqual } from 'lodash-es';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./heap-splitter-4.html'),
  components: { GameSidebar },
  data: () => ({
    removedHeapId: null,
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'isGameInProgress',
      'isGameReadyToStart',
      'isGameFinished'
    ])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    rowColor({ heapId }) {
      if (!this.isGameInProgress) return 'blue';
      if (heapId === this.removedHeapId) {
        if (this.hoveredPiece === null) return 'red';
        if (this.hoveredPiece.heapId === heapId) return 'blue';
        return 'red';
      }
      if (this.hoveredPiece === null) return 'blue';
      if (this.removedHeapId === null && this.hoveredPiece.heapId === heapId) return 'red';
      return 'blue';
    },
    pieceClickNotAllowed({ heapId, pieceId }) {
      if (this.removedHeapId === null) return false;
      if (this.removedHeapId === heapId) return false;
      return pieceId === 0;
    },
    clickPiece({ heapId, pieceId }) {
      if (!this.shouldPlayerMoveNext) return;
      if (this.removedHeapId === heapId) {
        this.removedHeapId = null;
        return;
      }
      if (this.removedHeapId === null) {
        this.removedHeapId = heapId;
        return;
      }
      if (pieceId === 0) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, {
        removedHeapId: this.removedHeapId,
        splitHeapId: heapId,
        pieceId
      }));
      this.resetTurnState();
    },
    shouldShowDividerToTheLeft(piece) {
      if (this.removedHeapId === null) return false;
      if (this.removedHeapId === piece.heapId) return false;
      return isEqual(this.hoveredPiece, piece) && piece.pieceId !== 0;
    },
    currentChoiceDescription(heapId) {
      if (this.isGameFinished) return '';

      const pieceCountInHeap = this.board[heapId];

      if (this.isGameReadyToStart || !this.shouldPlayerMoveNext) return pieceCountInHeap;
      if (heapId === this.removedHeapId) {
        if (this.hoveredPiece && this.hoveredPiece.heapId === heapId) {
          return 'Mégse?';
        }
        return `${pieceCountInHeap} → 🗑️`;
      }
      if (!this.hoveredPiece) return pieceCountInHeap;
      if (this.removedHeapId === null && this.hoveredPiece.heapId === heapId) {
        return `${pieceCountInHeap} → 🗑️`;
      }
      if (this.hoveredPiece.heapId !== heapId || this.hoveredPiece.pieceId === 0) return pieceCountInHeap;

      return `${pieceCountInHeap} → ${this.hoveredPiece.pieceId}, ${pieceCountInHeap - this.hoveredPiece.pieceId}`;
    },
    resetTurnState() {
      this.hoveredPiece = null;
      this.removedHeapId = null;
    }
  },
  created() {
    this.initializeGame();
  }
};
