# Copied from https://github.com/a-gondolkodas-orome/durer-aion/blob/5267119f14cd3fe8bf9a44005f37c7026bb0ea64/packages/game/src/games/strategy/19ocd/generateStrategy.py#L1

import json

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

g = { 'moves': {}}

def exploreState(state, n):
    winners = [0]*n
    for move in range(1, n+1):
        if not state[move] or (move % state[0] != 0 and state[0] % move != 0):
            winners[move-1] = -1
            continue
        newstate = state[:]
        newstate[move] = False
        newstate[0] = move
        if generateStateID(newstate) not in g["moves"]:
            exploreState(newstate, n)
        winners[move-1] = g["moves"][generateStateID(newstate)][0]
    
    if winners == [-1]*n:                                                                    # Its an end state
        g["moves"][generateStateID(state)] = [2, []]
    elif 2 not in winners and 3 not in winners and 4 not in winners:                         # All is lost
        g["moves"][generateStateID(state)] = [2, [i+1 for i in range(n) if winners[i] != -1]]
    elif 2 not in winners and 4 not in winners:                                              # Second player has winning strategy, but can lose
        g["moves"][generateStateID(state)] = [4, [i+1 for i in range(n) if winners[i] == 3]]
    else:                                                                                    # Current player has winning strategy
        win = 1 if 1 not in winners and 3 not in winners and 4 not in winners else 3
        g["moves"][generateStateID(state)] = [win, [i+1 for i in range(n) if winners[i] == 2 or winners[i] == 4]]

def generateStrategy(n):
    g["moves"] = {}
    start = [-1]+[True]*n

    exploreState(start, n)
    strategy = {}
    for key in g["moves"]:
        if g["moves"][key][1] != []:
          strategy[key] = g["moves"][key][1]
    return strategy;

overallStrategy = {}
for n in [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]:
    overallStrategy[n] = generateStrategy(n)

with open('./scripts/pre-generate-ai-moves/remove-divisor-multiple.json', 'w') as file:
    file.write(json.dumps(overallStrategy))
