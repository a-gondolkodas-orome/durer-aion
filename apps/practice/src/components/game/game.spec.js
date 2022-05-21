'use strict';

import Game from './game';
import { mount } from '@vue/test-utils';
import createStore from '../../store/store';

describe('Game', () => {
  it('should clear selected game when navigating back to overview page', async () => {
    const store = createStore();
    store.commit('setGameId', 'HeapSplitter');
    expect(store.state.gameId).toBe('HeapSplitter');
    const wrapper = mount(Game, { global: { plugins: [store] } });

    await wrapper.find('.js-back-to-overview').trigger('click');

    expect(store.state.gameId).toBe(null);
  });
});
