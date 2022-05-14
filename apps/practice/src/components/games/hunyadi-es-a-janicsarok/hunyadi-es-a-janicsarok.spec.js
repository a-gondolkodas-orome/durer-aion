'use strict';

import HunyadiEsAJanicsarok from './hunyadi-es-a-janicsarok';
import { mount } from '@vue/test-utils';
import createStore from '../../../store/store';
import { flatten } from 'lodash-es';

const mountHunyadiEsAJanicsarok = () => {
  const store = createStore();
  store.commit('setGameId', 'HunyadiEsAJanicsarok');
  const wrapper = mount(HunyadiEsAJanicsarok, { global: { plugins: [store] } });
  return { store, wrapper };
}


describe('HunyadiEsAJanicsarok', () => {
  it('should initialize game when mounted', () => {
    const { store } = mountHunyadiEsAJanicsarok();
    expect(flatten(store.state.board)).toIncludeAllMembers(['blue', 'blue']);
  });

  it('should set selected role for player and start game accordingly', () => {
    const { store, wrapper } = mountHunyadiEsAJanicsarok();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.state.isPlayerTheFirstToMove).toBe(true);
    expect(store.state.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', () => {
    const { store, wrapper } = mountHunyadiEsAJanicsarok();
    wrapper.find('.js-first-player').trigger('click');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.state.gameStatus).toEqual('readyToStart');
  });
});
