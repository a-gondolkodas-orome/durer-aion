import { startGame, resetGame } from './game';

export default {
  name: 'kupac-ketteoszto',
  template: require('./kupac-ketteoszto.html'),
  methods: {
    startGameAsPlayer(isFirstPlayer) {
      startGame(isFirstPlayer);
    },
    resetGame() {
      resetGame();
    }
  },
  mounted() {
    resetGame();
  }
}
