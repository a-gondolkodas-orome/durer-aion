#!/bin/bash

# accepts only one parameter, where the parameter is the team files tsv file
# this script is intended to use inside the backend conatiner, to import teams

npx babel-node --extensions '.ts,.js' --presets @babel/preset-env,@babel/preset-typescript -- src/server.ts import $1