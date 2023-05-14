'use strict';

import PileSplitter from './pile-splitter';
import { flushPromises } from '@vue/test-utils';
import createStore from '../../../../store/store';
import { cloneDeep } from 'lodash-es';
import { mountComponent } from '../../../../../test-helpers';

const mountPileSplitter = async () => {
  const store = createStore();
  store.commit('setGameDefinition', { gameId: 'PileSplitter' });
  return await mountComponent(PileSplitter, { store });
};

describe('PileSplitter', () => {
  it('should initialize a game when mounted', async () => {
    const { store } = await mountPileSplitter();
    expect(store.state.board).toMatchObject([expect.toBeInteger(), expect.toBeInteger()]);
  });

  it('should set selected role for player and start game accordingly', async () => {
    const { store, wrapper } = await mountPileSplitter();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.state.isPlayerTheFirstToMove).toBe(true);
    expect(store.state.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', async () => {
    const { store, wrapper } = await mountPileSplitter();
    wrapper.find('.js-first-player').trigger('click');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.state.gameStatus).toEqual('readyToStart');
  });

  it('should apply player move correctly', async () => {
    const { store, wrapper } = await mountPileSplitter();
    const initialBoard = cloneDeep(store.state.board);
    wrapper.find('.js-first-player').trigger('click');

    await flushPromises();
    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');

    expect(store.state.board).toEqual([2, initialBoard[1] - 2]);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { store, wrapper } = await mountPileSplitter();
    const initialBoard = cloneDeep(store.state.board);
    wrapper.find('.js-second-player').trigger('click');

    await flushPromises();
    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');

    expect(store.state.board).toEqual(initialBoard);
  });

  it('should show the result to the user when the game is finished', async () => {
    const { store, wrapper } = await mountPileSplitter();
    store.commit('setBoard', [2, 1]);

    wrapper.find('.js-first-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[0].findAll('.js-pebble')[0].trigger('click');
    await flushPromises();

    expect(wrapper.find('.js-pile-splitter').text()).toMatch(/gratul/i);
  });
});
