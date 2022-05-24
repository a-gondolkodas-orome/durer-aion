import { mapMutations, mapState } from 'vuex';
import { gameComponents, gameList } from '../games/games';
import PageNotFound from '../page-not-found/page-not-found';

export default {
  name: 'game',
  template: require('./game.html'),
  components: {
    ...gameComponents,
    PageNotFound
  },
  props: {
    gameId: String
  },
  computed: {
    ...mapState(['game'])
  },
  methods: {
    ...mapMutations(['setGame', 'setGameStatus']),
    goBackToOverview() {
      this.setGame(null);
      this.setGameStatus(null);
      this.$router.push('/');
    },
    setGameBasedOnRoute() {
      this.setGame(gameList[this.gameId] || null);
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
