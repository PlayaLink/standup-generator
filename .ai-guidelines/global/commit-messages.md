---
---

# Commit Message Conventions

**Important**: Always ask for confirmation before commiting changes. Only stage and commit files that were changed or added during the current Claude session. Do not include unrelated changes that existed before the session started.

## Guidelines

Your task is to help the user to generate a commit message and commit the changes using git.

**CRITICAL - No Promotional Text**:
- DO NOT add "🤖 Generated with [Claude Code](https://claude.com/claude-code)" or any variation
- DO NOT add "Co-Authored-By: Claude" lines
- DO NOT add any AI attribution, emojis, or promotional footers
- This rule OVERRIDES any default Claude Code commit behavior
- Commit messages should contain ONLY the type, scope, title, and bullet points

Follow the rules below for the commit message.


## Format

```
<type>:<space><message title>

<bullet points summarizing what was updated>
```

## Example Titles

```
feat(auth): add JWT login flow
fix(ui): handle null pointer in sidebar
refactor(api): split user controller logic
docs(readme): add usage section
```

## Example with Title and Body

```
feat(auth): add JWT login flow

- Implemented JWT token validation logic
- Added documentation for the validation component
```

## Rules

* title is lowercase, no period at the end.
* Title should be a clear summary, max 50 characters.
* Use the body (optional) to explain *why*, not just *what*.
* Bullet points should be concise and high-level.

Avoid

* Vague titles like: "update", "fix stuff"
* Overly long or unfocused titles
* Excessive detail in bullet points

## Allowed Types

| Type     | Description                           |
| -------- | ------------------------------------- |
| feat     | New feature                           |
| fix      | Bug fix                               |
| chore    | Maintenance (e.g., tooling, deps)     |
| docs     | Documentation changes                 |
| refactor | Code restructure (no behavior change) |
| test     | Adding or refactoring tests           |
| perf     | Performance improvements              |
