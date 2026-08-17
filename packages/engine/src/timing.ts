// One beat: long enough to follow what happened, short enough not to stall the
// game. Paces the moves of a bot's multi-phase turn, the pause before the bot
// answers at all, the auto endOfTurnMove, and — through useDeferredMove — the
// second half of a human turn that one click submits whole.
//
// The spread is what keeps it from feeling mechanical: a machine that always
// answers after exactly the same interval reads as a metronome rather than as
// an opponent thinking.
export const stepDelay = () => Math.floor(Math.random() * 500 + 750);
