import { mapGetters, mapActions, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';

export default {
  name: 'two-times-two',
  template: require('./two-times-two.html'),
  components: { EnemyLoader },
  computed: {
    ...mapState(['game', 'board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'ctaText',
      'isEnemyMoveInProgress',
      'isGameInProgress',
      'isGameReadyToStart',
      'isGameFinished'
    ]),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Kattints arra a mezőre, ahova korongot szeretnél lerakni.'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'startGameAsPlayer', 'initializeGame']),
    placePiece(tileIndex) {
      if (!this.shouldPlayerMoveNext) return;
      this.playerMove(this.game.strategy.getGameStateAfterMove(this.board, tileIndex));
    }
  },
  created() {
    this.initializeGame();
  }
};
