import React from 'react';
import { render } from '@testing-library/react';
import { App } from './app';
import { gameList } from '../games/gameList';

describe('App', () => {
  it('should show a list of available games', async () => {
    const { container } = render(<App />);

    expect(container.querySelectorAll('.js-game-card')).toHaveLength(Object.values(gameList).length);
  });
});
