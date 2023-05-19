'use strict';

import PileSplitter4 from './pile-splitter-4';
import createStore from '../../../../store/store';
import { cloneDeep } from 'lodash-es';
import { mountComponentVuex } from '../../../../../test-helpers';
import { flushPromises } from '@vue/test-utils';

const mountPileSplitter4 = async () => {
  const store = createStore();
  store.commit('setGameDefinition', { gameId: 'PileSplitter4' });
  return await mountComponentVuex(PileSplitter4, { store });
};

describe('PileSplitter4', () => {
  it('should apply player move correctly', async () => {
    const { store, wrapper } = await mountPileSplitter4();
    const initialBoard = cloneDeep(store.state.board);

    wrapper.find('.js-first-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[2].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[3].findAll('.js-pebble')[1].trigger('click');

    expect(store.state.board).toEqual([
      initialBoard[0],
      initialBoard[1],
      2,
      initialBoard[3] - 2
    ]);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { store, wrapper } = await mountPileSplitter4();
    const initialBoard = cloneDeep(store.state.board);

    wrapper.find('.js-second-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[3].findAll('.js-pebble')[1].trigger('click');

    expect(store.state.board).toEqual(initialBoard);
  });
});
