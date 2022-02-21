import { startGame, resetGame } from './game';

export default {
  name: 'hunyadi-es-a-janicsarok',
  template: require('./hunyadi-es-a-janicsarok.html'),
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
