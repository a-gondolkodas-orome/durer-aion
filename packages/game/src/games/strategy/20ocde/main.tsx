//cspell:ignore törölhetitek
import type { Ctx } from 'boardgame.io';
import type { GameStateMixin } from '../../../common/types';
import { markForPlayer } from './game';
import type { MyGameState } from './game';
import type { TurnState } from './board';

const rules = <p className="text-justify">Adott egy 5×5-ös tábla. A játékosok felváltva lépnek, az első játékos O jeleket, a második pedig X jeleket helyez le a tábla még üres mezőire. Az első játékos minden lépésekor egy O-t helyezhet le, a második viszont minden lépésében két X-et tehet a táblára. A második játékos nyer, ha sikerül egy csak X-ekből álló sort vagy oszlopot létrehoznia. Az első játékos pedig akkor nyer, ha a tábla megtelik X és O jelekkel úgy, hogy a második játékos nem nyert.</p>;

const rulesC = <p className="text-justify">Adott egy 5×5-ös tábla. A játékosok felváltva lépnek, az első játékos X jeleket, a második pedig O jeleket helyez le a tábla még üres mezőire. Az első játékos minden lépésekor két X-et helyezhet le, a második viszont minden lépésében csak egy O-t tehet a táblára. Az első játékos nyer, ha sikerül egy csak X-ekből álló sort vagy oszlopot létrehoznia. A második játékos pedig akkor nyer, ha a tábla megtelik X és O jelekkel úgy, hogy az első játékos nem nyert.</p>;

interface Args { G: MyGameState & GameStateMixin, ctx: Pick<Ctx, 'currentPlayer'>, playerID: string | null, turnState: unknown }

/// The team's next step on its turn: one O, or two X's one at a time.
export function getPlayerStepDescription({ G, ctx, turnState }: Args): string {
  if (markForPlayer(G, ctx.currentPlayer) === 'O') return 'Tegyetek egy kört egy üres mezőre!';
  return (turnState as TurnState | null)?.xsPlaced === 1
    ? 'Válasszátok ki a második X helyét! A kijelölt mezőre kattintva törölhetitek a kijelölést.'
    : 'Jelöljétek ki az első X helyét!';
}

/// The mark the team plays, once the roles are chosen.
export function getSideDescription({ G, playerID }: Pick<Args, 'G' | 'playerID'>): string | null {
  if (G.firstPlayer === null || playerID === null) return null;
  return `Ti ${markForPlayer(G, playerID) === 'O' ? 'körökkel (○)' : 'X-ekkel'} játszotok`;
}

// The role buttons name each side's mark, which the first player's depends on
// by category. The board always starts empty, so the start does not vary.
const shared = { getPlayerStepDescription, getSideDescription };
export const presentationC = { rules: rulesC, roleLabels: ['Kezdünk (2 X)', 'Másodikak leszünk (1 O)'], ...shared } as const;
export const presentationD = { rules, roleLabels: ['Kezdünk (1 O)', 'Másodikak leszünk (2 X)'], ...shared } as const;
export const presentationE = presentationD;
