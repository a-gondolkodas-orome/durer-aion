import Game from '../game/game';
import Overview from '../overview/overview';

export default {
  name: 'app',
  template: require('./app.html'),
  components: {
    Game,
    Overview
  },
  created() {
    document.title = 'Dürer játékok';
  }
};
