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

  it('should set selected role for player and start game accordingly', () => {
    const { store, wrapper } = mountKupacKetteoszto();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.state.isPlayerTheFirstToMove).toBe(true);
    expect(store.state.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', () => {
    const { store, wrapper } = mountKupacKetteoszto();
    wrapper.find('.js-first-player').trigger('click');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.state.gameStatus).toEqual('readyToStart');
  });
});
