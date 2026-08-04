import { strategyGameFactory } from '../../strategy-game-factory';
import { BoardClient } from './board-client';
import { LINE, generateStartBoard, moves } from './gameplay';
import { smartBotStrategy, randomBotStrategy } from './strategy/bot-strategy';

const rule = {
  hu: <>
    Ebben a játékban ketten játszanak, a vonal-, illetve a körjátékos. A vonaljátékos a táblán minden
    lépésében besatírozza egy kis háromszög egyik oldalát, a körjátékos pedig kört tesz egy kis háromszög
    belsejébe. A játékot a vonaljátékos kezdi. A vonaljátékos akkor nyer, ha sikerül egy olyan kis
    háromszöget létrehoznia, aminek mindhárom oldala satírozott, és nincs a belsejében kör. Ha ez a helyzet
    előáll, akkor a játék véget is ér. A körjátékos akkor nyer, ha minden háromszög belsejébe került már
    kör. A tábla egy 6×6-os háromszögrács.
  </>,
  en: <>
    Two players take part: the line player and the circle player. On each turn the line player shades one
    side of a small triangle, while the circle player drops a circle inside a small triangle. The line
    player moves first. The line player wins if they manage to create a small triangle whose three sides
    are all shaded and which has no circle inside it; the game ends the instant this happens. The circle
    player wins once every triangle has a circle inside it. The board is a 6×6 triangular grid.
  </>
};

export const TriangleCircleGame = strategyGameFactory({
  presentation: {
    rule,
    roleLabels: [
      { hu: 'Vonaljátékos leszek', en: "I'll be the line player" },
      { hu: 'Körjátékos leszek', en: "I'll be the circle player" }
    ],
    getPlayerStepDescription: ({ ctx }) => {
      if (ctx.currentPlayer === LINE) {
        return {
          hu: 'Satírozd be egy kis háromszög egyik oldalát: kattints egy élre.',
          en: 'Shade one side of a small triangle: click an edge.'
        };
      }
      return {
        hu: 'Tegyél kört egy üres kis háromszög belsejébe: kattints a háromszögre.',
        en: 'Drop a circle into an empty small triangle: click the triangle.'
      };
    }
  },
  BoardClient,
  gameplay: { moves },
  variants: [
    {
      botStrategy: randomBotStrategy,
      generateStartBoard,
      label: { hu: 'Teszt', en: 'Test' }
    },
    // Smart bot. As the line player it executes a proven forced win (see
    // forced-win.ts and the certificate in forced-win.spec.ts) — the line
    // player wins this board with perfect play. As the circle player no
    // winning strategy exists; it defends as well as possible (two-hot safety
    // filter + bounded search), hence the notAlwaysOptimal marker.
    {
      botStrategy: smartBotStrategy,
      generateStartBoard,
      label: { hu: 'Teljes', en: 'Full' },
      notAlwaysOptimal: true,
      isDefault: true
    }
  ]
});
