import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./coin123.html'),
  components: { GameSidebar, GameRule },
  data: () => ({
    valueOfRemovedCoin: null,
    hoveredPile: null
  }),
  computed: {
    ...mapState(useGameStore, ['board', 'shouldPlayerMoveNext']),
    wasCoinAlreadyRemovedInTurn() {
      return this.valueOfRemovedCoin !== null;
    },
    stepDescription() {
      return this.wasCoinAlreadyRemovedInTurn
        ? 'Kattints egy mezőre, hogy visszatégy egy olyan pénzérmét'
        : 'Kattints egy mezőre, hogy elvegyél egy olyan pénzérmét';
    }
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    isMoveAllowed(coinValue) {
      if (!this.shouldPlayerMoveNext) return false;
      return !this.isCoinActionInvalid(coinValue);
    },
    clickPile(coinValue) {
      if (!this.isMoveAllowed(coinValue)) return;

      if (!this.wasCoinAlreadyRemovedInTurn) {
        this.valueOfRemovedCoin = coinValue;
        this.board[coinValue] -= 1;
        if (coinValue === 0) this.endTurn();
      } else {
        this.board[coinValue] += 1;
        this.endTurn();
      }
    },
    resetTurnState() {
      this.hoveredPile = null;
      this.valueOfRemovedCoin = null;
    },
    endTurn() {
      this.endPlayerTurn(getGameStateAfterMove(this.board));
      this.resetTurnState();
    },
    getCoinColor(coinValue) {
      if (coinValue === 0) return 'bg-yellow-700';
      if (coinValue === 1) return 'bg-slate-700';
      return 'bg-yellow-400';
    },
    shouldShowCoinToBeRemoved(coinValue) {
      if (!this.shouldPlayerMoveNext) return false;
      if (this.wasCoinAlreadyRemovedInTurn) return false;
      return coinValue === this.hoveredPile && this.board[coinValue] !== 0;
    },
    shouldShowCoinToBeAdded(coinValue) {
      if (!this.wasCoinAlreadyRemovedInTurn) return false;
      return this.valueOfRemovedCoin > coinValue && coinValue === this.hoveredPile;
    },
    isCoinActionInvalid(coinValue) {
      if (this.wasCoinAlreadyRemovedInTurn) {
        return this.valueOfRemovedCoin <= coinValue;
      }
      return this.board[coinValue] === 0;
    }
  },
  created() {
    this.initializeGame('Coin123');
  }
};
