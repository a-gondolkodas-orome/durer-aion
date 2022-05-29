import { mapGetters, mapActions } from 'vuex';
import EnemyLoader from '../enemy-loader/enemy-loader';

export default {
  name: 'game-sidebar',
  template: require('./game-sidebar.html'),
  props: { stepDescription: String },
  components: { EnemyLoader },
  computed: {
    ...mapGetters([
      'isEnemyMoveInProgress',
      'ctaText',
      'isGameReadyToStart'
    ])
  },
  methods: {
    ...mapActions(['startGameAsPlayer', 'initializeGame'])
  },
  created() {
    this.initializeGame();
  }
};
