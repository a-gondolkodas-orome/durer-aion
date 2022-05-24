'use strict';

import Overview from './overview';
import { gameList } from '../games/games';
import { mountComponent } from '../../../test-helpers';

describe('Overview', () => {
  it('should show a list of available games', async () => {
    const { wrapper } = await mountComponent(Overview);

    const gamesToShow = Object.values(gameList).filter((game) => !game.isHiddenFromOverview);

    expect(wrapper.findAll('tr')).toHaveLength(gamesToShow.length + 1);
    expect(wrapper.find('table').text()).toMatch(
      new RegExp(gamesToShow.map((game) => game.name).join('.*'))
    );
  });
});
