import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./tictactoe-doublestart.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext', 'isPlayerTheFirstToMove']),
    ...mapGetters(['isGameInProgress']),
    isDuringFirstMove() {
      return this.board.filter(c => c).length <= 1;
    },
    stepDescription() {
      return this.isDuringFirstMove
        ? 'Helyezz le két korongot (kattints a mezőkre)'
        : 'Helyezz le egy korongot egy üres mezőre kattintással.';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField({ row, col }) {
      if (!this.shouldPlayerMoveNext) return;
      if (this.board[row * 3 + col]) return;

      this.board[row * 3 + col] = this.isPlayerTheFirstToMove ? 'red' : 'blue';
      if (this.isDuringFirstMove) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board));
    },
    pieceColor({ row, col }) {
      const colorCode = this.board[row * 3 + col];
      if (colorCode === 'red') return 'bg-red-600';
      return 'bg-blue-600';
    }
  },
  created() {
    this.initializeGame();
  }
};
