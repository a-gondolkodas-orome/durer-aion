import { mapMutations, mapState } from 'vuex';
import { gameComponents, gameList } from '../games/games';

export default {
  name: 'game',
  template: require('./game.html'),
  components: gameComponents,
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
      this.setGame(Object.values(gameList).find((game) => game.component === this.gameId) || null);
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
