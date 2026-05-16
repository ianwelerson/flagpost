# @flagpost/docs

Documentation site for [flagpost](https://github.com/ianwelerson/flagpost), built with [Astro Starlight](https://starlight.astro.build).

Deployed to **[flagpost.ianwelerson.com](https://flagpost.ianwelerson.com)** via GitHub Pages.

## Local dev

```bash
pnpm install
pnpm --filter @flagpost/docs dev
```

The site runs at <http://localhost:4321>.

## Build

```bash
pnpm --filter @flagpost/docs build
```

Output goes to `apps/docs/dist`.

## Deployment

The `.github/workflows/docs.yml` workflow builds and deploys to GitHub Pages on every push to `main` that touches `apps/docs/**`.

**One-time GitHub setup:**

1. Repo Settings -> Pages -> **Source: GitHub Actions**
2. Repo Settings -> Pages -> **Custom domain: `flagpost.ianwelerson.com`** (after DNS is configured)
3. DNS: add a CNAME record pointing `flagpost.ianwelerson.com` -> `<username>.github.io`
4. Wait for HTTPS to provision (Pages does this automatically once DNS is verified)

The `public/CNAME` file is included so that Pages picks up the custom domain on every deploy.

## Structure

- `src/content/docs/` - Markdown / MDX pages, grouped by sidebar section
- `astro.config.mjs` - Starlight integration + sidebar config
- `src/assets/` - Images, logos
- `public/` - Static files served as-is (including `CNAME`)
