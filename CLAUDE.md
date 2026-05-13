# flagpost

Monorepo for the **flagpost** project — git-based feature flag control. Users fork a template repo, manage feature flags as YAML files via pull requests, and read them at runtime through a small JS SDK. No servers, no accounts.

See [IDEA.md](./IDEA.md) for the full design, v1 scope, and naming decisions.

## Packages (planned)

- `packages/core` → `@flagpost/core` — shared flag schema & types
- `packages/sdk-js` → `@flagpost/sdk-js` — JS runtime SDK
- `packages/action` → `@flagpost/action` — GitHub Action (validate + build `flags.json` + update README table)

Toolchain: pnpm workspaces, TypeScript.

## Related repos

- [flagpost-template](https://github.com/ianwelerson/flagpost-template) — the "Use this template" fork target for end users. Contains only example flags, a workflow that references `@flagpost/action`, and a starter README. **No source code.**

## Naming & ownership context

- Code currently lives under `ianwelerson/` for portfolio visibility; planned future GitHub org is `flagpost-dev` (mirrors the planned `flagpost.dev` domain).
- npm scope `@flagpost` is reserved and used from day one — packages stay stable across any future org transfer.
- See the **Naming & ownership** section in IDEA.md for the full table.

## v1 scope reminders

- Boolean flags only (no percentage rollout, no targeting rules, no environments)
- Private-repo-first (PAT-based access from the SDK)
- No public dashboard — flag names can leak unreleased work
