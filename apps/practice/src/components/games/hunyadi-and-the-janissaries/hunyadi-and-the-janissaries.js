import { mapGetters, mapActions, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';
import SoldierSvg from './soldier-svg/soldier-svg';
import { getGameStateAfterKillingGroup } from './strategy/strategy';

export default {
  template: require('./hunyadi-and-the-janissaries.html'),
  components: { EnemyLoader, SoldierSvg },
  computed: {
    ...mapState({ isPlayerSultan: (state) => state.isPlayerTheFirstToMove }),
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'ctaText',
      'isEnemyMoveInProgress',
      'isGameInProgress',
      'isGameReadyToStart'
    ]),
    stepDescription() {
      if (!this.shouldPlayerMoveNext) return '';
      return this.isPlayerSultan ? 'Kattints a katonákra és válaszd két részre a seregedet.' : '';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'startGameWithRoleSelection', 'initializeGame']),
    toggleGroup(rowIndex, pieceIndex) {
      if (!this.shouldPlayerMoveNext || !this.isPlayerSultan) return;
      this.board[rowIndex][pieceIndex] = this.board[rowIndex][pieceIndex] === 'blue' ? 'red' : 'blue';
    },
    finalizeSoldierGrouping() {
      this.endPlayerTurn({ board: this.board, isGameEnd: false });
    },
    killGroup(group) {
      this.endPlayerTurn(getGameStateAfterKillingGroup(this.board, group));
    }
  },
  created() {
    this.initializeGame();
  }
};
