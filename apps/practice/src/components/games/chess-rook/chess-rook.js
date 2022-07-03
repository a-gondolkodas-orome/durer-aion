import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import ChessRookSvg from './chess-rook-svg/chess-rook-svg';
import { getGameStateAfterMove, getAllowedMoves } from './strategy/strategy';

export default {
  template: require('./chess-rook.html'),
  components: { GameSidebar, ChessRookSvg },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField({ row, col }) {
      if (!this.isAllowedMove({ row, col })) return;

      this.endPlayerTurn(getGameStateAfterMove(this.board, { row, col }));
    },
    isAllowedMove({ row, col }) {
      if (!this.shouldPlayerMoveNext) return false;
      return getAllowedMoves(this.board).map(({ row, col }) => row * 8 + col).includes(row * 8 + col);
    }
  },
  created() {
    this.initializeGame();
  }
};
