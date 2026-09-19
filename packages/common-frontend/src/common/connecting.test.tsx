// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// The strings are the point of this component, so it needs i18next initialised
// the way the apps initialise it.
import '../common/i18n';
import { Connecting } from './connecting';

describe("what a team sees while the board has not arrived", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("says the game is loading, in the competition's language", () => {
    render(<Connecting />);

    expect(screen.getByText("Játék vagy feladat betöltése…")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // boardgame.io's client asks the server for the match once, when the socket
  // connects, and nothing makes it ask again — so a team can sit here for the
  // rest of the round while the clock runs. Reloading is what asks again.
  it("tells the team to reload once it has waited too long", () => {
    vi.useFakeTimers();
    render(<Connecting />);

    act(() => { vi.advanceTimersByTime(8000); });

    expect(screen.getByText(/Az oldal újra töltése/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Oldal újra töltése" })).toBeInTheDocument();
  });
});
