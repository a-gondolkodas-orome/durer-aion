import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./heap-splitter.html'),
  components: { GameSidebar },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters(['isGameReadyToStart', 'isGameFinished'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickPiece({ heapId, pieceId }) {
      if (!this.shouldPlayerMoveNext || pieceId === this.board[heapId] - 1) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, { heapId, pieceId }));
      this.hoveredPiece = null;
    },
    toBeLeft({ heapId, pieceId }) {
      if (this.hoveredPiece === null) return false;
      if (heapId !== this.hoveredPiece.heapId) return false;
      if (this.hoveredPiece.pieceId === this.board[heapId] - 1) return false;
      if (pieceId > this.hoveredPiece.pieceId) return false;
      return true;
    },
    isBannedHover() {
      if (this.hoveredPiece === null) return false;
      return this.hoveredPiece.pieceId === this.board[this.hoveredPiece.heapId] - 1;
    },
    toBeRemoved({ heapId }) {
      if (this.hoveredPiece === null) return false;
      return this.hoveredPiece.heapId !== heapId;
    },
    currentChoiceDescription(heapId) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[heapId];

      if (this.isGameReadyToStart || !this.shouldPlayerMoveNext || !this.hoveredPiece) return pieceCountInPile;
      if (this.hoveredPiece.heapId !== heapId) return `${pieceCountInPile} → 🗑️`;

      return `${pieceCountInPile} → ${this.hoveredPiece.pieceId + 1}, ${pieceCountInPile - this.hoveredPiece.pieceId - 1}`;
    }
  },
  created() {
    this.initializeGame();
  }
};
