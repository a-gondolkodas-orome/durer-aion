import { createApp } from 'vue';
import App from '@/components/app/app';
import createStore from './store/store';
import createRouter from './router';
import '@/assets/css/style.css';

import { createPinia } from 'pinia';

const app = createApp(App);

app.use(createPinia());
app.use(createStore());
app.use(createRouter());

app.mount('#app');
