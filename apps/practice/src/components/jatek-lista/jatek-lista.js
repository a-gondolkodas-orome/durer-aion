import KupacKetteoszto from '../kupac-ketteoszto/kupac-ketteoszto';
import HunyadiEsAJanicsarok from '../hunyadi-es-a-janicsarok/hunyadi-es-a-janicsarok';
import DummyExampleGame from '../dummy-example-game/dummy-example-game';

export default {
  name: 'jatek-lista',
  template: require('./jatek-lista.html'),
  components: {
    KupacKetteoszto,
    HunyadiEsAJanicsarok,
    DummyExampleGame
  },
  data: () => ({
    openedGame: null,
    gameList: [
      { year: 6, round: 'döntő', category: 'D', component: 'HunyadiEsAJanicsarok', name: 'Hunyadi és a janicsárok' },
      { year: 8, round: 'döntő', category: 'A', component: 'KupacKetteoszto', name: 'Kupac kettéosztó' },
      { year: 0, round: '-', category: '-', component: 'DummyExampleGame', name: 'pelda jatek', hidden: true }
    ]
  }),
  computed: {
    gamesToShow() {
      return this.gameList.filter(game => !game.hidden)
    },
    selectedGame() {
      return this.gameList.find(game => game.component === this.openedGame)
    }
  },
  created() {
    document.title = 'Dürer játékok'
  }
}
