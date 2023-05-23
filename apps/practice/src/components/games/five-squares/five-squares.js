import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { getGameStateAfterMove } from './strategy/strategy';
import { useGameStore } from '../../../stores/game';

export default {
  template: require('./five-squares.html'),
  components: { GameSidebar, GameRule },
  data: () => ({
    oneMoveDone: false
  }),
  computed: {
    ...mapState(useGameStore, ['board', 'shouldPlayerMoveNext', 'isPlayerTheFirstToMove'])
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    placePiece(tileIndex) {
      if (!this.shouldPlayerMoveNext) return;

      this.board[tileIndex] += 1;
      if (!this.isPlayerTheFirstToMove && !this.oneMoveDone){
        this.oneMoveDone = true;
      } else {
        this.oneMoveDone = false;
        this.endPlayerTurn(getGameStateAfterMove(this.board));
      }
    }
  },
  created() {
    this.initializeGame('FiveSquares');
  }
};
