import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';

export default {
  name: 'two-times-two',
  template: require('./two-times-two.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['game', 'board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'isGameInProgress'
    ]),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Kattints arra a mezőre, ahova korongot szeretnél lerakni.'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'initializeGame']),
    placePiece(tileIndex) {
      if (!this.shouldPlayerMoveNext) return;
      this.playerMove(this.game.strategy.getGameStateAfterMove(this.board, tileIndex));
    }
  },
  created() {
    this.initializeGame();
  }
};
