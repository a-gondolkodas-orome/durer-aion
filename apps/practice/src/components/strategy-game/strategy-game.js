import { mapMutations, mapState } from 'vuex';
import { gameComponents } from '../games/games';
import PageNotFound from '../page-not-found/page-not-found';

export default {
  template: require('./strategy-game.html'),
  components: {
    ...gameComponents,
    PageNotFound
  },
  props: {
    gameId: String
  },
  computed: {
    ...mapState(['gameDefinition'])
  },
  methods: {
    ...mapMutations(['setGameDefinition', 'setGameStatus']),
    goBackToOverview() {
      this.$router.push('/');
    },
    setGameBasedOnRoute() {
      this.setGameDefinition({ gameId: this.gameId });
    }
  },
  mounted() {
    this.setGameBasedOnRoute();
  },
  watch: {
    gameId() {
      this.setGameBasedOnRoute();
    }
  }
};
