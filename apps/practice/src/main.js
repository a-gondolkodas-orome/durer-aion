import { createApp } from 'vue';
import App from '@/components/app/app';
import createStore from './store/store';
import '@/assets/css/style.css';

const app = createApp(App);
app.use(createStore());

app.mount('#app');
