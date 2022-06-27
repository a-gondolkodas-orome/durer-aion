import Game from '../strategy-game/strategy-game';
import Overview from '../overview/overview';

export default {
  template: require('./app.html'),
  components: {
    Game,
    Overview
  },
  async errorCaptured() {
    window.alert('An unexpected error happened, it is our fault, not yours! Try refreshing the page.');
  }
};
