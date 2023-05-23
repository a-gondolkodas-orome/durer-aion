import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import ChessRookSvg from './chess-rook-svg/chess-rook-svg';
import { getGameStateAfterMove, getAllowedMoves } from './strategy/strategy';
import { some, isEqual } from 'lodash-es';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./chess-rook.html'),
  components: { GameSidebar, ChessRookSvg, GameRule },
  computed: {
    ...mapState(useGameStore, ['board', 'shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    clickField(field) {
      if (!this.isMoveAllowed(field)) return;

      this.endPlayerTurn(getGameStateAfterMove(this.board, field));
    },
    isMoveAllowed(targetField) {
      if (!this.shouldPlayerMoveNext) return false;
      return some(getAllowedMoves(this.board), field => isEqual(field, targetField));
    }
  },
  created() {
    this.initializeGame('ChessRook');
  }
};
