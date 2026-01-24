---
author: "Ian Bull"
pubDatetime: 2026-01-24
title: "Beads - Memory for your Agent and The Best Damn Issue Tracker Your're Not Using"
postSlug: beads
featured: false
tags:
 - ai
 - software engineering
description: "A practical guide to Steve Yegge's git-native task system for AI coding agents."
---

Fifteen years ago, while converting the Eclipse Project from CVS to Git, [Chris Aniszczyk](https://www.linkedin.com/in/caniszczyk/) mused about a distributed issue tracker. The idea stuck with me. I figured someone smarter would eventually build it.

Turns out [Steve Yegge](https://www.linkedin.com/in/steveyegge/) did, but for a reason none of us anticipated: _AI agents need external memory_.

Beads (`bd`) is a git-backed issue tracker designed for AI coding agents. [Built by Yegge in 6 days with Claude](https://steve-yegge.medium.com/the-beads-revolution-how-i-built-the-todo-system-that-ai-agents-actually-want-to-use-228a5f9be2a9), it solves what he calls the "50 First Dates" problem, agents wake up with no memory of yesterday's work. Beads gives them persistent, structured memory that travels with your code in git.

But how do you actually use it? After spending time with beads and digging into community patterns, here's what I found that works.

## The Core Mental Model

Beads stores issues in two places:

- **SQLite** (`.beads/beads.db`) - fast local queries, gitignored
- **JSONL** (`.beads/issues.jsonl`) - git-tracked, syncs across machines

When you run `bd create`, it writes to SQLite immediately, then exports to JSONL. When collaborators pull, the JSONL imports to their SQLite. No central server, git IS the database.

```bash
Your machine                    Collaborator's machine
─────────────                   ──────────────────────
SQLite (local)                  SQLite (local)
    ↕ auto-sync                     ↕ auto-sync
JSONL (git-tracked)   ←─────→   JSONL (git-tracked)
         └──── git push/pull ────┘
```

The core query is simple:

```bash
bd ready --json
```

This returns unblocked, prioritized work. No parsing markdown. No hallucinating what phase you're on. Just structured data.

## Why Not Markdown Plans?

Markdown plans break down during long-horizon work:

- **Not queryable**: You can't reliably build a work queue or track dependencies
- **Bit-rot fast**: By day two, you have PLAN_v2.md, TASKS.md, and PROJECT_PHASES.md, all contradicting each other
- **High parse cost**: Every access consumes context window

As Yegge puts it: ["All they know is what's on disk. If you got competing documents, obsolete documents, conflicting documents... they get dementia."](https://paddo.dev/blog/beads-memory-for-coding-agents/)

Beads replaces this with a single queryable database that syncs via git.

## Getting Started

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Initialize in your project
cd your-project
bd init

# For Claude Code: install hooks
bd setup claude
```

That's it. No PostgreSQL, no Redis, no Docker. Just a local SQLite database and a JSONL file that travels with your code.

## The Core Workflow: Think → Create → Act

The first question everyone asks: do I start from issues or prompts?

**Both work, but they serve different purposes.**

### Prompt-First (Reactive Work)

You see a bug, you tell the AI about it:

> "There's an auth bug where tokens expire too early. Investigate and fix it."

The AI investigates, understands the problem, creates issues as it plans:

```bash
bd create "Token expiry set to 1 hour instead of 24" -t bug -p 1
bd create "Add token refresh logic" -t task -p 2
bd dep add <refresh-task> <expiry-bug>  # refresh depends on fix
```

Then works through them, closing as it goes.

**When to use**: Ad-hoc bugs, exploration, when you don't know the full scope yet.

### Issue-First (Planned Work)

You know what needs doing, so you create the issue first:

```bash
bd create "Implement dark mode toggle" -t feature -p 2 \
  --description "Add toggle in settings, persist preference, apply theme"
```

Then tell the AI:

> "Work on bd-a1b2"

The AI has a clear target with acceptance criteria.

**When to use**: Features, planned work, when you want to track progress across sessions.

### The Pattern That I Use

1. **Think with prompts**: Describe the problem, let AI investigate
2. **Create issues**: Capture the work discovered (AI or you)
3. **Act on issues**: Work through `bd ready`, close when done

The key insight: **issues are handoff points**. When you kill a session and start fresh, the new agent runs `bd ready` and knows exactly where to pick up.

### Session Bookends

**Start**:

```bash
bd ready                    # What's available?
bd show <id>                # Review before starting
bd update <id> --status in_progress
```

**End**:

```bash
bd close <id>               # Complete work
bd sync                     # Export and commit
git push                    # Share with team
```

## Four Dependency Types

Beads supports four distinct relationship types:

|Type|Purpose|Affects Ready Work?|
|---|---|---|
|**blocks**|X cannot start until Y completes|Yes|
|**parent-child**|Task belongs to epic|Yes (epic blocks children)|
|**related**|Connected but don't block each other|No|
|**discovered-from**|Found while working on another issue|No (audit trail only)|

The `discovered-from` type is particularly powerful. When your agent is fixing a bug and notices a memory leak in an unrelated service, it can file:

```bash
bd create "Fix memory leak in image loader" -t bug -p 1 \
  --deps discovered-from:bd-abc123 --json
```

The leak is now tracked, linked to its discovery context, and won't be forgotten when the session ends.

## Usage Patterns

### Pattern 1: Epic Decomposition

For larger features, start with an epic and decompose:

1. **Create a design doc** (or brainstorm with your agent)
2. **Create an epic:** `bd create "User Authentication System" -t epic -p 1`
3. **Have the agent decompose** into child tasks with dependencies
4. **Execute via `bd ready` loop**

Beads supports arbitrary nesting, epics can contain sub-epics, which contain tasks. The dependency graph handles blocking automatically.

### Pattern 2: File As You Go

For exploratory work or smaller features:

1. Start working on something
2. When you discover sub-tasks, file them: `bd create "Handle edge case X" -p 2 --deps discovered-from:current-task`
3. When a task will take more than ~2 minutes, file it as a bead

This pattern is less structured but captures work that would otherwise be lost.

### Pattern 3: Hybrid (Specs + Beads)

Combine detailed planning documents with Beads execution:

1. **Create detailed markdown specs** outlining goals and requirements
2. **Feed the spec to your agent**, have it create structured epics/tasks in Beads
3. **Execute using Beads**, track progress there

The spec provides the "why" and high-level design; Beads provides the "what's next" and execution tracking.

## The "Land the Plane" Protocol

At the end of every session, don't just stop. [Tell your agent to "land the plane"](https://steve-yegge.medium.com/beads-blows-up-a0a61bb889b4):

```bash
Let's land the plane
```

This triggers a cleanup protocol:

1. Run quality gates (tests, linting)
2. File any remaining discovered work as issues
3. Close finished issues
4. Pull, sync, and push to remote
5. Generate a handoff prompt for the next session

The handoff prompt is key, it's a ready-to-paste summary that the next agent (or tomorrow's session) can use to immediately orient itself.

**Critical:** The plane isn't landed until `git push` succeeds. Unpushed work causes severe conflicts in multi-agent workflows.

## Init Modes for Different Scenarios

Beads adapts to various collaboration patterns:

```bash
bd init                      # Basic interactive setup
bd init --quiet              # Non-interactive (for agents)
bd init --stealth            # Local-only, no repo pollution
bd init --contributor        # OSS fork workflow
bd init --team               # Team member with commit access
bd init --branch beads-sync  # Protected branch workflow
```

**Stealth mode** is perfect when you want personal task tracking on a shared repo without committing beads files.

**Contributor mode** routes your planning issues to a separate location, keeping experimental work out of PRs.

**Protected branch mode** commits to a separate sync branch, then you merge via PR.

## How Collaboration Works

Beads uses git as its distributed database:

1. **You make changes** → Daemon exports to `.beads/issues.jsonl`
2. **You commit and push** the JSONL file
3. **Collaborators pull** → Their daemon auto-imports

Hash-based issue IDs (e.g., `bd-a3f2`) prevent collisions when multiple agents create issues simultaneously. No more "both agents created bd-10" merge conflicts.

## Multi-Agent Workflows

For teams running multiple AI agents:

**Git Worktrees:** Each agent gets its own worktree and branch. Beads syncs via git. Agents work independently, merge normally.

**Agent Mail:** Pair Beads (shared memory) with MCP Agent Mail (messaging). Agents coordinate task claims and handoffs in real-time.

As Jeffrey Emanuel (creator of MCP Agent Mail) [described to Yegge](https://steve-yegge.medium.com/beads-best-practices-2db636b9760c): "Beads gives the agents shared memory, and Agent Mail gives them messaging... that's all they need. You just give them a task and tell them to go sort it out amongst themselves."

## The Daemon

Behind the scenes, a background daemon handles synchronization:

```bash
CLI Command → Unix Socket → Daemon → SQLite DB
                              ↓
                        JSONL Export (5s debounce)
                              ↓
                        Git commit/push (if enabled)
```

The daemon provides:

- **Auto-sync** between SQLite and JSONL
- **File watching** to detect external changes
- **Connection pooling** for fast CLI operations
- **60% CPU reduction** vs polling approaches

You can run without the daemon (`--no-daemon`) for simpler setups, but you'll need explicit `bd sync` calls.

## Dealing with Context Rot

If your agent forgets about Beads mid-session (which happens as context fills), you have a few options:

**Kill sessions earlier.** As Yegge notes, ["you can just kill your agents after completing each issue. Beads helps agents easily find where they're supposed to pick up again, so it's easy to make your sessions throwaway."](https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a) If context rot is happening, your session is too long. One task, land the plane, kill it, start fresh.

**Remind it.** There's no shame in saying "don't forget to run bd sync" at the end. Beads is designed so that even when the agent forgets, the state survives.

**Make CLAUDE.md / AGENTS.md instructions stickier:**

```markdown
CRITICAL: Track all work in beads. Before starting any task, run `bd ready`.
Before ending any session, run `bd sync`. File discovered work with `bd create`.
```

**Use smaller tasks.** If you're hitting context rot, your tasks are probably too big. The recommended granularity: anything over ~2 minutes of work should be its own issue.

## Database Maintenance

Over time, closed issues accumulate. Beads provides "agentic memory decay":

```bash
# Find compaction candidates (closed 30+ days)
bd compact --analyze --json

# Agent summarizes and compacts
bd compact --apply --id bd-42 --summary summary.txt
```

This replaces detailed issue content with AI-generated summaries, preserving essential context while reducing database size.

Regular maintenance:

```bash
bd doctor        # Health check
bd doctor --fix  # Auto-fix issues
bd cleanup       # Archive closed tasks
```

## Beads Vs. Traditional Issue Trackers

[Yegge is explicit about positioning](https://paddo.dev/blog/beads-memory-for-coding-agents/): "Beads isn't a planning tool, a PRD generator, or Jira. It's orchestration for what you're working on today and this week."

This doesn't mean you _can't_ use Beads for backlogs -- there's a P4 (backlog) priority level, and nothing technically prevents it. But the design optimizes for different concerns:

**Why Beads favours near-term work:**

- **Ready work detection**: The `bd ready` command surfaces what's unblocked _right now_. A 500-item backlog of "someday/maybe" features would clutter that query and waste context tokens every time an agent checks what to do next.
    
- **Context window efficiency**: Beads is designed to give agents only what they need. Vague future work burns tokens without aiding execution.
    
- **Execution over planning**: Planning happens in specs, PRDs, design docs. Beads tracks what you're _actively building_, not what you might build in Q3.

**Practical guidance:**

- Use Beads for this week's work and near-term features you're actively decomposing
- Keep distant backlog items in your existing system (GitHub Issues, Linear, Notion, a simple markdown file)
- When a backlog item moves to "now," create a Beads epic and decompose it
- Use P4 priority sparingly for "discovered but not urgent" work that you'll get to soon

The goal is keeping `bd ready` crisp and actionable. If your agent runs that command and gets back 47 items including "Research GraphQL federation (someday)" mixed with "Fix auth bug (blocking release)," you've lost the value.

**Other cases where Beads isn't the right tool:**

- **Documentation**: Use your docs system
- **Simple single-session tasks**: Just do them directly
- **Human-centric workflows**: If your team lives in Jira/Linear and agents are occasional helpers, keep the source of truth there

## The Community Tools Ecosystem

Here's where Beads diverges sharply from traditional issue trackers: it's designed like `git`, a powerful protocol and CLI, while leaving UI and integration to the community. [Yegge is explicit about this](https://steve-yegge.medium.com/beads-best-practices-2db636b9760c): "Beads doesn't have a UI, but it has lots of example UIs that people have built as passion projects."

This isn't a gap, it's intentional architecture. Just as git has GitHub, GitLab, VS Code, and dozens of clients built on top of it, Beads has spawned a rich ecosystem of tools, each solving different workflow problems.

### Terminal UIs (TUIs)

For developers who live in the terminal, several options have emerged:

- **[beads_viewer (`bv`)](https://github.com/Dicklesworthstone/beads_viewer)** by Jeffrey Emanuel is perhaps the most sophisticated. Built in Go, it provides not just a viewer but _graph analytics_ for agents.
- **perles** by @zjrosen introduces BQL (Beads Query Language): a custom query language for filtering issues.
- **lazybeads** by @codegangsta is a lightweight Bubble Tea TUI for quick browsing.
- **bdui** by @assimelha provides real-time terminal updates with tree views and dependency graphs.

### Web Interfaces

For teams that want visual dashboards:

- **beads-ui** by @mantoni is zero-setup: just run `npx beads-ui start`. It offers live updates, inline editing, epic progress tracking, and a kanban board view. Keyboard navigation for power users.
- **Monitor WebUI** from the Beads core team provides a clean, responsive real-time dashboard that connects to the daemon via RPC.
- **beads-dashboard** by @rhydlewis focuses on metrics: lead time, throughput, and continuous improvement data, useful for teams tracking velocity.
- **beads-kanban-ui** by @AvivK5498 adds git branch status tracking, epic/subtask management, and activity timelines.

### Editor Integrations

- **vscode-beads** by @jdillon brings an issues panel directly into VS Code with daemon management.
- **beads.el** by @ctietze provides Emacs integration for the Emacs holdouts.
- **[nvim-beads](https://joeblu.com/blog/2026_01_introducing-nvim-beads-manage-beads-in-neovim/)** by Joe Blubaugh is a Neovim plugin built in Lua.
- **opencode-beads** by @joshuadavidthomas integrates with OpenCode, providing automatic context injection on session start, `/bd-*` slash commands, and an autonomous task agent that finds and completes ready work.

### Orchestration and Multi-Agent Tools

The most interesting development is how Beads has become infrastructure for multi-agent systems:

**MCP Agent Mail** by Jeffrey Emanuel (@Dicklesworthstone) provides agent-to-agent messaging. Combined with Beads for shared memory, agents can coordinate without human intervention. [Yegge describes the pattern](https://steve-yegge.medium.com/beads-best-practices-2db636b9760c): "You just give them a task and tell them to go sort it out amongst themselves. There's no ego, so they quickly decide on a leader and just split things up."

**beads-orchestration** by @AvivK5498 is a multi-agent orchestration skill for Claude Code,. the orchestrator investigates issues, manages beads tasks, and delegates to tech-specific supervisors on isolated branches.

**Gas Town** is Yegge's own orchestration layer (still in development) that adds concepts like "convoys" (bundles of beads assigned to agents) and "rigs" (workspace configurations).

### The Protocol Advantage

This ecosystem exists because Beads chose the protocol approach:

- **--json flags** on every command for machine consumption
- **JSONL source-of-truth** that's both human-readable and machine-parseable
- **SQLite database** that tools can query directly
- **Daemon with Unix socket RPC** for efficient integration
- **Clear data model** (issues, dependencies, statuses, priorities)

Any developer can build on Beads because the interface is stable and well-documented. The community has responded with tools in Go, Rust, TypeScript, Node.js, Python, Lua, and Swift, each optimized for different workflows.

If your preferred UI doesn't exist yet, you can build it!

## The Honest Gaps

Beads is designed as **passive infrastructure**: it's there when you use it, but doesn't force itself into your workflow. This creates some friction you should know about:

**Claude doesn't proactively use it.** You need to say "track this in beads" or "check bd ready." The agent won't spontaneously decide to file issues or check the backlog.

**CLAUDE.md instructions fade.** By session end, the agent is focused on the immediate task, not cleanup steps. "Land the plane" (sync, push, file remaining work) needs explicit prompting. The hooks help, but they're not magic.

**Session handoff is manual.** You need to prompt "check bd ready" at session start. The tool provides memory, but you trigger its use.

**Context rot still happens.** Even with hooks installed, long sessions can drift. The agent that started by checking `bd ready` may forget about beads entirely by hour two. The fix: shorter sessions, more explicit prompting, or just accept that you'll need to remind it.

**Collaboration requires setup.** The sync branch pattern works, but you need to configure it explicitly. Out of the box, issues travel with code branches, which may not be what you want.

**Merge conflicts happen.** JSONL is more merge-friendly than SQLite, but Beads is still ["a crummy architecture (by pre-AI standards) that requires AI in order to work around all its edge cases where it breaks."](https://steve-yegge.medium.com/beads-best-practices-2db636b9760c) Yegge's words, not mine. The good news: AI can always get it working.

The bottom line: **Beads provides the memory. You provide the discipline to use it.**

## The Bigger Picture

Beads represents a new category: **agent-native infrastructure**. Rather than retrofitting AI onto existing issue trackers, it asks: "What would task management look like if designed from scratch for AI agents?"

The answer:

- **Queryable, not parseable**: structured data, not markdown
- **Git-native, not server-hosted**: distributed without infrastructure
- **Dependency-aware, not flat**: prevent impossible work
- **JSON-first, not human-first**: agents are the primary users

Four kinds of dependencies chain issues together like beads on a string, making them easy for agents to follow for long distances and reliably perform complex task streams in the right order.

## Getting Started Today

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Initialize
cd your-project
bd init

# For Claude Code users
bd setup claude

# Add to AGENTS.md or CLAUDE.md:
echo "Use 'bd' for task tracking. Run 'bd ready --json' to find work." >> AGENTS.md

# Create your first issue
bd create "My Feature" -t epic -p 1
```

Then start your next coding session with: "Check beads and pick up the highest priority task."

## Summary

The patterns that actually work:

1. **Think with prompts, capture in issues**: Let investigation inform issue creation
2. **Issues are handoff points**: Sessions can die, work persists
3. **Use `bd ready` as your "what next?"**: Dependencies handle ordering
4. **Kill sessions freely**: Fine-grained issues mean cheap sessions
5. **Be explicit**: Beads is opt-in infrastructure, not automatic enforcement

Beads won't solve context rot by magic. It's a tool, not a cure. But it gives you something markdown plans never could: structured, queryable, dependency-aware memory that survives session boundaries and syncs through git.

The tool provides the memory. You provide the discipline.

---

_Beads is open source at [github.com/steveyegge/beads](https://github.com/steveyegge/beads). For more on AI coding workflows, check out Steve Yegge's book "Vibe Coding" with Gene Kim._
