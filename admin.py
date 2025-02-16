# %%
import requests
from requests.auth import HTTPBasicAuth
import json
from tqdm import tqdm
ADMIN_PASSWORD = "TODO"
BASE_URL = 'http://localhost:8000' # 'https://verseny.durerinfo.hu'
FORCE_DOWNLOAD = False

# %%
def get_request(username:str, password:str, baseurl:str, endpoint:str):
  """
    Make a GET request to the specified endpoint with basic authentication.
    Return the JSON response if the request was successful.
  """
  # Make a request with basic authentication
  url = baseurl + endpoint
  response = requests.get(url, auth=HTTPBasicAuth(username, password))

  # Check if the request was successful (status code 200)
  if response.status_code == 200:
      # Parse the JSON response
      try:
          return response.json()
      except ValueError:
          raise Exception("Failed to parse JSON response")
  else:
      print(response.text)
      raise Exception(f"Request failed with status code {response.status_code}")

team_states = get_request('admin', ADMIN_PASSWORD, BASE_URL, '/team/admin/all')
team_states_dict = {}
for team in team_states:
    team_states_dict[team['joinCode']] = team

# %%
def get_matchdatas(team_states, match_type:str, match_data_type:str, force_download:bool = False):
  if match_type not in ['relay','strategy']:
      raise ValueError(f'Wrong match_type: {match_type}, only {['relay','strategy']} alowed')
  if match_data_type not in ['state','logs']:
      raise ValueError(f'Wrong match_data_type: {match_data_type}, only {['state','logs']} alowed')
  file_name = f'matchdatas_{match_type}_{match_data_type}.json'
  if not force_download:
    try:
      with open(file_name, 'r') as f:
        return json.load(f)
    except FileNotFoundError:
      pass
  match_datas = {}
  match_type_id = 'relayMatch' if match_type == 'relay' else 'strategyMatch'
  for team_state in tqdm(team_states, f"Downloading {match_type} {match_data_type}"):
    if team_state[match_type_id]["state"] != "NOT STARTED":
      matchID = team_state[match_type_id]["matchID"]
      match_datas[team_state["joinCode"]] = get_request('admin', ADMIN_PASSWORD, BASE_URL, f'/game/admin/{matchID}/{match_data_type}')
  with open(file_name, 'w') as f:
    json.dump(match_datas, f)
  return match_datas

# %%
relay_states = get_matchdatas(team_states, 'relay', 'state')
strategy_states = get_matchdatas(team_states, 'strategy', 'state')
relay_logs = get_matchdatas(team_states, 'relay', 'logs')
strategy_logs = get_matchdatas(team_states, 'strategy', 'logs')

# %%
def export_results_tsv(team_states_dict, relay_states, strategy_states):
  # Init: if a game is not started, a "-" will be written
  login_codes = set(relay_states.keys()).union(set(strategy_states.keys()))
  results = {code:{"strategy":"-", "relay": "-", "relay_detailed": []} for code in login_codes}

  # Sanity check
  for code in login_codes:
    if code in relay_states:
      team_state_points = 0
      if "score" in team_states_dict[code]["relayMatch"]:
        team_state_points = team_states_dict[code]["relayMatch"]["score"]
      if relay_states[code]["G"]["points"] != team_state_points:
        print(f"ERROR relay {code}: teamsstates says {team_state_points}, while gamestate {relay_states[code]['G']['points']}")
    if code in strategy_states:
      team_state_points = 0
      if "score" in team_states_dict[code]["strategyMatch"]:
        team_state_points = team_states_dict[code]["strategyMatch"]["score"]
      if strategy_states[code]["G"]["points"] != team_state_points:
        print(f"ERROR strategy {code}: teamsstates says {team_state_points}, while gamestate {relay_states[code]['G']['points']}")

  # Get results
  for code in login_codes:
    if code in relay_states:
      results[code]["relay"] = relay_states[code]["G"]["points"]
      results[code]["relay_detailed"] = relay_states[code]["G"]["previousPoints"]
    if code in strategy_states:
      results[code]["strategy"] = strategy_states[code]["G"]["points"]

  # Export
  with open('durer-results-2024.tsv', 'w') as f:
    f.write("login\tstrategy\trelay\trelay_detailed\n")
    for code in results.keys():
      f.write("{}\t{}\t{}\t{}\n".format(
        code,
        results[code]["strategy"],
        results[code]["relay"],
        '\t'.join(map(str,results[code]["relay_detailed"]))
      ))
export_results_tsv(team_states_dict, relay_states, strategy_states)

# %%
# def add_minutes(minutes:int,type:str, user:str, passwd:str, baseurl:str = 'http://localhost:8000'):

#   if type not in ['relay','strategy']:
#       raise ValueError(f'Wrong type: {type}, only {['relay','strategy']} alowed')

#   # Replace these with your actual credentials and endpoint
#   username = user
#   password = passwd

#   url = baseurl + '/team/admin/all'
#   # Make a request with basic authentication
#   response = requests.get(url, auth=HTTPBasicAuth(username, password))

#   def add_minutes_team(team):
#       if type == 'relay' and team['relayMatch']['state'] == 'IN PROGRESS':
#           url = baseurl + f'/game/admin/{ team['relayMatch']['matchID']}/addminutes/{minutes}'
#           response = requests.get(url, auth=HTTPBasicAuth(username, password))
#           if response.status_code != 200:
#             print(response)
#             print(f'Error at adding minutes to team {team['teamId']}')
#           else:
#             print(f'Addded {minutes} min to team {team['teamId']}')
#       elif type == 'strategy' and team['strategyMatch']['state'] == 'IN PROGRESS':
#         url = baseurl + f'/game/{ team['strategyMatch']['matchID']}/addminutes/{minutes}'
#         response = requests.get(url, auth=HTTPBasicAuth(username, password))
#         if response.status_code != 200:
#           print(response)
#           print(f'Error at adding minutes to team {team['teamId']}')   

#   # Check if the request was successful (status code 200)
#   if response.status_code == 200:
#       # Parse the JSON response
#       try:
#           json_data = response.json()
          
#           for team in json_data:
#             add_minutes_team(team)
          
#       except ValueError:
#           print("Failed to parse JSON response")
#   else:
#       print(f"Request failed with status code {response.status_code}")
#       print(response.text)

# def add_minutes_relay(minutes:int,passwd:str,baseurl:str = 'https://verseny.durerinfo.hu'):
#    add_minutes(minutes,'relay','admin',passwd,baseurl)

# def add_minutes_strategy(minutes:int,passwd:str,baseurl:str = 'https://verseny.durerinfo.hu'):
#    add_minutes(minutes,'strategy','admin',passwd,baseurl)
