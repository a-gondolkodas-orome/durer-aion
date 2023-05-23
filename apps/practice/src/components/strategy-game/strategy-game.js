import { gameComponents } from '../games/games';
import PageNotFound from '../page-not-found/page-not-found';
import { Dialog, DialogPanel, DialogDescription, DialogTitle } from '@headlessui/vue';
import { mapState, mapActions } from 'pinia';
import { useGameStore } from '../../stores/game';

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
    ...mapState(useGameStore, ['gameDefinition', 'isPlayerWinner', 'isGameFinished']),
    gameEndText() {
      return this.isPlayerWinner
        ? 'Nyertél. Gratulálunk! :)'
        : 'Sajnos, most nem nyertél, de ne add fel.';
    }
  },
  methods: {
    ...mapActions(useGameStore, ['initializeGame']),
    goBackToOverview() {
      this.$router.push('/');
    },
    setGameBasedOnRoute() {
      this.initializeGame(this.gameId);
    },
    setIsGameEndDialogOpen(newValue) {
      this.isGameEndDialogOpen = newValue;
    },
    startNewGame() {
      this.isGameEndDialogOpen = false;
      this.initializeGame(this.gameId);
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
