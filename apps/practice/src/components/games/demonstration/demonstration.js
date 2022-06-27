import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';

export default {
  template: require('./demonstration.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['shouldPlayerMoveNext']),
    stepDescription() {
      return 'Kattints a "Lépek" gombra, hogy lépj.';
    }
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame']),
    makeMove() {
      this.endPlayerTurn({ board: [], isGameEnd: true });
    }
  },
  created() {
    this.initializeGame();
  }
};
