'use strict';

import StrategyGame from './strategy-game';
import { mountComponent } from '../../../test-helpers';
import { useGameStore } from '../../stores/game';

describe('StrategyGame', () => {
  it('should set game on store based on gameId when mounted', async () => {
    await mountComponent(StrategyGame,  { propsData: { gameId: 'PileSplitter' } });
    const gameStore = useGameStore();
    expect(gameStore.gameDefinition.component).toEqual('PileSplitter');
  });

  it('should load page with new game when url changes', async () => {
    const { wrapper } = await mountComponent(StrategyGame,  { propsData: { gameId: 'NonExistent' } });
    await wrapper.setProps({ gameId: 'PileSplitter' });
    const gameStore = useGameStore();
    expect(gameStore.gameDefinition.component).toEqual('PileSplitter');
  });

  it('should show not found page if gameId is unknown', async () => {
    const { wrapper } = await mountComponent(StrategyGame,  { propsData: { gameId: 'UnknownGame' } });
    const gameStore = useGameStore();
    expect(gameStore.gameDefinition).toBe(null);
    expect(wrapper.find('div').text()).toMatch(/a keresett oldal nem található/);
  });
});
