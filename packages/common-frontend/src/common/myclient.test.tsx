// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameRelay } from 'game';
import { MyOnlineRelayClient } from './myclient';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

test("an online client shows our loading text, not boardgame.io's, until the server syncs", () => {
  // Nothing listens here, so the client never syncs and stays on its placeholder.
  const Client = MyOnlineRelayClient(GameRelay, () => null, null, 'http://127.0.0.1:1');
  const { unmount } = render(<Client playerID="0" matchID="match"/>);

  expect(screen.getByText('general.loading')).toBeInTheDocument();
  expect(screen.queryByText('connecting...')).not.toBeInTheDocument();
  unmount();
});
