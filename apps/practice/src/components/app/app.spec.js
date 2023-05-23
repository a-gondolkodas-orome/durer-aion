'use strict';

import App from './app';
import { gameList } from '../games/games';
import { mountComponent } from '../../../test-helpers';
import { flushPromises } from '@vue/test-utils';
import { useGameStore } from '../../stores/game';

describe('App', () => {
  it('should show a list of available games', async () => {
    const { wrapper } = await mountComponent(App);

    const gamesToShow = Object.values(gameList).filter((game) => !game.isHiddenFromOverview);

    expect(wrapper.findAll('.js-game-card')).toHaveLength(gamesToShow.length);
  });

  it('should open selected game when clicking its start button', async () => {
    const { wrapper } = await mountComponent(App);
    const store = useGameStore();

    wrapper.find('.js-select-PileSplitter').trigger('click');
    await flushPromises();

    expect(store.gameDefinition.component).toEqual('PileSplitter');
    expect(wrapper.find('.js-pile-splitter').exists()).toBe(true);
  });

  it('should navigate back to game list when clicking back button in game view', async () => {
    const { wrapper } = await mountComponent(App);
    const store = useGameStore();

    wrapper.find('.js-select-PileSplitter').trigger('click');
    await flushPromises();
    wrapper.find('.js-back-to-overview').trigger('click');
    await flushPromises();

    expect(store.gameDefinition).toBe(null);
    expect(wrapper.find('.js-pile-splitter').exists()).toBe(false);
  });

  it('should show page not found url does not match known patterns', async () => {
    const { wrapper } = await mountComponent(App, { path: '/unknown' });
    expect(wrapper.find('div').text()).toMatch(/a keresett oldal nem található/);
  });
});
