import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';

export default {
  template: require('./demonstration.html'),
  components: { GameSidebar, GameRule },
  computed: {
    ...mapState(['shouldPlayerMoveNext'])
  },
  methods: {
    ...mapActions(['endPlayerTurn', 'initializeGame'])
  },
  created() {
    this.initializeGame();
  }
};
