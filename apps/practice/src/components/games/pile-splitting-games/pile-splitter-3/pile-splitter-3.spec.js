'use strict';

import PileSplitter3 from './pile-splitter-3';
import { cloneDeep } from 'lodash-es';
import { flushPromises } from '@vue/test-utils';
import { mountComponent } from '../../../../../test-helpers';
import { useGameStore } from '../../../../stores/game';

describe('PileSplitter3', () => {
  it('should set selected role for player and start game accordingly', async () => {
    const { wrapper } = await mountComponent(PileSplitter3);
    const store = useGameStore();

    wrapper.find('.js-first-player').trigger('click');

    expect(store.isPlayerTheFirstToMove).toBe(true);
    expect(store.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', async () => {
    const { wrapper } = await mountComponent(PileSplitter3);
    const store = useGameStore();
    wrapper.find('.js-first-player').trigger('click');

    wrapper.find('.js-restart-game').trigger('click');

    expect(store.gameStatus).toEqual('readyToStart');
  });

  it('should apply player move correctly', async () => {
    const { wrapper } = await mountComponent(PileSplitter3);
    const store = useGameStore();
    const initialBoard = cloneDeep(store.board);

    wrapper.find('.js-first-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[0].findAll('.js-pebble')[1].trigger('click');

    expect(store.board).toEqual([
      2,
      initialBoard[0] - 2,
      initialBoard[2]
    ]);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { wrapper } = await mountComponent(PileSplitter3);
    const store = useGameStore();
    const initialBoard = cloneDeep(store.board);

    wrapper.find('.js-second-player').trigger('click');
    await flushPromises();

    wrapper.findAll('.js-pile')[1].findAll('.js-pebble')[1].trigger('click');
    wrapper.findAll('.js-pile')[0].findAll('.js-pebble')[1].trigger('click');

    expect(store.board).toEqual(initialBoard);
  });
});
