import { mapGetters } from 'vuex';

export default {
  template: require('./enemy-loader.html'),
  computed: {
    ...mapGetters(['isEnemyMoveInProgress'])
  }
};
