import { mapGetters, mapActions, mapMutations, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';
import { getBoardAfterKillingGroup } from './strategy/strategy';

export default {
  name: 'hunyadi-es-a-janicsarok',
  template: require('./hunyadi-es-a-janicsarok.html'),
  components: { EnemyLoader },
  computed: {
    ...mapState({ isPlayerSultan: 'isPlayerTheFirstToMove' }),
    ...mapGetters([
      'ctaText',
      'isEnemyMoveInProgress',
      'getBoard',
      'shouldPlayerMoveNext',
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
    ...mapActions(['playerMove', 'startGameAsPlayer', 'resetGame']),
    toggleGroup(rowIndex, pieceIndex) {
      if (!this.shouldPlayerMoveNext || !this.isPlayerSultan) return;
      const currentBoard = this.getBoard;
      currentBoard[rowIndex][pieceIndex] = !currentBoard[rowIndex][pieceIndex];
      this.setBoard(currentBoard);
    },
    finalizeSoldierGrouping() {
      this.playerMove({ board: this.getBoard, isGameEnd: false });
    },
    killGroup(groupValue) {
      this.playerMove(getBoardAfterKillingGroup(this.getBoard, groupValue));
    }
  },
  created() {
    this.resetGame();
  }
}
