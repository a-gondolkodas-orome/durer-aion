import { createApp } from 'vue';
import JatekLista from './components/jatek-lista/jatek-lista';
import { store } from './store';
import '@/assets/css/style.css';

const app = createApp(JatekLista);
app.use(store);

app.mount('#app');