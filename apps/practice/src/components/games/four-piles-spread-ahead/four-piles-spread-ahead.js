import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';
import { mapActions, mapState } from 'pinia';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./four-piles-spread-ahead.html'),
  components: { GameSidebar, GameRule },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapState(
      useGameStore,
      ['board', 'isGameFinished', 'isGameReadyToStart', 'shouldPlayerMoveNext']
    )
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    nonExistent({ pileId, pieceId }) {
      if (pieceId<this.board[pileId]) return false;
      return true;
    },
    isDisabled({ pileId, pieceId }) {
      return !this.shouldPlayerMoveNext || pieceId>pileId-1 || (pieceId>this.board[pileId]-1);
    },
    clickPiece({ pileId, pieceId }) {
      if (this.isDisabled({ pileId, pieceId })) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, { pileId, pieceId }));
      this.hoveredPiece = null;
    },
    toBeRemoved({ pileId, pieceId }) {
      if (this.hoveredPiece === null) return false;
      if (pileId !== this.hoveredPiece.pileId) return false;
      if (pieceId >  this.hoveredPiece.pieceId) return false;
      return true;
    },
    toAppear({ pileId, pieceId }) {
      if (this.hoveredPiece === null) return false;
      return (
        (pileId<this.hoveredPiece.pileId) &&
        (pileId>this.hoveredPiece.pileId-this.hoveredPiece.pieceId-2) &&
        (pieceId===this.board[pileId])
      );
    },
    currentChoiceDescription(pileId) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[pileId];

      if (
        this.isGameReadyToStart ||
        !this.shouldPlayerMoveNext ||
        !this.hoveredPiece
      ) return `${pileId+1}. kupac: ${pieceCountInPile} `;
      if (pileId===this.hoveredPiece.pileId) {
        return `${pileId+1}. kupac: ${pieceCountInPile} → ${pieceCountInPile - this.hoveredPiece.pieceId - 1}`;
      }
      if ((pileId<this.hoveredPiece.pileId) && (pileId>this.hoveredPiece.pileId-this.hoveredPiece.pieceId-2)) {
        return `${pileId+1}. kupac: ${pieceCountInPile} → ${pieceCountInPile + 1}`;
      }
      return `${pileId+1}. kupac: ${pieceCountInPile} `;
    }
  },
  created() {
    this.initializeGame('FourPilesSpreadAhead');
  }
};
