import { gameList } from '../games/games';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { uniq, some } from 'lodash-es';
import { mapActions } from 'pinia';
import { useGameStore } from '../../stores/game';

export default {
  template: require('./overview.html'),
  components: {
    Listbox, ListboxButton, ListboxOptions, ListboxOption
  },
  data: () => ({
    allCategories: ['A', 'B', 'C', 'C+', 'D', 'D+', 'E', 'E+'],
    selectedCategories: [],
    selectedYears: []
  }),
  computed: {
    allGames() {
      return Object.values(gameList).filter((game) => !game.isHiddenFromOverview);
    },
    allYears() {
      return uniq(this.allGames.map(game => game.year)).sort((a, b) => Number(a) - Number(b));
    },
    selectedCategoriesLabel() {
      return this.selectedCategories.sort().join(', ');
    },
    selectedYearsLabel() {
      return this.selectedYears.sort((a, b) => Number(a) - Number(b)).join(', ');
    },
    gamesToShow() {
      return this.allGames.filter((game) =>
      some(game.category, c => this.selectedCategories.includes(c)) || this.selectedCategories.length === 0
      ).filter(game =>
        this.selectedYears.includes(game.year) || this.selectedYears.length === 0
        );
      }
    },
    methods: {
    ...mapActions(useGameStore, ['initializeGame']),
    goToGamePage(gameId) {
      this.$router.push(`/game/${gameId}`);
    }
  },
  mounted() {
    this.initializeGame(null);
  }
};
