import { mapMutations } from 'vuex';
import { gameList } from '../games/games';

export default {
  template: require('./overview.html'),
  data: () => ({
    gamesToShow: Object.values(gameList).filter((game) => !game.isHiddenFromOverview)
  }),
  methods: {
    ...mapMutations(['setGameDefinition', 'setGameStatus']),
    goToGamePage(gameId) {
      this.$router.push(`/game/${gameId}`);
    }
  },
  mounted() {
    this.setGameDefinition({ gameId: null });
    this.setGameStatus(null);
  }
};
