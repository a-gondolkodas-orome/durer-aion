'use strict';

import HeapSplitter from './heap-splitter';
import { flushPromises, mount } from '@vue/test-utils';
import createStore from '../../../store/store';
import { cloneDeep } from 'lodash-es';

const mountHeapSplitter = () => {
  const store = createStore();
  store.commit('setGameId', 'HeapSplitter');
  const wrapper = mount(HeapSplitter, { global: { plugins: [store] } });
  return { store, wrapper };
}

describe('HeapSplitter', () => {
  it('should initialize a game when mounted', () => {
    const { store } = mountHeapSplitter();
    expect(store.state.board).toMatchObject([expect.toBeInteger(), expect.toBeInteger()]);
  });

  it('should set selected role for player and start game accordingly', () => {
    const { store, wrapper } = mountHeapSplitter();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.state.isPlayerTheFirstToMove).toBe(true);
    expect(store.state.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', () => {
    const { store, wrapper } = mountHeapSplitter();
    wrapper.find('.js-first-player').trigger('click');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.state.gameStatus).toEqual('readyToStart');
  });

  it('should apply player move correctly', () => {
    const { store, wrapper } = mountHeapSplitter();
    const initialBoard = cloneDeep(store.state.board);
    wrapper.find('.js-first-player').trigger('click');

    wrapper.findAll('.game__pile')[1].findAll('.game__piece')[2].trigger('click');

    expect(store.state.board).toEqual([2, initialBoard[1] - 2]);
  });

  it('should not allow player move while enemy move is in progress', () => {
    const { store, wrapper } = mountHeapSplitter();
    const initialBoard = cloneDeep(store.state.board);
    wrapper.find('.js-second-player').trigger('click');

    wrapper.findAll('.game__pile')[1].findAll('.game__piece')[2].trigger('click');

    expect(store.state.board).toEqual(initialBoard);
  });

  it('should show the result to the user when the game is finished', async () => {
    const { store, wrapper } = mountHeapSplitter();
    store.commit('setBoard', [2, 1]);

    wrapper.find('.js-first-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.game__pile')[0].findAll('.game__piece')[1].trigger('click');
    await flushPromises();

    expect(wrapper.find('#heap-splitter').text()).toMatch(/gratul/i)
  });
});
