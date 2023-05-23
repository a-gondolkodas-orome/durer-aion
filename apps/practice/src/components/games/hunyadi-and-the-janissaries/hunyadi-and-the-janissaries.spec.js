'use strict';

import HunyadiAndTheJanissaries from './hunyadi-and-the-janissaries';
import { flatten } from 'lodash-es';
import { mountComponent } from '../../../../test-helpers';
import { useGameStore } from '../../../stores/game';
import { flushPromises } from '@vue/test-utils';

describe('HunyadiAndTheJanissaries', () => {
  it('should initialize game when mounted', async () => {
    await mountComponent(HunyadiAndTheJanissaries);
    const store = useGameStore();
    expect(flatten(store.board)).toIncludeAllMembers(['blue', 'blue']);
  });

  it('should set selected role for player and start game accordingly', async () => {
    const { wrapper } = await mountComponent(HunyadiAndTheJanissaries);
    const store = useGameStore();

    await wrapper.find('.js-first-player').trigger('click');

    expect(store.isPlayerTheFirstToMove).toBe(true);
    expect(store.shouldPlayerMoveNext).toBe(true);
    expect(store.gameStatus).toEqual('inProgress');
  });

  it('should start a new game when button is pressed', async () => {
    const { wrapper } = await mountComponent(HunyadiAndTheJanissaries);
    const store = useGameStore();
    await wrapper.find('.js-first-player').trigger('click');

    await wrapper.find('.js-restart-game').trigger('click');

    expect(store.gameStatus).toEqual('readyToStart');
  });

  it('should apply player move of killing a group', async () => {
    jest.useFakeTimers();
    const { wrapper } = await mountComponent(HunyadiAndTheJanissaries);
    const store = useGameStore();

    await wrapper.find('.js-second-player').trigger('click');
    jest.advanceTimersToNextTimer();
    // setting fake board after valid enemy move for testability
    store.board = [['blue'], [], ['red', 'red', 'blue']];

    await wrapper.find('.js-kill-red').trigger('click');

    expect(store.board).toEqual([[], ['blue'], []]);
  });

  it('should apply player move of splitting soldiers', async () => {
    const { wrapper } = await mountComponent(HunyadiAndTheJanissaries);
    const store = useGameStore();
    store.board = [['blue', 'blue'], ['blue'], []];
    await wrapper.find('.js-first-player').trigger('click');

    const soldierElements = wrapper.findAll('.js-clickable-soldier');

    soldierElements[0].trigger('click');
    expect(store.board).toEqual([['red', 'blue'], ['blue'], []]);
    expect(store.shouldPlayerMoveNext).toBe(true);

    soldierElements[0].trigger('click');
    soldierElements[1].trigger('click');

    wrapper.find('.js-finalize-groups').trigger('click');

    expect(store.board).toEqual([['blue', 'red'], ['blue'], []]);
    expect(store.shouldPlayerMoveNext).toBe(false);
  });

  it('should not allow player move while enemy move is in progress', async () => {
    const { wrapper } = await mountComponent(HunyadiAndTheJanissaries);
    const store = useGameStore();
    const initialBoard = store.board;
    await wrapper.find('.js-second-player').trigger('click');

    wrapper.find('.js-clickable-soldier').trigger('click');

    expect(store.board).toEqual(initialBoard);
    expect(wrapper.find('.js-finalize-groups').exists()).toBe(false);
  });

  it('should show the result to the user when the game is finished', async () => {
    jest.useFakeTimers();
    const { wrapper } = await mountComponent(HunyadiAndTheJanissaries);
    const store = useGameStore();

    await wrapper.find('.js-second-player').trigger('click');
    jest.advanceTimersToNextTimer();
    // setting fake board after valid enemy move for testability
    store.board = [['blue', 'red'], []];
    await flushPromises();

    await wrapper.find('.js-kill-red').trigger('click');

    expect(wrapper.find('.js-hunyadi-and-the-janissaries').text()).toMatch(/sajnos, most nem/i);
  });
});
