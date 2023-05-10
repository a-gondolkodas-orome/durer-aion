import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove, playerColor } from './strategy/strategy';

export default {
  template: require('./anti-tictactoe.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext', 'isPlayerTheFirstToMove'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField(id) {
      if (!this.shouldPlayerMoveNext) return;
      if (this.board[id]) return;

      this.board[id] = playerColor(this.isPlayerTheFirstToMove);
      this.endPlayerTurn(getGameStateAfterMove(this.board));
    },
    pieceColor(id) {
      const colorCode = this.board[id];
      if (colorCode === 'red') return 'bg-red-600';
      return 'bg-blue-600';
    }
  },
  created() {
    this.initializeGame();
  }
};
