'use strict';

import KupacKetteoszto from './kupac-ketteoszto';
import { mount } from '@vue/test-utils';
import createStore from '../../../store/store';

const mountKupacKetteoszto = () => {
  const store = createStore();
  store.commit('setGameId', 'KupacKetteoszto');
  const wrapper = mount(KupacKetteoszto, { global: { plugins: [store] } });
  return { store, wrapper };
}

describe('KupacKetteoszto', () => {
  it('should initialize a game when mounted', () => {
    const { store } = mountKupacKetteoszto();
    expect(store.state.board).toMatchObject([expect.toBeInteger(), expect.toBeInteger()]);
  });
});
