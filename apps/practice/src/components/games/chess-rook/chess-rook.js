import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import ChessRookSvg from './chess-rook-svg/chess-rook-svg';
import { getGameStateAfterMove, getAllowedMoves } from './strategy/strategy';
import { some, isEqual } from 'lodash-es';

export default {
  template: require('./chess-rook.html'),
  components: { GameSidebar, ChessRookSvg },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField(field) {
      if (!this.isAllowedMove(field)) return;

      this.endPlayerTurn(getGameStateAfterMove(this.board, field));
    },
    isAllowedMove(targetField) {
      if (!this.shouldPlayerMoveNext) return false;
      return some(getAllowedMoves(this.board), field => isEqual(field, targetField));
    }
  },
  created() {
    this.initializeGame();
  }
};
