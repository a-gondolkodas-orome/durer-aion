import Game from '../strategy-game/strategy-game';
import Overview from '../overview/overview';

export default {
  template: '<router-view></router-view>',
  components: {
    Game,
    Overview
  },
  async errorCaptured() {
    window.alert('An unexpected error happened, it is our fault, not yours! Try refreshing the page.');
  }
};
