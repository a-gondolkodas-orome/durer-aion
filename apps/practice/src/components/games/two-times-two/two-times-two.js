import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import { getGameStateAfterMove } from './strategy/strategy';

export default {
  template: require('./two-times-two.html'),
  components: { GameSidebar },
  computed: {
    ...mapState(['board', 'shouldPlayerMoveNext']),
    stepDescription() {
      return 'Kattints arra a mezőre, ahova korongot szeretnél lerakni.';
    }
  },
  methods: {
    ...mapActions(['playerMove', 'initializeGame']),
    placePiece(tileIndex) {
      if (!this.shouldPlayerMoveNext) return;
      this.playerMove(getGameStateAfterMove(this.board, tileIndex));
    }
  },
  created() {
    this.initializeGame();
  }
};
