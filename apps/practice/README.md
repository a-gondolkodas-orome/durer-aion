# durer-jatekok

Code for the online, client-side versions of past strategy games at the Dürer Math Competition.

The deployed version is here: https://a-gondolkodas-orome.github.io/durer-jatekok/.

# Development

Feel free to commit directly to the default branch. If in doubt, send a pull request instead. Prefer rebasing over merge commits.

When you push to the main branch, the tests are run, and if they are successful, the project is deployed to the live website.

## Adding a new game

To keep track of who works on which game, use [this pinned issue](https://github.com/a-gondolkodas-orome/durer-jatekok/issues/1) to track it.

TL;DR;

Currently each game should have a folder under `src/components/games` and its metadata listed in `src/components/games/games.js`. See existing examples for inspiration, and the `demonstration` game for a minimal example.

*For more information, see [HOW-TO-DEVELOP.md](./HOW-TO-DEVELOP.md).*

## Project setup

- install Node.js on your computer globally
- in the project directory terminal run

```bash
npm ci
```

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

For further options see `package.json`.

## IDE setup

If you are using VS Code, [Volar VS Code extension](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) is highly recommended.
Tailwindcss is used for some of the styling, the [tailwind VS Code extension](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) is also recommended.


# Other

- simple usage tracking at https://agondolkodasorome.goatcounter.com/ (Ildi has access)
