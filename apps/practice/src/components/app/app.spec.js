'use strict';

import App from './app';
import { gameList } from '../games/games';
import { mountComponent } from '../../../test-helpers';
import { flushPromises } from '@vue/test-utils';

describe('App', () => {
  it('should show a list of available games', async () => {
    const { wrapper } = await mountComponent(App);

    expect(wrapper.findAll('tr')).toHaveLength(Object.values(gameList).length + 1);
    expect(wrapper.find('table').text()).toMatch(
      new RegExp(Object.values(gameList).map((game) => game.name).join('.*'))
    );
  });

  it('should open selected game when clicking its start button', async () => {
    const { store, wrapper } = await mountComponent(App);

    wrapper.find('.js-select-HeapSplitter').trigger('click');
    await flushPromises();

    expect(store.state.game.component).toEqual('HeapSplitter');
    expect(wrapper.find('#heap-splitter').exists()).toBe(true);
  });

  it('should navigate back to game list when clicking back button in game view', async () => {
    const { store, wrapper } = await mountComponent(App);

    wrapper.find('.js-select-HeapSplitter').trigger('click');
    await flushPromises();
    wrapper.find('.js-back-to-overview').trigger('click');
    await flushPromises();

    expect(store.state.game).toBe(null);
    expect(wrapper.find('#heap-splitter').exists()).toBe(false);
  });
});
