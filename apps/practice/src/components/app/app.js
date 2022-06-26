import Game from '../game/game';
import Overview from '../overview/overview';

export default {
  name: 'app',
  template: require('./app.html'),
  components: {
    Game,
    Overview
  },
  async errorCaptured() {
    window.alert('An unexpected error happened, it is our fault, not yours! Try refreshing the page.');
  }
};
