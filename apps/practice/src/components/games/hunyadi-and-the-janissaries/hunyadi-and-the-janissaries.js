import { mapGetters, mapActions, mapMutations, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';
import SoldierSvg from './soldier-svg/soldier-svg';

export default {
  template: require('./hunyadi-and-the-janissaries.html'),
  components: { EnemyLoader, SoldierSvg },
  computed: {
    ...mapState({ isPlayerSultan: (state) => state.isPlayerTheFirstToMove }),
    ...mapState(['game', 'board', 'shouldPlayerMoveNext']),
    ...mapGetters([
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
      currentBoard[rowIndex][pieceIndex] = currentBoard[rowIndex][pieceIndex] === 'blue' ? 'red' : 'blue';
      this.setBoard(currentBoard);
    },
    finalizeSoldierGrouping() {
      this.playerMove({ board: this.board, isGameEnd: false });
    },
    killGroup(group) {
      this.playerMove(this.game.strategy.getGameStateAfterKillingGroup(this.board, group));
    }
  },
  created() {
    this.initializeGame();
  }
};
