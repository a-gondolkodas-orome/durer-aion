import { mapGetters, mapMutations, mapState } from 'vuex';
import { gameComponents } from '../games/games';

export default {
  name: 'game',
  template: require('./game.html'),
  components: gameComponents,
  computed: {
    ...mapState(['gameId']),
    ...mapGetters(['game'])
  },
  methods: {
    ...mapMutations(['setGameId', 'setGameStatus']),
    clearGameData() {
      this.setGameId(null);
      this.setGameStatus(null);
    }
  }
};
