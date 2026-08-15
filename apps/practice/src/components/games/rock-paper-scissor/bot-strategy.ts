import { sample } from 'lodash';
import type { BotStrategy } from 'strategy-game-factory';
import { beats, type Board, type Moves } from './gameplay';

type Bot = BotStrategy<Board, Moves>

export const smartBotStrategy: Bot = ({ board, ctx }) => {
  const currentPlayer = ctx.currentPlayer!;
  const ownHand = board[currentPlayer];
  // A move takes from the other player's hand, so that hand is the choice.
  const opponentHand = board[1 - currentPlayer];

  // The opening is symmetric, so there is nothing to go on yet.
  if (currentPlayer === 0 && opponentHand.length === 3) {
    return { move: 'removeCard', args: [sample(opponentHand)!] };
  }

  // A card only threatens us while we cannot beat it, so take those away first.
  // This is the whole of the second player's winning strategy, and the first
  // player's best try at one.
  const weCannotBeat = opponentHand.find(card => !ownHand.some(mine => beats(mine, card)));
  if (weCannotBeat) return { move: 'removeCard', args: [weCannotBeat] };

  // A tie goes to the first player, so as the first player a card whose twin we
  // still hold is harmless too; the rest have to go.
  if (currentPlayer === 0) {
    const weCannotTie = opponentHand.find(card => !ownHand.includes(card));
    if (weCannotTie) return { move: 'removeCard', args: [weCannotTie] };
  }

  // Unreachable: player 0 opens, so on any later turn the mover's own hand has
  // lost a card, and a hand missing a card always faces one it can neither beat
  // nor — as the first player — tie.
  throw new Error('no removable card found: the bot should always have a move here');
};
