import { mapGetters, mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  name: 'coin123',
  template: require('./coin123.html'),
  components: { GameSidebar },
  data: () => ({
    takenValue: null
  }),
  computed: {
    ...mapState(['game', 'board', 'shouldPlayerMoveNext']),
    ...mapGetters(['isGameInProgress']),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? this.takenValue !== null ? 'Kattints egy mezőre, hogy visszatégy egy olyan pénzérmét' : 'Kattints egy mezőre, hogy elvegyél egy olyan pénzérmét'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'initializeGame']),
    clickPiece(i) {
      if (!this.shouldPlayerMoveNext) return;
      if (this.takenValue === null) {
        if (this.board[i] === 0) return;
        this.takenValue = i;
        this.board[i] -= 1;
        if (i === 0) {
          this.endMove();
        }
        return;
      } else {
        if (i >= this.takenValue) return;
        this.board[i] += 1;

        this.endMove();
      }
    },
    resetMoveState() {
      this.takenValue = null;
    },
    endMove() {
      this.playerMove(getGameStateAfterMove(this.board));
      this.takenValue = null;
    }
  },
  created() {
    this.initializeGame();
  }
};
