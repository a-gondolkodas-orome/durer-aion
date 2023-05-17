import { mapMutations, mapState, mapGetters, mapActions } from 'vuex';
import { gameComponents } from '../games/games';
import PageNotFound from '../page-not-found/page-not-found';
import { Dialog, DialogPanel, DialogDescription, DialogTitle } from '@headlessui/vue';

export default {
  template: require('./strategy-game.html'),
  components: {
    ...gameComponents,
    PageNotFound,
    Dialog,
    DialogPanel,
    DialogDescription,
    DialogTitle
  },
  props: {
    gameId: String
  },
  data: () => ({
    isGameEndDialogOpen: false
  }),
  computed: {
    ...mapState(['gameDefinition', 'isPlayerWinner']),
    ...mapGetters(['isGameFinished']),
    gameEndText() {
      return this.isPlayerWinner
        ? 'Nyertél. Gratulálunk! :)'
        : 'Sajnos, most nem nyertél, de ne add fel.';
    }
  },
  methods: {
    ...mapMutations(['setGameDefinition']),
    ...mapActions(['initializeGame']),
    goBackToOverview() {
      this.$router.push('/');
    },
    setGameBasedOnRoute() {
      this.setGameDefinition({ gameId: this.gameId });
    },
    setIsGameEndDialogOpen(newValue) {
      this.isGameEndDialogOpen = newValue;
    },
    startNewGame() {
      this.isGameEndDialogOpen = false;
      this.initializeGame();
    }
  },
  mounted() {
    this.setGameBasedOnRoute();
  },
  watch: {
    gameId() {
      this.setGameBasedOnRoute();
    },
    isGameFinished(newValue) {
      this.isGameEndDialogOpen = newValue;
    }
  }
};
