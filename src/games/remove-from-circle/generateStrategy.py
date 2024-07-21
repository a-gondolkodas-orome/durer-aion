n = 10

def isEnd(l):
  for i in l:
    if l != 0 and l != -1:
      return False
  return True

moves = [list(map(int, list(bin(2**(n-1)+i)[3:]))) for i in range(2**(n-1))]

for i in range(len(moves)):
  if moves[i][0] != 0 and moves[i][1] != 0:
    moves[i][0] = i-2**(n-2)
  elif moves[i][0] != 0:
    moves[i][0] = -1
  if moves[i][-1] != 0 and moves[i][-2] != 0:
    moves[i][-1] = i-1
  elif moves[i][-1] != 0:
    moves[i][-1] = -1
  for j in range(2, n-1):
    if moves[i][-j] != 0 and (moves[i][(2*n-2-j-1)%(n-1)] or moves[i][(2*n-2-j+1)%(n-1)]):
      moves[i][-j] = i-2**(j-1)
    elif moves[i][-j] != 0:
      moves[i][-j] = -1  

winners = [2]*len(moves)
steps = [[] for i in range(len(moves))]

for i in range(len(moves)):
  for j in range(len(moves[i])):
    if moves[i][j] == 0 or moves[i][j] == -1:
      pass
    else:
      if winners[moves[i][j]] == 2:
        winners[i] = 1
        steps[i].append(j)

#%%
d = {bin(i+2**(n-1))[3:]:steps[i] for i in range(len(moves))}
#print(d)

# %%
for key in d.keys():
  if key.count('0') == 2 and key[4]=='0':
    print(key, d[key])