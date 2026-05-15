# Changesets

This directory holds [changesets](https://github.com/changesets/changesets) - markdown files describing version bumps for the packages in this monorepo.

## Adding a changeset

```bash
pnpm changeset
```

Pick the affected packages, the bump type (patch/minor/major), and write a short summary. The file will be committed alongside your PR.

## Releasing

On merge to `develop`, a release workflow (TBD) consumes the accumulated changesets to bump versions and publish to npm.
