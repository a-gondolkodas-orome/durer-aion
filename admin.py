import requests
def add_minutes(minutes:int,type:str, user:str, passwd:str, baseurl:str = 'http://localhost:8000'):
  from requests.auth import HTTPBasicAuth

  if type not in ['relay','strategy']:
      raise ValueError(f'Wrong type: {type}, only {['relay','strategy']} alowed')

  # Replace these with your actual credentials and endpoint
  username = user
  password = passwd

  url = baseurl + '/team/admin/all'
  # Make a request with basic authentication
  response = requests.get(url, auth=HTTPBasicAuth(username, password))

  def add_minutes(team):
      if type == 'relay' and team['relayMatch']['status'] == 'IN PROGRESS':
          url = baseurl + f'/game/{ team['relayMatch']['matchID']}/addminutes/{minutes}'
          response = requests.get(url, auth=HTTPBasicAuth(username, password))
          if response.status_code != 200:
            print(f'Error at adding minutes to team {team['teamId']}')
          else:
            print(f'Addded {minutes} min {team['teamId']}')
      elif type == 'strategy' and team['strategyMatch']['status'] == 'IN PROGRESS':
        url = baseurl + f'/game/{ team['strategyMatch']['matchID']}/addminutes/{minutes}'
        response = requests.get(url, auth=HTTPBasicAuth(username, password))
        if response.status_code != 200:
          print(f'Error at adding minutes to team {team['teamId']}')   

  # Check if the request was successful (status code 200)
  if response.status_code == 200:
      # Parse the JSON response
      try:
          json_data = response.json()
          
          #for team in json_data:
          #  add_minutes(team)
          print(json_data[0])
          
      except ValueError:
          print("Failed to parse JSON response")
  else:
      print(f"Request failed with status code {response.status_code}")
      print(response.text)
