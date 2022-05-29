import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';

export default {
  name: 'demonstration',
  template: require('./demonstration.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['game', 'shouldPlayerMoveNext']),
    ...mapGetters(['isGameInProgress']),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Kattints a "Lépek" gombra, hogy lépj.'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'initializeGame'])
  },
  created() {
    this.initializeGame();
  }
};
