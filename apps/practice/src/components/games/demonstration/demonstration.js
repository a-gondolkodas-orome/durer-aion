import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./demonstration.html'),
  components: { GameSidebar, GameRule },
  computed: {
    ...mapState(useGameStore, ['shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame'])
  },
  created() {
    this.initializeGame('Demonstration');
  }
};
