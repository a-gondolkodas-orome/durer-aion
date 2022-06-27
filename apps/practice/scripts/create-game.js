const fs = require('fs');

const gameName = process.argv[2];

fs.mkdirSync(`./src/components/games/${gameName}`);
fs.mkdirSync(`./src/components/games/${gameName}/strategy`);
fs.copyFileSync(
  './src/components/games/demonstration/demonstration.html',
  `./src/components/games/${gameName}/${gameName}.html`
);
fs.copyFileSync(
  './src/components/games/demonstration/demonstration.js',
  `./src/components/games/${gameName}/${gameName}.js`
);

fs.copyFileSync(
  './src/components/games/demonstration/strategy/strategy.js',
  `./src/components/games/${gameName}/strategy/strategy.js`
);

fs.writeFileSync(
  `./src/components/games/${gameName}/${gameName}.js`,
  fs.readFileSync(`./src/components/games/${gameName}/${gameName}.js`, { encoding: 'utf8' }).replaceAll('demonstration', gameName)
);
