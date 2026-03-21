---
name: lumis-workflow
description: Workflow and communication rules for Claude sessions working on Lumis. This skill governs HOW Claude works on this project — planning before acting, confirming before modifying, updating docs after changes, and following the established development process. Trigger on every Lumis coding task, file modification, feature implementation, bug fix, or refactor. Also trigger when Claude is about to run commands, install packages, modify config files, or make architectural decisions. If you are about to write or change code for Lumis without consulting this skill first, stop and read it.
---

# Lumis Workflow Skill

These rules govern how Claude operates on the Lumis codebase. They apply to Claude Code, Claude.ai chat sessions, and any other Claude environment working on Lumis.

---

## 1. Plan Before You Act

**Never start writing code without explaining your plan first.**

Before making any change, state:
- **What** you're going to do (specific files, components, or functions)
- **Why** (what problem it solves or what feature it adds)
- **How** (approach, patterns you'll follow, any tradeoffs)
- **What you won't touch** (if the change is scoped, say so explicitly)

Wait for Nick's approval before proceeding on anything non-trivial. For small, obvious fixes (typos, formatting), you can proceed but still state what you did.

**If you're uncertain about an approach, say so.** Present options with tradeoffs rather than guessing. Nick would rather spend 30 seconds choosing between two approaches than 30 minutes undoing the wrong one.

## 2. Check Context Before Starting

Before implementing anything:

1. **Read the relevant Tasks.md** (`Systems/Frontend/Tasks.md` or `Systems/Backend/Tasks.md` in the Obsidian vault) to understand what's been done and what's next.
2. **Check existing code** in the area you're about to modify. Don't introduce patterns that conflict with what's already there.
3. **Reference the schema** if touching database queries. Column names, table prefixes, and JSONB structures are documented in `Core/Schema.md` and summarized in `CLAUDE.md`.
4. **Check the security skill** (`lumis-security`) for any rules relevant to your change.

If you don't have access to the vault docs (e.g., in Claude Code without filesystem MCP), say so and ask Nick to provide the relevant context rather than guessing.

## 3. Confirm Before Modifying Critical Files

**Always ask before modifying these files — never change them silently:**

- `src/middleware.ts` — auth routing
- `src/lib/supabase-*.ts` — Supabase client setup
- `.env.local` — environment variables (you shouldn't touch this at all)
- `.gitignore` — git ignore rules
- `next.config.ts` — Next.js configuration
- `package.json` — dependencies (see dependency rules below)
- `tsconfig.json` — TypeScript config
- `.claude/settings.json` — Claude Code permissions
- Any database migration SQL

For these files, state the exact change (before/after) and wait for confirmation.

## 4. One Thing at a Time

- **Don't bundle unrelated changes.** If Nick asks for a playbook list component and you notice a bug in the nav, fix the component first, then mention the bug separately.
- **Don't refactor while implementing.** If existing code needs cleanup, note it but don't mix it into the current task unless Nick asks.
- **Keep PRs/commits focused.** One feature or fix per commit. Write clear commit messages: `Add playbook list to dashboard`, not `Update files`.

## 5. Dependency Rules

Before installing any npm package:
1. **State the package name and version**
2. **Explain why it's needed** and what it does
3. **Mention alternatives** you considered and why you chose this one
4. **Check**: Is it actively maintained? Last published within 6 months? >10K weekly downloads? Any known vulnerabilities?
5. **Wait for approval** before running `npm install`

Never run `npx` commands from packages you haven't verified.

## 6. Code Quality Standards

- **TypeScript strict mode.** No `any` types unless absolutely unavoidable (and if so, add a comment explaining why).
- **Error handling is mandatory.** Every Supabase query must handle the error case. Every async operation needs try/catch or `.catch()`.
- **Server components by default.** Only add `"use client"` when you need interactivity, hooks, or browser APIs. State why when you add it.
- **No dead code.** Don't leave commented-out code, unused imports, or placeholder `console.log` statements.
- **Naming conventions:** kebab-case for files and folders, PascalCase for React components, camelCase for variables and functions.

## 7. After Every Change

Once a change is complete:
1. **Summarize what was done** — files created/modified, key decisions made
2. **Flag anything that needs follow-up** — known limitations, TODOs, things that depend on other work
3. **Suggest the Tasks.md update** — provide the exact text Nick should add to the Current Context section and any checkboxes to mark complete
4. **Suggest the git commit message**

## 8. Communication Style

- Be direct. Don't pad responses with unnecessary context Nick already knows.
- If you hit an issue, say what's wrong, what you tried, and what options remain.
- Don't apologize for mistakes — explain what happened and fix it.
- If Nick's request is ambiguous, ask one clarifying question rather than guessing. But don't over-ask — use your judgment on obvious things.
- When presenting code, make it copy-paste ready. Include the full file path. If it's a partial edit, show enough surrounding context to locate the change.

## 9. What NOT to Do

- **Don't auto-fix linting issues across the codebase** unless specifically asked.
- **Don't upgrade dependencies** unless specifically asked.
- **Don't reorganize file structure** unless specifically asked.
- **Don't add features that weren't requested** — even if they seem useful.
- **Don't remove the investment disclaimer** from any page that has it.
- **Don't create mock data or placeholder content** without labeling it clearly as mock data that needs to be replaced.
