import KupacKetteoszto from '../kupac-ketteoszto/kupac-ketteoszto';
import HunyadiEsAJanicsarok from '../hunyadi-es-a-janicsarok/hunyadi-es-a-janicsarok';
import '@/assets/css/style.css';

export default {
  name: 'jatek-lista',
  template: require('./jatek-lista.html'),
  components: {
    KupacKetteoszto,
    HunyadiEsAJanicsarok
  },
  data: () => ({
    openedGame: null
  })
}
