import { mapGetters } from 'vuex';

export default {
  name: 'enemy-loader',
  template: require('./enemy-loader.html'),
  computed: {
    ...mapGetters(['isEnemyMoveInProgress'])
  }
};
