'use strict';

import App from './app';
import { gameList } from '../games/games';
import { mountComponent } from '../../../test-helpers';
import { flushPromises } from '@vue/test-utils';

describe('App', () => {
  it('should show a list of available games', async () => {
    const { wrapper } = await mountComponent(App);

    const gamesToShow = Object.values(gameList).filter((game) => !game.isHiddenFromOverview);

    expect(wrapper.findAll('tr')).toHaveLength(gamesToShow.length + 1);
    expect(wrapper.find('table').text()).toMatch(
      new RegExp(gamesToShow.map((game) => game.name).join('.*'))
    );
  });

  it('should open selected game when clicking its start button', async () => {
    const { store, wrapper } = await mountComponent(App);

    wrapper.find('.js-select-HeapSplitter').trigger('click');
    await flushPromises();

    expect(store.state.gameDefinition.component).toEqual('HeapSplitter');
    expect(wrapper.find('#heap-splitter').exists()).toBe(true);
  });

  it('should navigate back to game list when clicking back button in game view', async () => {
    const { store, wrapper } = await mountComponent(App);

    wrapper.find('.js-select-HeapSplitter').trigger('click');
    await flushPromises();
    wrapper.find('.js-back-to-overview').trigger('click');
    await flushPromises();

    expect(store.state.gameDefinition).toBe(null);
    expect(wrapper.find('#heap-splitter').exists()).toBe(false);
  });

  it('should show page not found url does not match known patterns', async () => {
    const { wrapper } = await mountComponent(App, { path: '/unknown' });
    expect(wrapper.find('div').text()).toMatch(/a keresett oldal nem található/);
  });
});
