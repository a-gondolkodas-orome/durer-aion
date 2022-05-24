import { mapGetters, mapActions, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';

export default {
  name: 'demonstration',
  template: require('./demonstration.html'),
  components: { EnemyLoader },
  computed: {
    ...mapState(['game', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'ctaText',
      'isEnemyMoveInProgress',
      'isGameInProgress',
      'isGameReadyToStart',
      'isGameFinished'
    ]),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Kattints a "Lépek" gombra, hogy lépj.'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'startGameAsPlayer', 'initializeGame'])
  },
  created() {
    this.initializeGame();
  }
};
