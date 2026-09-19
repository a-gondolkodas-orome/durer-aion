// The `common-frontend/match-moves` entry: the board actions a ClientRepository
// shares, and the types they take. Its own entry because apps/online-frontend
// needs the class as a value in a file its unit test loads unbuilt, and the
// package's barrel pulls in React, MUI and an initialised i18next with it.
export * from './src/client/match-moves';
