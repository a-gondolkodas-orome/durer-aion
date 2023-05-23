'use strict';

import PileSplitter from './pile-splitter';
import { flushPromises } from '@vue/test-utils';
import { cloneDeep } from 'lodash-es';
import { mountComponent } from '../../../../../test-helpers';
import { useGameStore } from '../../../../stores/game';

describe('PileSplitter', () => {
  it('should initialize a game when mounted', async () => {
    await mountComponent(PileSplitter);
    const store = useGameStore();
    expect(store.board).toMatchObject([expect.toBeInteger(), expect.toBeInteger()]);
  });

  it('should set selected role for player and start game accordingly', async () => {
    const { wrapper } = await mountComponent(PileSplitter);
    const store = useGameStore();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.isPlayerTheFirstToMove).toBe(true);
    expect(store.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', async () => {
    const { wrapper } = await mountComponent(PileSplitter);
    const store = useGameStore();

    wrapper.find('.js-first-player').trigger('click');
    expect(store.gameStatus).toEqual('inProgress');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.gameStatus).toEqual('readyToStart');
  });

  it('should apply player move correctly', async () => {
    const { wrapper } = await mountComponent(PileSplitter);
    const store = useGameStore();
    const initialBoard = cloneDeep(store.board);
    wrapper.find('.js-first-player').trigger('click');

    await flushPromises();
    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');

    expect(store.board).toEqual([2, initialBoard[1] - 2]);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { wrapper } = await mountComponent(PileSplitter);
    const store = useGameStore();
    const initialBoard = cloneDeep(store.board);
    wrapper.find('.js-second-player').trigger('click');

    await flushPromises();
    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');

    expect(store.board).toEqual(initialBoard);
  });

  it('should show the result to the user when the game is finished', async () => {
    const { wrapper } = await mountComponent(PileSplitter);
    const store = useGameStore();
    store.board = [2, 1];

    wrapper.find('.js-first-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[0].findAll('.js-pebble')[0].trigger('click');
    await flushPromises();

    expect(wrapper.find('.js-pile-splitter').text()).toMatch(/gratul/i);
  });
});
