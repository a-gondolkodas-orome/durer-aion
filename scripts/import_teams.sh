#!/bin/bash

# accepts only one parameter, where the parameter is the team files tsv file
# this script is intended to use inside the backend conatiner, to import teams

# The argument is a real team list an organiser named by hand, so a space in it
# is ordinary; unquoted, the shell would split it and the importer would open
# the first word. Counted here rather than left to the importer, because the
# quotes that fix the space turn "no argument" into an empty string, which is
# not the missing argument the importer answers with this same line.
if [ "$#" -ne 1 ]; then
  echo "Usage: import_teams.sh <teams.tsv>" >&2
  exit 2
fi

node apps/online-backend/dist/import_teams.js "$1"
