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

# The export goes beside the TSV. The prod image runs as `node`, uid 1000, which
# cannot write a bind-mounted directory another uid owns; the importer would
# refuse with a bare EACCES, so say here what to run instead.
if [ ! -w "$(dirname -- "$1")" ] || { [ -e "$1.export" ] && [ ! -w "$1.export" ]; }; then
  echo "import_teams.sh: uid $(id -u) cannot write $1.export." >&2
  echo "Run it as the owner of that directory (DEPLOYMENT.md § 7):" >&2
  echo "  docker compose --env-file=.env.docker exec --user \"\$(id -u):\$(id -g)\" backend ./scripts/import_teams.sh $1" >&2
  exit 1
fi

node apps/online-backend/dist/import_teams.js "$1"
