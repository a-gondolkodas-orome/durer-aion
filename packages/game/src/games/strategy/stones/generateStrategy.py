#%%
from dataclasses import dataclass
import json
from functools import lru_cache

@dataclass(frozen=True, unsafe_hash=True)
class GameState:
    stones_left: int
    stones_right: int
    last_move_from_left_by_player: tuple[bool, bool] = (False, False) 
    current_player: bool = True  # True for Player 1, False for Player 2
    
    def __str__(self):
        return f"{self.stones_left}-{self.stones_right}.{list(self.last_move_from_left_by_player)}.{int(not self.current_player)}"

# 1. 9-10 ´es 9-9
# 2. 9-8 ´es 9-7
# 3. 5-8 ´es 8-7
# 4. 5-7 ´es 6-7
# 5. 6-4 ´es 7-4
# 6. 4-4 ´es 4-3


start_states = [
    (4, 3), (4, 4),
    (6, 4), (7, 4),
    (5, 7), (6, 7),
    (5, 8), (8, 7),
    (9, 7), (9, 8),
    (9, 9), (10, 9)
]

#%%
state_to_move = {}
@lru_cache(None)
def find_winner(state: GameState, depth: int = 0) -> bool:
    left = state.stones_left
    right = state.stones_right
    # pay attention when indexing, p1 is 0 and True == 1
    last_from_left = state.last_move_from_left_by_player[not state.current_player]

    if left == 0 and right == 0:
        return not state.current_player

    if right == 0 and last_from_left:
        return not state.current_player

    canWin = False

    next_last_move = state.last_move_from_left_by_player

    # Try taking from right pile
    if right > 0:
        next_last_move = list(state.last_move_from_left_by_player)
        next_last_move[not state.current_player] = False # pay attention when indexing, p1 is 0 and True == 1
        next_state = GameState(left, right - 1, tuple(next_last_move), not state.current_player)
        if find_winner(next_state, depth + 1) == state.current_player:
            state_to_move[state] = 'takeFromRight'
            canWin = True

    # Try taking from left pile
    if left > 0 and (not last_from_left) and (not canWin):
        next_last_move = list(state.last_move_from_left_by_player)
        next_last_move[not state.current_player] = True # pay attention when indexing, p1 is 0 and True == 1
        next_state = GameState(left - 1, right, tuple(next_last_move), not state.current_player)
        if find_winner(next_state, depth + 1) == state.current_player:
            state_to_move[state] = 'takeFromLeft'
            canWin = True

    if canWin:
        return state.current_player
    else:
        return not state.current_player
#%%
find_winner.cache_clear()
# upper = 150 # CacheInfo(hits=1989444, misses=5688344, maxsize=None, currsize=5688344)
upper = 15
for n in range(2, upper):
    for k in range(2, upper):
        state = GameState(n, k)
        if n % 2 == 0 and k % 2 == 0:
            assert not find_winner(state)
        if n % 2 == 0 and k % 2 == 1:
            assert find_winner(state)
        if n % 2 == 1 and k % 2 == 0:
            if n <= k + 1:
                assert find_winner(state)
            else:
                assert not find_winner(state)
        if n % 2 == 1 and k % 2 == 1:
            if n > k:
                assert find_winner(state)
            else:
                assert not find_winner(state)
print(find_winner.cache_info())
#%%
state_to_move = {}
for n, k in start_states:
    state = GameState(n, k)
    find_winner(state)

#%%
print(json.dumps({str(k): v for k, v in state_to_move.items()}, indent=4))

#%%

find_winner.cache_clear()