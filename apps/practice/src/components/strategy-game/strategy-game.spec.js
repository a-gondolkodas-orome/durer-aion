'use strict';

import StrategyGame from './strategy-game';
import { mountComponent } from '../../../test-helpers';

describe('StrategyGame', () => {
  it('should set game on store based on gameId when mounted', async () => {
    const { store } = await mountComponent(StrategyGame,  { propsData: { gameId: 'PileSplitter' } });
    expect(store.state.gameDefinition.component).toEqual('PileSplitter');
  });

  it('should load page with new game when url changes', async () => {
    const { wrapper, store } = await mountComponent(StrategyGame,  { propsData: { gameId: 'PileSplitter' } });
    await wrapper.setProps({ gameId: 'HunyadiAndTheJanissaries' });
    expect(store.state.gameDefinition.component).toEqual('HunyadiAndTheJanissaries');
  });

  it('should show not found page if gameId is unknown', async () => {
    const { wrapper, store } = await mountComponent(StrategyGame,  { propsData: { gameId: 'UnknownGame' } });
    expect(store.state.gameDefinition).toBe(null);
    expect(wrapper.find('div').text()).toMatch(/a keresett oldal nem található/);
  });
});
