import { createRouter, createWebHistory } from 'vue-router';
import Overview from './components/overview/overview';
import Game from './components/game/game';
import PageNotFound from './components/page-not-found/page-not-found';

const routes = [
  { path: '/', component: Overview },
  { path: '/game/:gameId/', component: Game, props: true },
  { path: '/:path(.*)*', component: PageNotFound }
];

export default () => createRouter({
  history: createWebHistory(),
  routes
});
