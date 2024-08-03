# %%
# Initializing
n = 7

# %%
# Generate the possible board states 
moves = [list(map(int, list(bin(2**(n-1)+i)[3:]))) for i in range(2**(n-1))]
#print(moves)

# %%
# Replacing
# Replace valid moves with indexes, and invalid moves with -1 in the moves list
for i in range(len(moves)):
  if moves[i][0] != 0 and moves[i][1] != 0:
    moves[i][0] = i-2**(n-2)                    # Valid move removing first circle
  elif moves[i][0] != 0:
    moves[i][0] = -1                            # Invalid move removing first circle
  if moves[i][-1] != 0 and moves[i][-2] != 0:
    moves[i][-1] = i-1                          # Valid move removing the last circle
  elif moves[i][-1] != 0:
    moves[i][-1] = -1                           # Invalid move removing last circle
  for j in range(2, n-1):
    if moves[i][-j] != 0 and (moves[i][(2*n-2-j-1)%(n-1)] or moves[i][(2*n-2-j+1)%(n-1)]):
      moves[i][-j] = i-2**(j-1)                 # Valid move
    elif moves[i][-j] != 0:
      moves[i][-j] = -1                         # Invalid move

# %%
# Determining winners, and recording winning steps
# winners[i] ==
#               1: Current player will win (regardless of choices)
#               2: Second player will win (regardless of choices)
#               3: Current player have winning strategy
#               4: Second player have winning strategy
 
winners = [None]*len(moves)
steps = [[] for i in range(len(moves))]

# Record possible moves with possible winners of the move
for i in range(len(moves)):
  possible_moves = []
  possible_winners = []
  for j in range(len(moves[i])):
    if moves[i][j] == 0 or moves[i][j] == -1:
      pass
    else:
      possible_moves.append(j)
      possible_winners.append(winners[moves[i][j]])

  # Choose good moves
  if possible_moves == []:                                                    # Its an end state
    steps[i] = []
    winners[i] = 2
  elif 2 in possible_winners or 4 in possible_winners:                        # Current player has winning strategy
    steps[i] = [possible_moves[k] for k in range(len(possible_moves)) 
                if possible_winners[k] == 2 or possible_winners[k] == 4]
    winners[i] = 3 if 1 in possible_winners or 3 in possible_winners else 1
  elif 3 in possible_winners:                                                 # Second player has winning strategy, but can lose
    steps[i] = [possible_moves[k] for k in range(len(possible_moves)) if possible_winners[k] == 3]
    winners[i] = 4
  else:                                                                       # All is lost
    steps[i] = possible_moves[:]
    winners[i] = 2

print(steps)
print(winners)