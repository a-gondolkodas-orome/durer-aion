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
  },
  async errorCaptured(error) {
    window.alert('An unexpected error happened, it is our fault, not yours! Try refreshing the page.');
  }
};
