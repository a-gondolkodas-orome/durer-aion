import { mapGetters, mapActions, mapMutations, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  name: 'superstitious-counting',
  template: require('./superstitious-counting.html'),
  components: { EnemyLoader },
  data: () => ({ step: 1 }),
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
      return 'Írj be egy számot, majd kattints a "Lépek" gombra.';
    }
  },
  methods: {
    ...mapMutations(['setBoard']),
    ...mapActions(['playerMove', 'startGameAsPlayer', 'initializeGame']),
    attemptStep() {
      if (!this.shouldPlayerMoveNext) return;
      if(this.step === this.board.restricted || this.step <= 0 || this.step >= 13) {
        alert("Ez a lépés nem megengedett");
        return;
      }
      this.playerMove(getGameStateAfterMove(this.board, this.step));
    }
  },
  created() {
    this.initializeGame();
  }
};
