import { mapGetters, mapActions, mapMutations, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';

export default {
  name: 'hunyadi-es-a-janicsarok',
  template: require('./hunyadi-es-a-janicsarok.html'),
  components: { EnemyLoader },
  computed: {
    ...mapState({ isPlayerSultan: (state) => state.isPlayerTheFirstToMove }),
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'game',
      'ctaText',
      'isEnemyMoveInProgress',
      'isGameInProgress',
      'isGameReadyToStart'
    ]),
    stepDescription() {
      if (!this.isGameInProgress || !this.shouldPlayerMoveNext) return '';
      return this.isPlayerSultan ? 'Kattints a katonákra és válaszd két részre a seregedet.' : '';
    }
  },
  methods: {
    ...mapMutations(['setBoard']),
    ...mapActions(['playerMove', 'startGameAsPlayer', 'initializeGame']),
    toggleGroup(rowIndex, pieceIndex) {
      if (!this.shouldPlayerMoveNext || !this.isPlayerSultan) return;
      const currentBoard = this.board;
      currentBoard[rowIndex][pieceIndex] = !currentBoard[rowIndex][pieceIndex];
      this.setBoard(currentBoard);
    },
    finalizeSoldierGrouping() {
      this.playerMove({ board: this.board, isGameEnd: false });
    },
    killGroup(group) {
      this.playerMove(this.game.strategy.getBoardAfterKillingGroup(this.board, group));
    }
  },
  created() {
    this.initializeGame();
  }
}
