import { mapState } from 'pinia';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./enemy-loader.html'),
  computed: {
    ...mapState(useGameStore, ['isEnemyMoveInProgress'])
  }
};
