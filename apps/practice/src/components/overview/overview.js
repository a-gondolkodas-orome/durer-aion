import { gameList } from '../games/games';

export default {
  template: require('./overview.html'),
  data: () => ({
    gamesToShow: Object.values(gameList).filter((game) => !game.isHiddenFromOverview)
  }),
  methods: {
    goToGamePage(gameId) {
      this.$router.push(`/game/${gameId}`);
    }
  }
};
