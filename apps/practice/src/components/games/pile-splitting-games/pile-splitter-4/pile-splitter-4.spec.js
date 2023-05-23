'use strict';

import PileSplitter4 from './pile-splitter-4';
import { cloneDeep } from 'lodash-es';
import { flushPromises } from '@vue/test-utils';
import { mountComponent } from '../../../../../test-helpers';
import { useGameStore } from '../../../../stores/game';

describe('PileSplitter4', () => {
  it('should apply player move correctly', async () => {
    const { wrapper } = await mountComponent(PileSplitter4);
    const store = useGameStore();
    const initialBoard = cloneDeep(store.board);

    wrapper.find('.js-first-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[2].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[3].findAll('.js-pebble')[1].trigger('click');

    expect(store.board).toEqual([
      initialBoard[0],
      initialBoard[1],
      2,
      initialBoard[3] - 2
    ]);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { wrapper } = await mountComponent(PileSplitter4);
    const store = useGameStore();
    const initialBoard = cloneDeep(store.board);

    wrapper.find('.js-second-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[3].findAll('.js-pebble')[1].trigger('click');

    expect(store.board).toEqual(initialBoard);
  });
});
