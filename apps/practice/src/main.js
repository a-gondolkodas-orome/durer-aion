import { createApp } from 'vue';
import App from '@/components/app/app';
import { store } from '@/store';
import '@/assets/css/style.css';

const app = createApp(App);
app.use(store);

app.mount('#app');