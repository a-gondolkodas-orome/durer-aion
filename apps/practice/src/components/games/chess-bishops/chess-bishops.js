import { isEqual } from 'lodash-es';
import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import ChessBishopSvg from './chess-bishop-svg/chess-bishop-svg';
import { getGameStateAfterMove, getAllowedMoves } from './strategy/strategy';

export default {
  template: require('./chess-bishops.html'),
  components: { GameSidebar, ChessBishopSvg },
  data: () => ({
    hoveredField: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    stepDescription() {
      return 'Kattints egy mezőre, amit nem üt egyik futó sem.';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    clickField({ row, col }) {
      if (!this.isMoveAllowed({ row, col })) return;

      this.endPlayerTurn(getGameStateAfterMove(this.board, { row, col }));
    },
    isPotentialNextStep(field) {
      if (!this.isMoveAllowed(field)) return false;
      if (!this.hoveredField) return false;
      return isEqual(this.hoveredField, field);
    },
    isMoveAllowed({ row, col }) {
      if (!this.shouldPlayerMoveNext) return false;
      return getAllowedMoves(this.board).map(({ row, col }) => row * 8 + col).includes(row * 8 + col);
    },
    wouldBeForbidden({ row, col }) {
      if (!this.shouldPlayerMoveNext) return false;
      if (!this.hoveredField) return false;
      if (!this.isMoveAllowed(this.hoveredField)) return false;
      if (!this.isMoveAllowed({ row, col })) return false;
      if (this.isPotentialNextStep({ row, col })) return false;
      return Math.abs(row - this.hoveredField.row) === Math.abs(col - this.hoveredField.col);
    }
  },
  created() {
    this.initializeGame();
  }
};
