---
description: Draft, create, and link a structured GitHub issue (sub-issue under an epic when possible). Determines type and priority from context.
---

# Draft a structured GitHub issue

The user wants to open a GitHub issue describing a problem they have identified. Follow this workflow.

## Arguments

`$ARGUMENTS` — free-text topic / description from the user. May be empty (then ask).

## Steps

### 1. Understand the topic

If `$ARGUMENTS` is empty or vague, ask the user a single clarifying question to identify what the issue is about. Don't ask for the full body — you'll draft that yourself based on investigation. Just enough context to know what to investigate.

### 2. Investigate the code

Search the repo for files relevant to the topic. Use `grep` / `Bash` / `Read` to find:

- The files that exhibit the problem (with line numbers)
- Adjacent files that may need to change together (callers, tests, types)
- Any existing patterns / conventions used elsewhere for similar concerns

Aim for concrete, citable findings — file paths with line numbers, not vague claims.

### 3. Look for a parent epic

Search open issues for a related epic:

```
gh issue list --search "<topic-keywords>" --state open --json number,title,labels,body --limit 10
```

Also check issues typed as `Epic` if the search returns nothing obvious:

```
gh search issues --repo $(gh repo view --json nameWithOwner -q .nameWithOwner) --state=open is:issue 'type:"Epic"' --limit 20
```

If you find a likely match, confirm with the user before linking ("Should this be a sub-issue of #N <title>?"). If no epic fits, the issue will be top-level — don't invent a parent.

### 4. Read project conventions

Check if these exist; if they do, factor them into your draft and type/priority decisions:

- `CLAUDE.md` (root or `.claude/CLAUDE.md`) — overall project guidance
- `PRIORITIES.md` / `.github/PRIORITIES.md` — priority rubric (if present)
- `CONTRIBUTING.md` — issue conventions if any
- Existing closed issues for body-structure precedent

Don't error out if any are missing — just skip.

### 5. Draft the issue body

Use this structure (omit a section only if truly N/A):

```markdown
[Parent: #N if applicable, otherwise omit]

## Problem

<1–3 sentences: what is wrong, where, and why it matters. Concrete, not vague.>

## Affected files

- [path/to/file.ts](path/to/file.ts) — brief note
- [path/to/file.ts:42](path/to/file.ts#L42) — brief note
<List the actual citations from step 2, with clickable links.>

## Recommended approach

<The proposed solution shape. Code sketch if it clarifies. Brief — this is a starting point for discussion, not a spec.>

## Acceptance criteria

- [ ] Concrete checkbox 1
- [ ] Concrete checkbox 2
- [ ] ...
<Checklist of done-conditions tied to the affected files and recommendation.>
```

Title: short, imperative, no leading "[Bug]" / "[Feature]" prefixes — those are conveyed by issue type, not the title.

Do **not** add a "Prior art" / external citations section by default. Only include one if the user explicitly asks or the recommendation is non-obvious and benefits from external precedent.

### 6. Determine type and priority from context

**Issue type** — pick one of `Task`, `Bug`, `Feature`, `Research`. (`Epic` is for big multi-step initiatives; you usually shouldn't auto-assign it.) Use this rubric:

- **Bug** — existing behavior is wrong / broken
- **Feature** — new user-facing capability or a meaningful enhancement to one
- **Task** — chore, refactor, infrastructure, tooling, docs cleanup
- **Research** — needs investigation before a concrete plan can be written

**Priority** — pick one of `None`, `Low`, `Medium`, `High`. Default heuristic when no priorities file exists:

- **High** — broken in production / blocks users / data risk / time-sensitive (release, freeze, deadline)
- **Medium** — visible friction or regression; not blocking but noticeable
- **Low** — polish, ergonomic, "good to have", invisible to most users
- **None** — speculative / no clear impact yet

If `PRIORITIES.md` or similar exists, use its rubric instead. If CLAUDE.md gives priority guidance, use that.

Show your reasoning briefly when proposing type/priority — one line each, so the user can override.

### 7. Present the draft for review

Show the user:

1. Proposed title
2. Proposed body (rendered as markdown)
3. Parent (if any): `Parent: #N — <title>`
4. Proposed type: `<Type>` (one-line reason)
5. Proposed priority: `<Priority>` (one-line reason)

Ask: "Create as-is, or revise?" Wait for confirmation. Respect any tweaks the user requests before creating.

### 8. Create and link

After confirmation:

1. **Create the issue:**
   ```bash
   gh issue create --title "<TITLE>" --body "$(cat <<'EOF'
   <BODY>
   EOF
   )"
   ```
   Capture the resulting URL — the trailing number is the new issue number.

2. **Set the type:**
   ```bash
   gh api repos/<owner>/<repo>/issues/<new-number> -X PATCH -f type=<Type>
   ```

3. **If linking as sub-issue:** get the new issue's database ID, then POST it to the parent:
   ```bash
   NEW_ID=$(gh api repos/<owner>/<repo>/issues/<new-number> --jq .id)
   gh api repos/<owner>/<repo>/issues/<parent-number>/sub_issues -X POST -F sub_issue_id=$NEW_ID
   ```
   Note: the `sub_issue_id` field must be an integer — use `-F` (capital), not `-f`.

4. **Set priority in the Project (v2) board:** requires the `gh` token to have `project` scope. If `gh project list --owner <owner>` fails with "missing required scopes", tell the user to run `gh auth refresh -s read:project,project` and complete the device-flow authorization, then resume.

   Once authorized:
   ```bash
   # find the project id and priority-field id
   gh project list --owner <owner> --format json
   gh project field-list <project-number> --owner <owner> --format json
   # add issue to project, then set the priority field
   gh project item-add <project-number> --owner <owner> --url <new-issue-url>
   gh project item-edit --id <item-id> --field-id <priority-field-id> --single-select-option-id <option-id> --project-id <project-id>
   ```

   If the project step fails, do not block — finish with the issue/type/sub-issue done, and report which step the user needs to complete manually.

### 9. Report back

Final message format:

- Created **#N** [title](url)
- (If sub-issue) Linked under **#parent** [parent-title](parent-url)
- Type: `<Type>`
- Priority: `<Priority>` (or "skipped — auth refresh needed")

Keep this terse. No celebration emojis. No restatement of the body.

## Permission notes

The following commands require write permissions and may prompt the user:

- `gh issue create` — creates a new issue
- `gh api ... -X PATCH` (for type) — modifies an existing issue
- `gh api ... -X POST .../sub_issues` — links sub-issue to parent
- `gh project item-add` / `gh project item-edit` — modifies project board

Read-only steps (`gh issue list`, `gh issue view`, `gh search`, `gh project list`, `gh project field-list`, file reads, grep) should not prompt under typical permission setups.
