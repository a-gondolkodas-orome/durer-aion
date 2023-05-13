import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
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
      return pieceId === this.board[heapId] - 1;
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
      if (pieceId === this.board[heapId] - 1) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, {
        removedHeapId: this.removedHeapId,
        splitHeapId: heapId,
        pieceId
      }));
      this.resetTurnState();
    },
    toBeLeft({ heapId, pieceId }) {
      if (this.hoveredPiece === null) return false;
      if (this.removedHeapId === null) return false;
      if (this.removedHeapId === heapId) return false;
      if (heapId !== this.hoveredPiece.heapId) return false;
      if (this.hoveredPiece.pieceId === this.board[heapId] - 1) return false;
      if (pieceId > this.hoveredPiece.pieceId) return false;
      return true;
    },
    isBannedHover() {
      if (this.hoveredPiece === null) return false;
      return this.hoveredPiece.pieceId === this.board[this.hoveredPiece.heapId] - 1;
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
      if (this.hoveredPiece.heapId !== heapId) return pieceCountInHeap;

      return `${pieceCountInHeap} → ${this.hoveredPiece.pieceId + 1}, ${pieceCountInHeap - this.hoveredPiece.pieceId - 1}`;
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
