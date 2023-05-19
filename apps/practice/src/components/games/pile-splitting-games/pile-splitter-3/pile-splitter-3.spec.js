'use strict';

import PileSplitter3 from './pile-splitter-3';
import createStore from '../../../../store/store';
import { cloneDeep } from 'lodash-es';
import { flushPromises } from '@vue/test-utils';
import { mountComponentVuex } from '../../../../../test-helpers';

const mountPileSplitter3 = async () => {
  const store = createStore();
  store.commit('setGameDefinition', { gameId: 'PileSplitter3' });
  return await mountComponentVuex(PileSplitter3, { store });
};

describe('PileSplitter3', () => {
  it('should set selected role for player and start game accordingly', async () => {
    const { store, wrapper } = await mountPileSplitter3();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.state.isPlayerTheFirstToMove).toBe(true);
    expect(store.state.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', async () => {
    const { store, wrapper } = await mountPileSplitter3();
    wrapper.find('.js-first-player').trigger('click');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.state.gameStatus).toEqual('readyToStart');
  });

  it('should apply player move correctly', async () => {
    const { store, wrapper } = await mountPileSplitter3();
    const initialBoard = cloneDeep(store.state.board);

    wrapper.find('.js-first-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[0].findAll('.js-pebble')[1].trigger('click');

    expect(store.state.board).toEqual([
      2,
      initialBoard[0] - 2,
      initialBoard[2]
    ]);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { store, wrapper } = await mountPileSplitter3();
    const initialBoard = cloneDeep(store.state.board);

    wrapper.find('.js-second-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[0].findAll('.js-pebble')[1].trigger('click');

    expect(store.state.board).toEqual(initialBoard);
  });
});
