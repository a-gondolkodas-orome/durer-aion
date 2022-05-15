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
};


describe('HunyadiAndTheJanissaries', () => {
  it('should initialize game when mounted', () => {
    const { store } = mountHunyadiAndTheJanissaries();
    expect(flatten(store.state.board)).toIncludeAllMembers(['blue', 'blue']);
  });

  it('should set selected role for player and start game accordingly', async () => {
    const { store, wrapper } = mountHunyadiAndTheJanissaries();

    await wrapper.find('.js-first-player').trigger('click');

    expect(store.state.isPlayerTheFirstToMove).toBe(true);
    expect(store.state.shouldPlayerMoveNext).toBe(true);
    expect(store.state.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', async () => {
    const { store, wrapper } = mountHunyadiAndTheJanissaries();
    await wrapper.find('.js-first-player').trigger('click');

    await wrapper.find('.js-restart-game').trigger('click');

    expect(store.state.gameStatus).toEqual('readyToStart');
  });

  it('should apply player move of killing a group', async () => {
    jest.useFakeTimers();
    const { store, wrapper } = mountHunyadiAndTheJanissaries();

    await wrapper.find('.js-second-player').trigger('click');
    jest.advanceTimersToNextTimer();
    // setting fake board after valid enemy move for testability
    store.commit('setBoard', [['blue'], [], ['red', 'red', 'blue']]);

    await wrapper.find('.js-kill-red').trigger('click');

    expect(store.state.board).toEqual([[], ['blue'], []]);
  });

  it('should apply player move of splitting soldiers', async () => {
    const { store, wrapper } = mountHunyadiAndTheJanissaries();
    store.commit('setBoard', [['blue', 'blue'], ['blue'], []]);
    await wrapper.find('.js-first-player').trigger('click');

    const soldierElements = wrapper.findAll('.js-clickable-soldier');

    soldierElements[0].trigger('click');
    expect(store.state.board).toEqual([['red', 'blue'], ['blue'], []]);
    expect(store.state.shouldPlayerMoveNext).toBe(true);

    soldierElements[0].trigger('click');
    soldierElements[1].trigger('click');

    wrapper.find('.js-finalize-groups').trigger('click');

    expect(store.state.board).toEqual([['blue', 'red'], ['blue'], []]);
    expect(store.state.shouldPlayerMoveNext).toBe(false);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { store, wrapper } = mountHunyadiAndTheJanissaries();
    const initialBoard = store.state.board;
    await wrapper.find('.js-second-player').trigger('click');

    wrapper.find('.js-clickable-soldier').trigger('click');

    expect(store.state.board).toEqual(initialBoard);
    expect(wrapper.find('.js-finalize-groups').exists()).toBe(false);
  });

  it('should show the result to the user when the game is finished', async () => {
    jest.useFakeTimers();
    const { store, wrapper } = mountHunyadiAndTheJanissaries();

    await wrapper.find('.js-second-player').trigger('click');
    jest.advanceTimersToNextTimer();
    // setting fake board after valid enemy move for testability
    store.commit('setBoard', [['blue', 'red'], []]);

    await wrapper.find('.js-kill-red').trigger('click');

    expect(wrapper.find('#hunyadi-and-the-janissaries').text()).toMatch(/sajnos, most nem/i);
  });
});
