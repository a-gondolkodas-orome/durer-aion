import { mapGetters, mapActions, mapState } from 'vuex';
import EnemyLoader from '../enemy-loader/enemy-loader';

export default {
  name: 'game-sidebar',
  template: require('./game-sidebar.html'),
  components: { EnemyLoader },
  computed: {
    ...mapState(['shouldPlayerMoveNext']),
    ...mapGetters([
      'ctaText',
      'isGameReadyToStart'
    ])
  },
  methods: {
    ...mapActions(['startGameWithRoleSelection', 'initializeGame']),
    restartGame() {
      this.$emit('restart');
      this.initializeGame();
    }
  },
  created() {
    this.initializeGame();
  }
};
