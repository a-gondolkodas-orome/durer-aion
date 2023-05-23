import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';
import { useGameStore } from '../../../stores/game';
import { mapActions, mapState } from 'pinia';

export default {
  template: require('./two-times-two.html'),
  components: { GameSidebar, GameRule },
  computed: {
    ...mapState(useGameStore, ['board', 'shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    placePiece(tileIndex) {
      if (!this.shouldPlayerMoveNext) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, tileIndex));
    }
  },
  created() {
    this.initializeGame('TwoTimesTwo');
  }
};
