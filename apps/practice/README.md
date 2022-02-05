# durer-jatekok

Itt fejlesztjük a Dürer Versenyen szerepelt játékok online verzióját.

A játékok legfrissebb verziója elérhető itt: https://a-gondolkodas-orome.github.io/durer-jatekok/.

Egy példa honlap a beágyazás demonstrációjára: https://sites.google.com/view/durer-jatekok-beagyazas-pelda

# Development

Currently this project has a vue setup, but you can include games not using vue with minimal modifications.
If you are using VS Code, https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar is highly recommended.

## Prerequisites:

- install `nvm` (node.js version manager) on your computer globally 
- in the project directory run the project setup commands in the terminal

## Project setup
```
nvm install && nvm use && npm ci
```

## Compiles and hot-reloads for development
```
npm run start-dev
```

## Run your unit tests
```
npm run test:unit
```

## Deploy to github pages

`git pull origin master; git push origin master;git push origin master:production`

For further options see `package.json`.

## Add a new game:

See dummy-example-game.

- create a new folder under components, have an html file containing a single tag on the highest level
- have a javascript file exporting the html as a vue component
- optional: any other javascript file: you can reference other folders
- add the game component to `jatek-lista.js` at three places: import, list in components and add to gameList data. (the hidden property is only needed on the dummy example game, so it does not actually show up)
