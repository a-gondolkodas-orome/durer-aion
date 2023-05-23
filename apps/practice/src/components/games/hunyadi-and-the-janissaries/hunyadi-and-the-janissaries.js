import EnemyLoader from '../../common/enemy-loader/enemy-loader';
import GameRule from '../../common/game-rule/game-rule';
import SoldierSvg from './soldier-svg/soldier-svg';
import CastleSvg from './castle-svg/castle-svg';
import { getGameStateAfterKillingGroup } from './strategy/strategy';
import { mapActions, mapState } from 'pinia';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./hunyadi-and-the-janissaries.html'),
  components: { EnemyLoader, SoldierSvg, CastleSvg, GameRule },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapState(useGameStore, { isPlayerSultan: 'isPlayerTheFirstToMove' }),
    ...mapState(useGameStore, [
      'board',
      'shouldPlayerMoveNext',
      'ctaText',
      'isEnemyMoveInProgress',
      'isGameInProgress',
      'isGameReadyToStart'
    ]),
    stepDescription() {
      if (!this.shouldPlayerMoveNext) return '';
      return this.isPlayerSultan
        ? 'Kattints a katonákra és válaszd két részre a seregedet.'
        : 'Kattints egy katonára vagy az alábbi gombok valamelyikére, hogy megsemmisítsd a vele azonos színű sereget.';
    },
    groupOfHoveredPiece() {
      if (!this.hoveredPiece) return null;
      return this.board[this.hoveredPiece.rowIndex][this.hoveredPiece.pieceIndex];
    }
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'startGameWithRoleSelection', 'initializeGame']),
    clickOnSoldier(rowIndex, pieceIndex) {
      if (!this.shouldPlayerMoveNext) return;
      if (this.isPlayerSultan) {
        this.toggleGroup(rowIndex, pieceIndex);
        return;
      } else {
        this.killGroup(this.board[rowIndex][pieceIndex]);
      }
    },
    showToBeKilled(group) {
      if (!this.shouldPlayerMoveNext || this.isPlayerSultan) return false;
      if (!this.hoveredPiece) return false;
      return group === this.groupOfHoveredPiece;
    },
    toggleGroup(rowIndex, pieceIndex) {
      if (!this.shouldPlayerMoveNext || !this.isPlayerSultan) return;
      this.board[rowIndex][pieceIndex] = this.board[rowIndex][pieceIndex] === 'blue' ? 'red' : 'blue';
    },
    finalizeSoldierGrouping() {
      this.endPlayerTurn({ board: this.board, isGameEnd: false });
    },
    killGroup(group) {
      this.endPlayerTurn(getGameStateAfterKillingGroup(this.board, group));
    },
    resetTurnState() {
      this.hoveredPiece = null;
    },
    restartGame() {
      this.resetTurnState();
      this.initializeGame('HunyadiAndTheJanissaries');
    }
  },
  created() {
    this.initializeGame('HunyadiAndTheJanissaries');
  }
};
