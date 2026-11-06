import { useTranslation } from 'react-i18next';

/** What an empty name field stands for, in the reader's language. */
export const useDefaultPlayerNames = (): [string, string] => {
  const { t } = useTranslation('factory');
  return [t('player.defaultName.first'), t('player.defaultName.second')];
};

/** The names the game's messages actually use: what was typed, or the default. */
export const resolvePlayerNames = (names: string[], defaults: [string, string]): [string, string] => [
  names[0]?.trim() || defaults[0],
  names[1]?.trim() || defaults[1]
];

// Two players reading the same name in "Következik: …" cannot tell whose turn it
// is, so the setup refuses to start such a game. Checked under both seatings
// because a name only takes its seat when its owner presses "I start": leaving
// one field empty while the other says "1st player" is a collision if the empty
// one goes first, and typing it into the first field collides the other way
// round. Rejecting both keeps the rule a property of what was typed rather than
// of which button is about to be pressed.
export const havePlayerNameCollision = (names: string[], defaults: [string, string]): boolean =>
  [[names[0], names[1]], [names[1], names[0]]].some(seating => {
    const [first, second] = resolvePlayerNames(seating, defaults);
    return first.toLowerCase() === second.toLowerCase();
  });
