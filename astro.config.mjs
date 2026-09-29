// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

/** UI accent from Website CSS gradient-text (#6366f1 → #a855f7). */
const BRAND = '#6366f1';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.goduck.dev',
  integrations: [
    starlight({
      title: 'GO-DUCK',
      description:
        'Generate Go microservices from GDL — Gin REST, Kratos gRPC, hybrid persistence, and Keycloak.',
      favicon: '/favicon.png',
      logo: {
        src: './src/assets/logo.png',
        alt: 'GO-DUCK',
        replacesTitle: false,
      },
      customCss: ['./src/styles/brand.css'],
      components: {
        Hero: './src/components/CustomHero.astro',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Install & first generate', slug: 'getting-started/install' },
            { label: 'Legend', slug: 'getting-started/legend' },
          ],
        },
        {
          label: 'GDL language',
          items: [
            { label: 'Getting started', slug: 'gdl/getting-started' },
            { label: 'Entities & fields', slug: 'gdl/entities' },
            { label: 'Relationships', slug: 'gdl/relationships' },
            { label: 'Annotations', slug: 'gdl/annotations' },
            { label: 'Advanced', slug: 'gdl/advanced' },
          ],
        },
        {
          label: 'Generation & CLI',
          items: [
            { label: 'Config wizard', slug: 'guides/wizard' },
            { label: 'CLI reference', slug: 'guides/cli' },
            { label: 'Configuration', slug: 'guides/configuration' },
            { label: 'Angular SDK', slug: 'guides/angular-sdk' },
            { label: 'Generated app notes', slug: 'guides/generated-app' },
            { label: 'Contributor guide', slug: 'guides/agents' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Overview', slug: 'features/overview' },
            { label: 'REST & search', slug: 'features/rest' },
            { label: 'Elasticsearch', slug: 'features/elasticsearch' },
            { label: 'GraphQL', slug: 'features/graphql' },
            { label: 'Multi-tenancy', slug: 'features/multitenancy' },
            { label: 'Multi-silo guide', slug: 'features/multi-silo' },
            { label: 'Federation', slug: 'features/federation' },
            { label: 'Strait of Duck Gateway', slug: 'features/gateway' },
            { label: 'Hybrid-Store', slug: 'features/hybrid-store' },
            { label: 'gRPC', slug: 'features/grpc' },
            { label: 'Saga & outbox', slug: 'features/saga' },
            { label: 'Integrations', slug: 'features/integrations' },
          ],
        },
        {
          label: 'Operations',
          items: [
            { label: 'WebSockets', slug: 'ops/websockets' },
            { label: 'Mosquitto', slug: 'ops/mosquitto' },
            { label: 'Audit', slug: 'ops/audit' },
            { label: 'Observability', slug: 'ops/observability' },
            { label: 'SonarQube', slug: 'ops/sonarqube' },
            { label: 'OpenTelemetry', slug: 'ops/otel' },
            { label: 'Datadog', slug: 'ops/datadog' },
          ],
        },
        {
          label: 'Infrastructure',
          items: [
            { label: 'Security', slug: 'infra/security' },
            { label: 'Redis', slug: 'infra/redis' },
            { label: 'Keycloak', slug: 'infra/keycloak' },
            { label: 'Storage', slug: 'infra/storage' },
            { label: 'Serverless', slug: 'infra/serverless' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Config keys', slug: 'reference/config-keys' },
            { label: 'Precautions', slug: 'reference/precautions' },
            { label: 'Changelog', slug: 'reference/changelog' },
          ],
        },
      ],
      head: [
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: BRAND },
        },
      ],
    }),
  ],
});
