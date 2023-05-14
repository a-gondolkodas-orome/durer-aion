import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import GameRule from '../../../common/game-rule/game-rule';
import { getGameStateAfterMove, inPlacingPhase, pColor, aiColor } from './strategy/strategy';

export default {
  template: require('./tictactoe.html'),
  components: { GameSidebar, GameRule },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    inPlacingPhase() {
      return inPlacingPhase(this.board);
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField(id) {
      if (!this.isMoveAllowed(id)) return;

      this.board[id] = this.inPlacingPhase ? pColor : 'white';
      this.endPlayerTurn(getGameStateAfterMove(this.board));
    },
    isMoveAllowed(id) {
      if (!this.shouldPlayerMoveNext) return false;
      if (this.inPlacingPhase) {
        return this.board[id] === null;
      } else {
        return this.board[id] === aiColor;
      }
    },
    pieceColor(id) {
      const colorCode = this.board[id];
      if (colorCode === 'red') return 'bg-red-600';
      if (colorCode === 'white') return 'bg-white';
      return 'bg-blue-600';
    }
  },
  created() {
    this.initializeGame();
  }
};
