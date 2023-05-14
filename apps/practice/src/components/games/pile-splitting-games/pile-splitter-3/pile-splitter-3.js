import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import GameRule from '../../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./pile-splitter-3.html'),
  components: { GameSidebar, GameRule },
  data: () => ({
    removedPileId: null,
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters(['isGameInProgress', 'isGameFinished'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    isDisabled({ pileId, pieceId }) {
      if (!this.shouldPlayerMoveNext) return true;
      if (this.removedPileId === null) return false;
      return pileId !== this.removedPileId && pieceId === this.board[pileId] - 1;
    },
    pieceClickNotAllowed({ pileId, pieceId }) {
      if (this.removedPileId === null) return false;
      if (this.removedPileId === pileId) return false;
      return pieceId === this.board[pileId] - 1;
    },
    clickPiece({ pileId, pieceId }) {
      if (!this.shouldPlayerMoveNext) return;

      if (this.removedPileId === pileId) {
        this.removedPileId = null;
        return;
      }
      if (this.removedPileId === null) {
        this.removedPileId = pileId;
        return;
      }
      if (pieceId === this.board[pileId] - 1) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, {
        removedPileId: this.removedPileId,
        splitPileId: pileId,
        pieceId
      }));
      this.resetTurnState();
    },
    toBeLeft({ pileId, pieceId }) {
      if (this.hoveredPiece === null) return false;
      if (this.removedPileId === null) return false;
      if (this.removedPileId === pileId) return false;
      if (pileId !== this.hoveredPiece.pileId) return false;
      if (this.hoveredPiece.pieceId === this.board[pileId] - 1) return false;
      if (pieceId > this.hoveredPiece.pieceId) return false;
      return true;
    },
    currentChoiceDescription(pileId) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[pileId];

      if (!this.shouldPlayerMoveNext) return pieceCountInPile;
      if (pileId === this.removedPileId) {
        if (this.hoveredPiece && this.hoveredPiece.pileId === pileId) {
          return 'Mégse?';
        }
        return `${pieceCountInPile} → 🗑️`;
      }
      if (!this.hoveredPiece) return pieceCountInPile;
      if (this.removedPileId === null && this.hoveredPiece.pileId === pileId) {
        return `${pieceCountInPile} → 🗑️`;
      }
      if (this.hoveredPiece.pileId !== pileId) return pieceCountInPile;

      return `${pieceCountInPile} → ${this.hoveredPiece.pieceId + 1}, ${pieceCountInPile - this.hoveredPiece.pieceId - 1}`;
    },
    resetTurnState() {
      this.hoveredPiece = null;
      this.removedPileId = null;
    }
  },
  created() {
    this.initializeGame();
  }
};
