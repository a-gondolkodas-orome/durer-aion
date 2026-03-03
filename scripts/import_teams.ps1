
# accepts only one parameter, where the parameter is the team files tsv file
# this script is intended to use inside the backend conatiner, to import teams
param (
    [string]$filePath
)

# Check if the file exists
if (Test-Path $filePath -PathType Leaf) {
    Write-Host "Importing teams from: $filePath"
    npx babel-node --extensions '.ts,.js' --presets @babel/preset-env,@babel/preset-typescript -- src/server.ts import $filePath
} else {
    Write-Host "File not found: $filePath"
}