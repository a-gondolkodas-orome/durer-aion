n = 7


def generateStateID(state):
    id = 0
    for i in range(1, n+1):
        id += 2**(i-1)*state[i]
    return str(state[0])+"_"+str(id)

# state: (winner, steps)
#               1: Current player will win (regardless of choices)
#               2: Second player will win (regardless of choices)
#               3: Current player have winning strategy
#               4: Second player have winning strategy
moves = {}

start = [-1]+[True]*n

def exploreState(state):
    winners = [0]*n
    for move in range(1, n+1):
        if not state[move] or (move % state[0] != 0 and state[0] % move != 0):
            winners[move-1] = -1
            continue
        newstate = state[:]
        newstate[move] = False
        newstate[0] = move
        if generateStateID(newstate) not in moves:
            exploreState(newstate)
        winners[move-1] = moves[generateStateID(newstate)][0]
    
    if winners == [-1]*n:                                                                    # Its an end state
        moves[generateStateID(state)] = [2, []]
    elif 2 not in winners and 3 not in winners and 4 not in winners:                         # All is lost
        moves[generateStateID(state)] = [2, [i+1 for i in range(n) if winners[i] != -1]]
    elif 2 not in winners and 4 not in winners:                                              # Second player has winning strategy, but can lose
        moves[generateStateID(state)] = [4, [i+1 for i in range(n) if winners[i] == 3]]
    else:                                                                                    # Current player has winning strategy
        win = 1 if 1 not in winners and 3 not in winners and 4 not in winners else 3
        moves[generateStateID(state)] = [win, [i+1 for i in range(n) if winners[i] == 2 or winners[i] == 4]]

exploreState(start)
strategy = {}
for key in moves:
    if moves[key][1] != []:
      strategy[key] = moves[key][1]
print(strategy)