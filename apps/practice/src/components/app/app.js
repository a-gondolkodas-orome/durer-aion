import { mapState } from 'vuex';
import Game from '../game/game';
import Overview from '../overview/overview';

export default {
  name: 'app',
  template: require('./app.html'),
  components: {
    Game,
    Overview
  },
  computed: {
    ...mapState(['gameId'])
  },
  created() {
    document.title = 'Dürer játékok';
  }
};
