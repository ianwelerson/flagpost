import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLlmsTxt from 'starlight-llms-txt';

// When deploying to a custom domain (flagpost.dev), `site` is the canonical URL and
// `base` stays at '/'. If hosting at github.io/<repo>, set base: '/flagpost/' instead.
export default defineConfig({
  site: 'https://flagpost.dev',
  integrations: [
    starlight({
      title: 'flagpost',
      description:
        'Git-based feature flag control. Manage feature flags as YAML files in a GitHub repo - no servers, no accounts.',
      logo: { src: './src/assets/logo.svg', replacesTitle: false },
      plugins: [
        starlightLlmsTxt({
          projectName: 'flagpost',
          description:
            'Git-based feature flag control. Manage feature flags as YAML files in a GitHub repo - no servers, no accounts.',
          details:
            'flagpost stores feature flags as YAML files in a git repository. A GitHub Action validates the schema and compiles a flags.json artifact; a tiny JS SDK reads it at runtime and evaluates rollout / targeting / environment rules.',
        }),
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/ianwelerson/flagpost',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/ianwelerson/flagpost/edit/develop/apps/docs/',
      },
      sidebar: [
        {
          label: 'Introduction',
          items: [
            { label: 'What is flagpost?', slug: 'introduction/what-is-flagpost' },
            { label: 'Quick start', slug: 'introduction/quick-start' },
            { label: 'Core concepts', slug: 'introduction/concepts' },
          ],
        },
        {
          label: 'Flag sources',
          items: [
            { label: 'Overview', slug: 'sources/overview' },
            { label: 'GitHub repo', slug: 'sources/github-repo' },
            { label: 'GitHub token setup', slug: 'sources/github-token' },
            { label: 'Local file', slug: 'sources/local-file' },
            { label: 'In-memory', slug: 'sources/in-memory' },
            { label: 'Local overrides', slug: 'sources/local-overrides' },
          ],
        },
        {
          label: 'Flag repository',
          items: [
            { label: 'Overview', slug: 'repository/overview' },
            { label: 'Using the template', slug: 'repository/template' },
            { label: 'Setting up by hand', slug: 'repository/by-hand' },
            { label: 'Co-locating with your app', slug: 'repository/colocated' },
            { label: 'GitHub Action workflows', slug: 'repository/workflows' },
          ],
        },
        {
          label: 'Flag configuration',
          items: [
            { label: 'Overview', slug: 'configuration/overview' },
            { label: 'Boolean flags', slug: 'configuration/boolean' },
            { label: 'Percentage rollout', slug: 'configuration/rollout' },
            { label: 'Targeting rules', slug: 'configuration/targeting' },
            { label: 'Environments', slug: 'configuration/environments' },
          ],
        },
        {
          label: 'SDK',
          items: [
            { label: 'Evaluation context', slug: 'sdk/evaluation-context' },
            { label: 'Testing', slug: 'sdk/testing' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Flag schema', slug: 'reference/flag-schema' },
            { label: 'SDK API', slug: 'reference/sdk-api' },
            { label: 'Action inputs', slug: 'reference/action-inputs' },
          ],
        },
      ],
    }),
  ],
});
