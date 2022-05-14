'use strict';

import HunyadiAndTheJanissaries from './hunyadi-and-the-janissaries';
import { mount } from '@vue/test-utils';
import createStore from '../../../store/store';
import { flatten } from 'lodash-es';

const mountHunyadiAndTheJanissaries = () => {
  const store = createStore();
  store.commit('setGameId', 'HunyadiAndTheJanissaries');
  const wrapper = mount(HunyadiAndTheJanissaries, { global: { plugins: [store] } });
  return { store, wrapper };
}


describe('HunyadiAndTheJanissaries', () => {
  it('should initialize game when mounted', () => {
    const { store } = mountHunyadiAndTheJanissaries();
    expect(flatten(store.state.board)).toIncludeAllMembers(['blue', 'blue']);
  });

  it('should set selected role for player and start game accordingly', () => {
    const { store, wrapper } = mountHunyadiAndTheJanissaries();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.state.isPlayerTheFirstToMove).toBe(true);
    expect(store.state.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', () => {
    const { store, wrapper } = mountHunyadiAndTheJanissaries();
    wrapper.find('.js-first-player').trigger('click');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.state.gameStatus).toEqual('readyToStart');
  });
});
