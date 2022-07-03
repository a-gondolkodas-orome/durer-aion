import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./superstitious-counting.html'),
  components: { GameSidebar },
  data: () => ({ step: 1 }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    attemptStep() {
      if (!this.shouldPlayerMoveNext) return;
      if(this.step === this.board.restricted || this.step <= 0 || this.step >= 13) {
        alert("Ez a lépés nem megengedett");
        return;
      }
      this.endPlayerTurn(getGameStateAfterMove(this.board, this.step));
    },
    resetTurnState() {
      this.step = 1;
    }
  },
  created() {
    this.initializeGame();
  }
};
