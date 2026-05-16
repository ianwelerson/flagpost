---
"@flagpost/core": minor
"@flagpost/sdk-js": minor
---

First public release.

- `@flagpost/core`: shared flag schema and types (zod) covering boolean, rollout, targeting, and per-environment overrides.
- `@flagpost/sdk-js`: JS runtime SDK with fetch + cache + evaluation engine, deterministic FNV-1a bucketing, allowlist targeting (disable wins over enable wins over base), environment overrides, and `github`/`memory`/`file` sources.
