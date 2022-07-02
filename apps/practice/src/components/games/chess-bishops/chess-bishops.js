import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import ChessBishopSvg from './chess-bishop-svg/chess-bishop-svg';
import { getGameStateAfterMove, getAllowedMoves } from './strategy/strategy';

export default {
  template: require('./chess-bishops.html'),
  components: { GameSidebar, ChessBishopSvg },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    stepDescription() {
      return 'Kattints egy mezőre, amit nem üt egyik futó sem.';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField({ row, col }) {
      if (!this.shouldPlayerMoveNext) return;

      if (!getAllowedMoves(this.board).map(({ row, col }) => row * 8 + col).includes(row * 8 + col)) return;

      this.endPlayerTurn(getGameStateAfterMove(this.board, { row, col }));
    }
  },
  created() {
    this.initializeGame();
  }
};
