import { mapGetters, mapMutations, mapState } from 'vuex';
import { gameComponents, gameList } from '../games/games';

export default {
  name: 'app',
  template: require('./app.html'),
  components: gameComponents,
  data: () => ({
    gamesToShow: gameList
  }),
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
  },
  created() {
    document.title = 'Dürer játékok'
  }
}
