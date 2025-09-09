import dotenv from 'dotenv';
// this should be done at the top of server.ts before other imports
// but linter does not like imports after a non-import statement
dotenv.config({ path: '.env.local' });
