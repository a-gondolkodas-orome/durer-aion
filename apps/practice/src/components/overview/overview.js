import { gameList } from '../games/games';

export default {
  name: 'overview',
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
