#!/usr/bin/env node
// PreToolUse hook on update_pull_request. Requesting a review is the user's call, like the
// commenting and thread resolution settings.json denies outright; a deny rule can only block a
// whole tool, and this one also edits a PR's description and draft state, so the hook refuses
// only the calls that name reviewers. Exit 2 refuses the call and hands stderr to the agent.
import process from 'node:process';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  if (JSON.parse(input).tool_input?.reviewers?.length) {
    process.stderr.write(
      'Requesting reviewers is left to the user. Leave the reviewers out of this call and tell '
      + 'the user in the session whose review the change is waiting on.\n'
    );
    process.exit(2);
  }
});
