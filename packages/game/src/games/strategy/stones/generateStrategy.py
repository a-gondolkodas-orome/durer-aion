#%%
from dataclasses import dataclass, field
import json

PlayerId = bool
CurrentPlayer: PlayerId = True
OtherPlayer: PlayerId = False

@dataclass(frozen=True, unsafe_hash=True)
class GameState:
    stones_left: int
    stones_right: int
    last_move_from_left_by_player: dict[PlayerId, bool] = field(default_factory=lambda: {
        CurrentPlayer: False,
        OtherPlayer: False
    })

    def __str__(self):
        stones = f"{self.stones_left}-{self.stones_right}"
        last_moves = f"{list(self.last_move_from_left_by_player.values())}"
        return f"{stones}.{last_moves}".lower()

    def next_state(self, from_left: bool):
        assert not self.last_move_from_left_by_player[CurrentPlayer] or not from_left

        next_last_move = self.last_move_from_left_by_player.copy()
        next_last_move[CurrentPlayer] = from_left

        # swap because the player that makes the move will not be the current player
        next_last_move[CurrentPlayer], next_last_move[OtherPlayer] = \
            next_last_move[OtherPlayer], next_last_move[CurrentPlayer]

        next_left = self.stones_left - (1 if from_left else 0)
        next_right = self.stones_right - (0 if from_left else 1)

        return GameState(next_left, next_right, next_last_move)

#%%
state_to_move = {}
def firstWins(state: GameState, depth: int = 0) -> bool:
    left = state.stones_left
    right = state.stones_right
    last_from_left = state.last_move_from_left_by_player[CurrentPlayer]

    if left == 0 and right == 0:
        return False
    if right == 0 and last_from_left:
        return False

    right_wins = None
    left_wins = None
    if right > 0:
        right_wins = not firstWins(state.next_state(from_left=False), depth + 1)

    if left > 0 and (not last_from_left):
        left_wins = not firstWins(state.next_state(from_left=True), depth + 1)

    key = str(state)
    if left_wins and right_wins:
        state_to_move[key] = None # none for random move
    elif left_wins:
        state_to_move[key] = True
    elif right_wins:
        state_to_move[key] = False
    else:
        state_to_move[key] = None # none for random move

    # print(f"{'  ' * depth}firstWins({state}) = {left_wins}, {right_wins}")

    if left_wins or right_wins:
        return True
    else:
        return False
#%%
firstWins(GameState(11, 8))
#%%
upper = 15
for n in range(2, upper):
    for k in range(2, upper):
        state = GameState(n, k)
        if n % 2 == 0 and k % 2 == 0:
            assert not firstWins(state)
        if n % 2 == 0 and k % 2 == 1:
            assert firstWins(state)
        if n % 2 == 1 and k % 2 == 0:
            if n <= k + 1:
                assert firstWins(state)
            else:
                assert not firstWins(state)
        if n % 2 == 1 and k % 2 == 1:
            if n > k:
                assert firstWins(state)
            else:
                assert not firstWins(state)
#%%
start_states = [
    [[11, 8], [9, 9]],
    [[9, 8], [9, 7]],
    [[5, 8], [8, 7]],
    [[5, 7], [6, 7]],
    [[6, 4], [3, 6]],
    [[6, 6], [6, 5]],
]
state_to_move = {}
for n, k in [x for pair in start_states for x in pair]:
    state = GameState(n, k)
    firstWins(state)

move_map_json = json.dumps({str(k): v for k, v in state_to_move.items()}, indent=4)
move_map_json = move_map_json.replace("null", "undefined")
print(move_map_json)
