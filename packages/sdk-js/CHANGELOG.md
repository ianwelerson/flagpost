# @flagpost/sdk-js

## 0.1.0-alpha.0

### Minor Changes

- 6596bfc: First public release.
  - `@flagpost/core`: shared flag schema and types (zod) covering boolean, rollout, targeting, and per-environment overrides.
  - `@flagpost/sdk-js`: JS runtime SDK with fetch + cache + evaluation engine, deterministic FNV-1a bucketing, allowlist targeting (disable wins over enable wins over base), environment overrides, and `github`/`memory`/`file` sources.

### Patch Changes

- Updated dependencies [6596bfc]
  - @flagpost/core@0.1.0-alpha.0
