import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import GameRule from '../../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./pile-splitter.html'),
  components: { GameSidebar, GameRule },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters(['isGameReadyToStart', 'isGameFinished'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    isDisabled({ pileId, pieceId }) {
      return !this.shouldPlayerMoveNext || pieceId === this.board[pileId] - 1;
    },
    clickPiece({ pileId, pieceId }) {
      if (this.isDisabled({ pileId, pieceId })) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, { pileId, pieceId }));
      this.hoveredPiece = null;
    },
    toBeLeft({ pileId, pieceId }) {
      if (this.hoveredPiece === null) return false;
      if (pileId !== this.hoveredPiece.pileId) return false;
      if (this.hoveredPiece.pieceId === this.board[pileId] - 1) return false;
      if (pieceId > this.hoveredPiece.pieceId) return false;
      return true;
    },
    toBeRemoved({ pileId }) {
      if (this.hoveredPiece === null) return false;
      return this.hoveredPiece.pileId !== pileId;
    },
    currentChoiceDescription(pileId) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[pileId];

      if (this.isGameReadyToStart || !this.shouldPlayerMoveNext || !this.hoveredPiece) return pieceCountInPile;
      if (this.hoveredPiece.pileId !== pileId) return `${pieceCountInPile} → 🗑️`;

      return `${pieceCountInPile} → ${this.hoveredPiece.pieceId + 1}, ${pieceCountInPile - this.hoveredPiece.pieceId - 1}`;
    }
  },
  created() {
    this.initializeGame();
  }
};
