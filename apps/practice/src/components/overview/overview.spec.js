'use strict';

import Overview from './overview';
import { gameList } from '../games/games';
import { mountComponent } from '../../../test-helpers';

describe('Overview', () => {
  it('should show a list of available games', async () => {
    const { wrapper } = await mountComponent(Overview);

    expect(wrapper.findAll('tr')).toHaveLength(Object.values(gameList).length + 1);
    expect(wrapper.find('table').text()).toMatch(
      new RegExp(Object.values(gameList).map((game) => game.name).join('.*'))
    );
  });
});
