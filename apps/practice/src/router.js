import { createRouter, createWebHashHistory } from 'vue-router';
import Overview from './components/overview/overview';
import Game from './components/game/game';

const routes = [
  { path: '/', component: Overview },
  { path: '/game/:gameId/', component: Game, props: true }
];

export default () => createRouter({
  history: createWebHashHistory(),
  routes
});
