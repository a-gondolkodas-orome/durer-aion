#!/bin/bash

# accepts only one parameter, where the parameter is the team files tsv file
# this script is intended to use inside the backend conatiner, to import teams

node apps/online-backend/dist/src/server.js import $1