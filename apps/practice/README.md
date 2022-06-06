# durer-jatekok

Code for the online versions of past strategy games at the Dürer Math Competition.

The deployed version is here: https://a-gondolkodas-orome.github.io/durer-jatekok/.

You might wish to embed a game in another webpage, here is an example how to do this: https://sites.google.com/view/durer-jatekok-beagyazas-pelda

# Development

Currently this project has a vue setup, but you can include games not using vue with minimal modifications.
If you are using VS Code, [Volar VS Code extension](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) is highly recommended.
Tailwindcss is used for some of the styling, the [tailwind VS Code extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) is also recommended.

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

`npm run merge-production`

For further options see `package.json`.
