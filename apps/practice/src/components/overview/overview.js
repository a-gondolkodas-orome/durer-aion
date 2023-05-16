import { mapMutations } from 'vuex';
import { gameList } from '../games/games';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { uniq } from 'lodash-es';

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
        this.selectedCategories.includes(game.category) || this.selectedCategories.length === 0
      ).filter(game =>
        this.selectedYears.includes(game.year) || this.selectedYears.length === 0
      );
    }
  },
  methods: {
    ...mapMutations(['setGameDefinition', 'setGameStatus']),
    goToGamePage(gameId) {
      this.$router.push(`/game/${gameId}`);
    }
  },
  mounted() {
    this.setGameDefinition({ gameId: null });
    this.setGameStatus(null);
  }
};
