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
    ...mapState(['openedGame']),
    ...mapGetters(['selectedGame'])
  },
  methods: {
    ...mapMutations(['setOpenedGame'])
  },
  created() {
    document.title = 'Dürer játékok'
  }
}
