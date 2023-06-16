import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';
import { mapActions, mapState } from 'pinia';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./add-reduce-double.html'),
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
      return !this.shouldPlayerMoveNext || pieceId % 2 === 0 || (pieceId>this.board[pileId]-1);
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
      if(pileId === this.hoveredPiece.pileId) return false;
      if(pieceId>this.board[pileId]+(this.hoveredPiece.pieceId+1)/2-1) return false;
      return true;

    },
    currentChoiceDescription(pileId) {
      if (this.isGameFinished) return '';

      const pieceCountInPile = this.board[pileId];

      if (
        this.isGameReadyToStart ||
        !this.shouldPlayerMoveNext ||
        !this.hoveredPiece
      ) return pieceCountInPile;
      if (this.hoveredPiece.pileId !== pileId) return `${pieceCountInPile} → ${pieceCountInPile + (this.hoveredPiece.pieceId+1)/2 }`;

      return `${pieceCountInPile} → ${pieceCountInPile - this.hoveredPiece.pieceId - 1}`;
    }
  },
  created() {
    this.initializeGame('AddReduceDouble');
  }
};
