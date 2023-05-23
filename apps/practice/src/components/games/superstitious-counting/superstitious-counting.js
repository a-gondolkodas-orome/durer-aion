import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';
import { range } from 'lodash-es';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./superstitious-counting.html'),
  components: { GameSidebar, GameRule },
  computed: {
    ...mapState(useGameStore, ['board', 'shouldPlayerMoveNext']),
    fields() {
      return range(this.board.target + 1);
    }
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    isMoveAllowed(step) {
      if (!this.shouldPlayerMoveNext) return false;
      if(step === this.board.restricted || step <= 0 || step >= 13) {
        return false;
      }
      return true;
    },
    makeStep(step) {
      if (!this.isMoveAllowed(step)) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, step));
    }
  },
  created() {
    this.initializeGame('SuperstitiousCounting');
  }
};
