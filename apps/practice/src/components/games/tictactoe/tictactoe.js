import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove, inPlacingPhase } from './strategy/strategy';

export default {
  template: require('./tictactoe.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters(['isGameInProgress']),
    inPlacingPhase() {
      return inPlacingPhase(this.board);
    },
    stepDescription() {
      return this.inPlacingPhase
        ? 'Kattints egy üres mezőre.'
        : 'Kattints egy piros korongra.';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField({ row, col }) {
      if (!this.isMoveAllowed({ row, col })) return;

      this.board[row * 3 + col] = this.inPlacingPhase ? 'blue' : 'white';
      this.endPlayerTurn(getGameStateAfterMove(this.board));
    },
    isMoveAllowed({ row, col }) {
      if (!this.shouldPlayerMoveNext) return false;
      if (this.inPlacingPhase) {
        return this.board[row * 3 + col] === null;
      } else {
        return this.board[row * 3 + col] === 'red';
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
