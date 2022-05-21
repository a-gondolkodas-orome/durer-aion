import { mapMutations } from 'vuex';
import { gameList } from '../games/games';

export default {
  name: 'overview',
  template: require('./overview.html'),
  data: () => ({
    gamesToShow: gameList
  }),
  methods: {
    ...mapMutations(['setGameId'])
  }
};
