import EnemyLoader from '../enemy-loader/enemy-loader';
import { mapState, mapActions } from 'pinia';
import { useGameStore } from '../../../stores/game';

export default {
  name: 'game-sidebar',
  template: require('./game-sidebar.html'),
  components: { EnemyLoader },
  computed: {
    ...mapState(useGameStore, [
      'shouldPlayerMoveNext',
      'ctaText',
      'isGameReadyToStart',
      'gameDefinition'
    ])
  },
  methods: {
    ...mapActions(useGameStore, ['startGameWithRoleSelection', 'resetCurrentGame']),
    restartGame() {
      this.$emit('restart');
      this.resetCurrentGame();
    }
  },
  created() {
    this.resetCurrentGame();
  }
};
