'use strict';

import Overview from './overview';
import { mount } from '@vue/test-utils';
import createStore from '../../store/store';
import { gameList } from '../games/games';

const mountOverview = () => {
  const store = createStore();
  const wrapper = mount(Overview, { global: { plugins: [store] } });
  return { store, wrapper };
};

describe('Overview', () => {
  it('should show a list of available games', () => {
    const { wrapper } = mountOverview();

    expect(wrapper.findAll('tr')).toHaveLength(gameList.length + 1);
    expect(wrapper.find('table').text()).toMatch(
      new RegExp(gameList.map((game) => game.name).join('.*'))
    );
  });

  it('should set selected game when clicking its start button', async () => {
    const { store, wrapper } = mountOverview();

    await wrapper.find('.js-select-HeapSplitter').trigger('click');

    expect(store.state.gameId).toEqual('HeapSplitter');
  });
});
