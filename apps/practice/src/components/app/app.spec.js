'use strict';

import App from './app';
import { mount } from '@vue/test-utils';
import createStore from '../../store/store';
import { gameList } from '../games/games';

const mountApp = () => {
  const store = createStore();
  const wrapper = mount(App, { global: { plugins: [store] } });
  return { store, wrapper };
};

describe('App', () => {
  it('should show a list of available games', () => {
    const { wrapper } = mountApp();

    expect(wrapper.findAll('tr')).toHaveLength(gameList.length + 1);
    expect(wrapper.find('table').text()).toMatch(
      new RegExp(gameList.map((game) => game.name).join('.*'))
    );
  });

  it('should open selected game when clicking its start button', async () => {
    const { store, wrapper } = mountApp();

    await wrapper.find('.js-select-HeapSplitter').trigger('click');

    expect(store.state.gameId).toEqual('HeapSplitter');
    expect(wrapper.find('#heap-splitter').exists()).toBe(true);
  });

  it('should navigate back to game list when clicking back button in game view', async () => {
    const { store, wrapper } = mountApp();

    await wrapper.find('.js-select-HeapSplitter').trigger('click');
    await wrapper.find('.js-back-to-overview').trigger('click');

    expect(store.state.gameId).toBe(null);
    expect(wrapper.find('#heap-splitter').exists()).toBe(false);
  });
});
