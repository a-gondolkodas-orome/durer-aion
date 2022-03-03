import { mapGetters, mapActions, mapState } from 'vuex';
import EnemyLoader from '../../common/enemy-loader/enemy-loader';

export default {
  name: 'kupac-ketteoszto',
  template: require('./kupac-ketteoszto.html'),
  components: { EnemyLoader },
  data: () => ({
    hoveredPiece: null
  }),
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    ...mapGetters([
      'game',
      'ctaText',
      'isEnemyMoveInProgress',
      'isGameInProgress',
      'isGameReadyToStart'
    ]),
    stepDescription() {
      return this.isGameInProgress && this.shouldPlayerMoveNext
        ? 'Kattints egy korongra, hogy azzal kettéosztd azt a kupacot. Amelyik korongra kattintasz, az és a tőle jobbra lévők kerülnek az új kupacba.'
        : '';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'startGameAsPlayer', 'initializeGame']),
    clickPiece({ rowIndex, pieceIndex }) {
      this.playerMove(this.game.strategy.getBoardAfterPlayerStep(this.board, { rowIndex, pieceIndex }));
    },
    pieceOpacity({ rowIndex, pieceIndex }) {
      if (!this.shouldPlayerMoveNext) return 0.5;
      if (!this.hoveredPiece) return 1;
      if (this.hoveredPiece.pieceIndex === 1) return 1;
      if (rowIndex !== this.hoveredPiece.rowIndex) return 1;
      return pieceIndex >= this.hoveredPiece.pieceIndex ? 0.5 : 1;
    },
    isClickDisabled(pieceIndex) {
      return !this.shouldPlayerMoveNext || pieceIndex === 1;
    }
  },
  created() {
    this.initializeGame();
  }
}
