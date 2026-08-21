import type { I18nString } from 'language';

type Translate = (texts: I18nString) => string;

export const DEFAULT_PLAYER_NAMES: [I18nString, I18nString] = [
  { hu: '1. játékos', en: '1st player' },
  { hu: '2. játékos', en: '2nd player' }
];

/** The names the game's messages actually use: what was typed, or the default. */
export const resolvePlayerNames = (names: string[], t: Translate): [string, string] => [
  names[0]?.trim() || t(DEFAULT_PLAYER_NAMES[0]),
  names[1]?.trim() || t(DEFAULT_PLAYER_NAMES[1])
];

// Two players reading the same name in "Következik: …" cannot tell whose turn it
// is, so the setup refuses to start such a game. Checked under both seatings
// because a name only takes its seat when its owner presses "I start": leaving
// one field empty while the other says "1st player" is a collision if the empty
// one goes first, and typing it into the first field collides the other way
// round. Rejecting both keeps the rule a property of what was typed rather than
// of which button is about to be pressed.
export const havePlayerNameCollision = (names: string[], t: Translate): boolean =>
  [[names[0], names[1]], [names[1], names[0]]].some(seating => {
    const [first, second] = resolvePlayerNames(seating, t);
    return first.toLowerCase() === second.toLowerCase();
  });
