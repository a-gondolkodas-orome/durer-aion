#!/usr/bin/env node
// What every local run needs before it starts: the tree installed, and the
// gitignored env files seeded. Both steps are silent when there is nothing to
// do, so the dev and stack scripts call this rather than repeating the pair.
//
// One process rather than two, and the two scripts stay separately runnable:
// `npm run deps` and `npm run setup` are each still the name of one job.
import { main as ensureDeps } from './ensure-deps.mjs';
import { main as seedEnvFiles } from './seed-env-files.mjs';

// Deps first: seeding reports on files the tree is about to be able to read.
// ensure-deps reports a failed install through process.exitCode rather than by
// throwing, so an install that died has to be checked for, not caught.
ensureDeps();
if (!process.exitCode) seedEnvFiles();
