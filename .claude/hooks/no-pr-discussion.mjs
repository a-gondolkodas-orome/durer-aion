#!/usr/bin/env node
// PreToolUse hook: keeps the agent out of a pull request's discussion — comments, replies,
// resolving threads, reviews and review requests — for whoever sets CLAUDE_NO_PR_DISCUSSION in
// their own environment. settings.json runs it only when that variable is set, so for everyone
// else nothing changes; that is why it is a hook rather than a deny list, which would apply to
// every contributor. Pushing, opening a PR and editing its description stay allowed.
//
// update_pull_request also edits the description and draft state, so only its calls that name
// reviewers are refused. Exit 2 refuses the call and hands stderr to the agent as the reason.
import process from 'node:process';

const BLOCKED_TOOLS = new Set([
  'mcp__github__add_issue_comment',
  'mcp__github__update_issue_comment',
  'mcp__github__add_reply_to_pull_request_comment',
  'mcp__github__resolve_review_thread',
  'mcp__github__unresolve_review_thread',
  'mcp__github__pull_request_review_write',
  'mcp__github__add_comment_to_pending_review',
  'mcp__github__request_copilot_review',
]);
const BLOCKED_GH = /\bgh\s+(?:pr\s+(?:comment|review)|issue\s+comment)\b|\bgh\s+pr\s+edit\b.*--add-reviewer/;

function refusal({ tool_name: tool, tool_input: input = {} }) {
  if (BLOCKED_TOOLS.has(tool)) return `${tool} posts to or changes a PR's discussion`;
  if (tool === 'mcp__github__update_pull_request' && input.reviewers?.length) return 'it requests reviewers';
  if (tool === 'Bash' && BLOCKED_GH.test(input.command ?? '')) return 'this gh command posts to a PR or issue';
  return undefined;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  const reason = refusal(JSON.parse(raw));
  if (reason) {
    process.stderr.write(
      `Refused: ${reason}. This user keeps PR comments, thread resolution and review requests `
      + 'to themselves (CLAUDE_NO_PR_DISCUSSION). Make the change and push it, then tell the user '
      + 'here what you would have posted or whom the change now waits on.\n'
    );
    process.exit(2);
  }
});
