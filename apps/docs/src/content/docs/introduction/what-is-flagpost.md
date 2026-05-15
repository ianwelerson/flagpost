---
title: What is flagpost?
description: An overview of the flagpost project and the problem it solves.
---

**flagpost** is a feature flag system that uses a git repository as its backend. You define flags as YAML files, commit them through pull requests, and read them at runtime through a small JavaScript SDK.

There's no server to deploy, no account to create, and no separate database to maintain. Your flags live where your code lives.

## The shape of the system

```
+--------------------+     +--------------+     +-----------------+
| Flag repo (git)    | --> |  GitHub      | --> | Your app        |
| flags/*.yml        |     |  Action      |     | @flagpost/sdk-js|
|                    |     |  compiles    |     |                 |
| Changes via PR     |     |  flags.json  |     | isEnabled(...)  |
+--------------------+     +--------------+     +-----------------+
```

The flag repo can be:

- A **separate private repo** (the common case, easy to set up with the template)
- The **same repo as your application** (when you want flags next to the code that reads them)
- Any git repo you control - flagpost doesn't care about its layout beyond the `flags/` directory

The SDK can read from:

- A **GitHub repo** (default, fetches `flags.json` via the GitHub API)
- A **local file** (a `flags.json` on disk)
- An **in-memory object** (passed at construction time)
- **Static or function overrides** that bypass all of the above

See [Flag sources](/sources/overview/) for the full picture.

## Why use it?

- **No vendor lock-in.** Your flags live in your own repo. You can leave at any time by reading the YAML directly.
- **No server to host.** GitHub Actions does the validation, compilation, and README update.
- **No paid tier.** GitHub is the only thing you depend on.
- **Familiar workflow.** PRs are the only mutation surface - reviews, audit log, and rollback (`git revert`) come for free.

## When it's a good fit

- Small to medium teams who already use GitHub
- Side projects and indie products
- Apps where developers are the primary flag operators
- Any codebase where "edit YAML, open PR, merge" is a comfortable workflow

## When it's not the right tool

- Hosted SaaS with a UI for non-technical flag operators
- Real-time push of flag changes (flagpost polls on a TTL)
- Hundreds of millions of clients per token (GitHub API rate limits apply)
- Strict no-secrets-in-runtime environments (the SDK uses a PAT for private repos)

For those cases, a hosted feature flag service is the right call.
