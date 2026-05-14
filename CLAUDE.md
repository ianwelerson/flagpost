# flagpost

Monorepo for the **flagpost** project — git-based feature flag control. Users fork a template repo, manage feature flags as YAML files via pull requests, and read them at runtime through a small JS SDK. No servers, no accounts.

See [IDEA.md](./IDEA.md) for the full design, v1 scope, and naming decisions.

## Packages

- `packages/core` → `@flagpost/core` — shared flag schema & types (zod)
- `packages/sdk-js` → `@flagpost/sdk-js` — JS runtime SDK (`Flagpost` class, fetch + cache + override resolution)
- `packages/action` → `@flagpost/action` — GitHub Action with `mode: validate | build` (validates flag YAML, compiles `flags.json`, updates README table, commits + pushes)

Cross-package imports resolve via tsconfig `paths` (typecheck) and vitest `resolve.alias` (tests), both pointing at the source TS — so neither typecheck nor tests need a prior build.

## Toolchain

- pnpm workspaces, TypeScript strict, Node 20+
- Build: `tsup` (sdk-js, core → ESM+CJS+dts), `@vercel/ncc` (action → single bundled JS)
- Test: vitest
- Lint+format: biome (single tool, config in `biome.json`)
- Versioning: changesets (action excluded — it's not published to npm)

## Common commands

```bash
pnpm install
pnpm build       # build all packages
pnpm test        # run all tests (vitest)
pnpm typecheck   # tsc --noEmit per package
pnpm lint        # biome check
pnpm lint:fix    # biome check --write
```

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
