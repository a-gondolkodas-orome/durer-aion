import { mapActions, mapState } from 'vuex';
import GameSidebar from '../../common/game-sidebar/game-sidebar';

export default {
  template: require('./demonstration.html'),
  components: { GameSidebar },
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
