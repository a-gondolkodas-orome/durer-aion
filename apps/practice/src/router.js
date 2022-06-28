import { createRouter, createWebHashHistory } from 'vue-router';
import Overview from './components/overview/overview';
import StrategyGame from './components/strategy-game/strategy-game';
import PageNotFound from './components/page-not-found/page-not-found';

const routes = [
  { path: '/', component: Overview },
  { path: '/game/:gameId/', component: StrategyGame, props: true },
  { path: '/:path(.*)*', component: PageNotFound }
];

export default () => createRouter({
  history: createWebHashHistory(),
  routes
});
