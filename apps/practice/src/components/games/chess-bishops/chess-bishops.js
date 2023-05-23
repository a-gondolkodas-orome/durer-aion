import { isEqual, some } from 'lodash-es';
import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import ChessBishopSvg from './chess-bishop-svg/chess-bishop-svg';
import { getGameStateAfterMove, getAllowedMoves, BISHOP, FORBIDDEN } from './strategy/strategy';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./chess-bishops.html'),
  components: { GameSidebar, ChessBishopSvg, GameRule },
  data: () => ({
    hoveredField: null
  }),
  computed: {
    ...mapState(useGameStore, ['board', 'shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    clickField(field) {
      if (!this.isMoveAllowed(field)) return;

      this.endPlayerTurn(getGameStateAfterMove(this.board, field));
    },
    isPotentialNextStep(field) {
      if (!this.isMoveAllowed(field)) return false;
      if (!this.hoveredField) return false;
      return isEqual(this.hoveredField, field);
    },
    isMoveAllowed(targetField) {
      if (!this.shouldPlayerMoveNext) return false;
      return some(getAllowedMoves(this.board), field => isEqual(field, targetField));
    },
    isForbidden({ row, col }) {
      return this.board[row][col] === FORBIDDEN;
    },
    isBishop({ row, col }) {
      return this.board[row][col] === BISHOP;
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
    this.initializeGame('ChessBishops');
  }
};
