'use strict';

import Overview from './overview';
import { gameList } from '../games/games';
import { mountComponent } from '../../../test-helpers';

describe('Overview', () => {
  it('should show a list of available games', async () => {
    const { wrapper } = await mountComponent(Overview);

    const gamesToShow = Object.values(gameList).filter((game) => !game.isHiddenFromOverview);

    expect(wrapper.findAll('.js-game-card')).toHaveLength(gamesToShow.length);
  });
});
