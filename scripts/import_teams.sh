#!/bin/bash

# Takes the competition's id and the team list's TSV, and imports every team of
# the file into that competition. Intended for use inside the backend container.

# The file is a real team list an organiser named by hand, so a space in it
# is ordinary; unquoted, the shell would split it and the importer would open
# the first word. Counted here rather than left to the importer, because the
# quotes that fix the space turn "no argument" into an empty string, which is
# not the missing argument the importer answers with this same line.
if [ "$#" -ne 2 ]; then
  echo "Usage: import_teams.sh <competition id> <teams.tsv>" >&2
  exit 2
fi

node apps/online-backend/dist/import_teams.js "$1" "$2"
