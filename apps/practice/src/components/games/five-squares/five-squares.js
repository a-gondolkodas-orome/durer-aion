import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./five-squares.html'),
  components: { GameSidebar },
  data: () => ({
    oneMoveDone: false
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext', 'isPlayerTheFirstToMove'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    placePiece(tileIndex) {
      if (!this.shouldPlayerMoveNext) return;
      if (!this.isPlayerTheFirstToMove && !this.oneMoveDone){
        this.oneMoveDone = true;
        this.board[tileIndex] += 1;
      }
      else{
        this.oneMoveDone = false;
        this.endPlayerTurn(getGameStateAfterMove(this.board, tileIndex));
      }
    }
  },
  created() {
    this.initializeGame();
  }
};
