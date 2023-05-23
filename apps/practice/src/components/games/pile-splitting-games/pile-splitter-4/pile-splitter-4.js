import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import GameRule from '../../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';
import { useGameStore } from '../../../../stores/game';

export default {
  template: require('./pile-splitter-4.html'),
  components: { GameSidebar, GameRule },
  data: () => ({
    removedPileId: null,
    hoveredPiece: null
  }),
  computed: {
    ...mapState(useGameStore, [
      'board',
      'shouldPlayerMoveNext',
      'isGameInProgress',
      'isGameReadyToStart',
      'isGameFinished'
    ])
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    isDisabled({ pileId, pieceId }) {
      if (!this.shouldPlayerMoveNext) return true;
      if (this.removedPileId === null) return false;
      return pileId !== this.removedPileId && pieceId === this.board[pileId] - 1;
    },
    leftBorder(pileId) {
      return (
        (pileId === 1 && this.board[1] > this.board[0]) ||
        (pileId === 3 && this.board[3] > this.board[2])
      );
    },
    rightBorder(pileId) {
      return (
        (pileId === 0 && this.board[1] <= this.board[0]) ||
        (pileId === 2 && this.board[3] <= this.board[2])
      );
    },
    rowColor({ pileId }) {
      if (!this.isGameInProgress) return 'blue';
      if (pileId === this.removedPileId) {
        if (this.hoveredPiece === null) return 'red';
        if (this.hoveredPiece.pileId === pileId) return 'blue';
        return 'red';
      }
      if (this.hoveredPiece === null) return 'blue';
      if (this.removedPileId === null && this.hoveredPiece.pileId === pileId) return 'red';
      return 'blue';
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

      if (this.isGameReadyToStart || !this.shouldPlayerMoveNext) return pieceCountInPile;
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
    this.initializeGame('PileSplitter4');
  }
};
