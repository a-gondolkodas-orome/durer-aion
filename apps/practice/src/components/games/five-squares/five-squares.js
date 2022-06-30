import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./five-squares.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    stepDescription() {
      return 'Kattints arra a mezőre, ahova korongot szeretnél lerakni.';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    placePiece(tileIndex) {
      if (!this.shouldPlayerMoveNext) return;
      this.endPlayerTurn(getGameStateAfterMove(this.board, tileIndex));
    }
  },
  created() {
    this.initializeGame();
  }
};
