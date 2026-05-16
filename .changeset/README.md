# Changesets

This directory holds [changesets](https://github.com/changesets/changesets) - markdown files describing version bumps for the packages in this monorepo.

## Adding a changeset

```bash
pnpm changeset
```

Pick the affected packages, the bump type (patch/minor/major), and write a short summary. The file will be committed alongside your PR.

## Releasing

On merge to `main`, the release workflow (`.github/workflows/release.yml`) runs `changesets/action`. It opens a "Version Packages" PR that bumps versions and updates each package's `CHANGELOG.md`; merging that PR triggers npm publish, git tags, and GitHub releases.
