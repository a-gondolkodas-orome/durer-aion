import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove, inPlacingPhase, pColor, aiColor } from './strategy/strategy';

export default {
  template: require('./tictactoe.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    inPlacingPhase() {
      return inPlacingPhase(this.board);
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField({ row, col }) {
      if (!this.isMoveAllowed({ row, col })) return;

      this.board[row * 3 + col] = this.inPlacingPhase ? pColor : 'white';
      this.endPlayerTurn(getGameStateAfterMove(this.board));
    },
    isMoveAllowed({ row, col }) {
      if (!this.shouldPlayerMoveNext) return false;
      if (this.inPlacingPhase) {
        return this.board[row * 3 + col] === null;
      } else {
        return this.board[row * 3 + col] === aiColor;
      }
    },
    pieceColor({ row, col }) {
      const colorCode = this.board[row * 3 + col];
      if (colorCode === 'red') return 'bg-red-600';
      if (colorCode === 'white') return 'bg-white';
      return 'bg-blue-600';
    }
  },
  created() {
    this.initializeGame();
  }
};
