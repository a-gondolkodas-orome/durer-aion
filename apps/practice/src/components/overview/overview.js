import { gameList } from '../games/games';

export default {
  name: 'overview',
  template: require('./overview.html'),
  data: () => ({
    gamesToShow: Object.values(gameList)
  }),
  methods: {
    goToGamePage(gameId) {
      this.$router.push(`/game/${gameId}`);
    }
  }
};
