# durer-jatekok

Code for the online, client-side versions of past strategy games at the Dürer Math Competition.

The deployed version is here: https://a-gondolkodas-orome.github.io/durer-jatekok/.

# Development

When you push to the main branch, the tests are run, but the project is not deployed.

Currently this project has a Vue.js setup, but you can include games not using Vue.js with small modifications.

## Adding a new game

Currently each game should have a folder under `src/components/games` and its metadata listed in `src/components/games/games.js`. See existing examples for inspiration, and the demonstration game for a minimal example.

You can include work in progress games safely on the main branch as well if you set `isHiddenFromOverview: true` in `games.js`. You can also send a pull request or develop on a branch for a short time.

## Project setup

- install Node.js on your computer globally
- in the project directory terminal run `npm ci`

## IDE setup

If you are using VS Code, [Volar VS Code extension](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) is highly recommended.
Tailwindcss is used for some of the styling, the [tailwind VS Code extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) is also recommended.


## Useful npm commands

### Compiles and hot-reloads for development

```
npm run start-dev
```

### Run tests

```bash
npm run test # audit, lint and tests (as GA)
```

```bash
npm run test:unit # unit tests
```

```bash
npm run test:watch # unit tests in watch mode
```

### Deploy to github pages

```bash
npm run merge-production
```

For further options see `package.json`.

## Further development notes

- it is highly recommended to add unit tests at least for the AI strategy, `jest` is used for unit testing
- Html classes starting with `js-` are there for unit testing purposes.

# Misc.

- simple usage tracking at https://agongolkodasorome.goatcounter.com/ (Ildi has access)
