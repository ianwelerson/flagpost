# flagpost

Monorepo for the **flagpost** project - git-based feature flag control. Users fork a template repo, manage feature flags as YAML files via pull requests, and read them at runtime through a small JS SDK. No servers, no accounts.

See [IDEA.md](./IDEA.md) for the full design and naming decisions.

## Packages

- `packages/core` -> `@flagpost/core` - shared flag schema & types (zod). Supports boolean, rollout, targeting, and per-environment overrides.
- `packages/sdk-js` -> `@flagpost/sdk-js` - JS runtime SDK (`Flagpost` class, fetch + cache + evaluation engine + override resolution). Sources: `github`, `memory`, `file`.
- `packages/action` -> `@flagpost/action` - GitHub Action with `mode: validate | build` (validates flag YAML, compiles `flags.json`, updates README table, commits + pushes).

## Apps

- `apps/docs` -> `@flagpost/docs` - Astro Starlight documentation site, deployed to GitHub Pages at flagpost.dev.

Cross-package imports resolve via tsconfig `paths` (typecheck) and vitest `resolve.alias` (tests), both pointing at the source TS - so neither typecheck nor tests need a prior build.

## Toolchain

- pnpm workspaces, TypeScript strict, Node 24+
- Build: `tsup` (sdk-js, core -> ESM+CJS+dts), `@vercel/ncc` (action -> single bundled JS), Astro (docs)
- Test: vitest + `@vitest/coverage-v8` with a **90% threshold** enforced in CI
- Lint+format: biome (single tool, config in `biome.json`)
- Versioning: changesets (action and docs excluded)

## Common commands

```bash
pnpm install
pnpm build            # build all packages
pnpm test             # run all tests (vitest)
pnpm test:coverage    # run with coverage report + 90% threshold check
pnpm typecheck        # tsc --noEmit per package; astro check for docs
pnpm lint             # biome check
pnpm lint:fix         # biome check --write

# Docs site
pnpm --filter @flagpost/docs dev    # local dev server
pnpm --filter @flagpost/docs build  # build static site
```

## Related repos

- [flagpost-template](https://github.com/ianwelerson/flagpost-template) - the "Use this template" fork target for end users. Contains only example flags, a workflow that references `@flagpost/action`, and a starter README. **No source code.**

## Naming & ownership context

- Code currently lives under `ianwelerson/` for portfolio visibility; planned future GitHub org is `flagpost-dev` (mirrors the planned `flagpost.dev` domain).
- npm scope `@flagpost` is reserved and used from day one - packages stay stable across any future org transfer.
- See the **Naming & ownership** section in IDEA.md for the full table.

## Feature scope

- **Boolean flags**: required `enabled: true|false`.
- **Percentage rollout**: integer 0-100, deterministic FNV-1a bucketing on `userId`. Fails closed if `userId` missing on partial rollout.
- **Targeting**: `targeting.enable.{users,groups}` and `targeting.disable.{users,groups}` allowlists. Disable wins over enable wins over base.
- **Environments**: `environments.<name>.{enabled,rollout,targeting}` partial overrides. Selected via `context.environment`.
- **Local overrides**: static map + function override for dev/test, no SDK mocking needed.
- **Sources**: `github` (default), `memory` (in-memory object), `file` (local JSON).
- Private-repo-first (PAT-based access from the SDK).
- No public dashboard - flag names can leak unreleased work.

## Code style

- Replace em-dashes (`—`) with hyphens (`-`) anywhere they would appear.
- Strict zod schemas (no unknown fields).
- Background SDK refresh failures surface through `onRefreshError` callback - never silently dropped.
