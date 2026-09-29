# GO-DUCK Docs

Product documentation for **GO-DUCK** (GDL → Go microservices). Astro Starlight. UI accent `#6366f1`, taken from the source site's CSS gradient.

## Source of truth

Local HTML, not the live marketing site:

```text
/Users/abdulla/Work/current-go-duck-doc/Website
```

Notes from that crawl: [research/SOURCE_NOTES.md](research/SOURCE_NOTES.md). Per-page text dumps: `research/extracts/`.

CLI repository docs added alongside the HTML (install, flags, multi-silo client guide, generator invariants, changelog):

```text
research/cli-sources/
  README.md  CLI_GUIDE.md  AGENTS.md  AGENT_README.md  MULTI_SILO_README.md  CHANGELOG.md
```

Where those files disagree with the website HTML, the docs page says so instead of picking one. The install command `npm install -g go-duck-cli` comes from the CLI README. The HTML never printed it.

Suggested docs hostname: `docs.goduck.dev`.

## Quick start

```bash
cd /Users/abdulla/Work/go-duck-doc
npm install
npm run dev
```

Open [http://127.0.0.1:4321](http://127.0.0.1:4321).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Starlight on `127.0.0.1:4321` |
| `npm run build` | Static `dist/` |
| `npm run preview` | Serve `dist/` on `127.0.0.1:4321` |

## Layout

```text
src/content/docs/
  getting-started/     # introduction, install, legend
  gdl/                 # language
  guides/              # wizard, CLI, configuration
  features/            # REST, search, tenancy, gateway, gRPC, saga
  ops/                 # websockets, MQTT, audit, traces
  infra/               # security, Redis, Keycloak, storage, serverless
  reference/           # config keys, precautions
src/components/        # CustomHero, InstallBar
src/styles/brand.css   # light and dark splash
public/favicon.png
```

Screenshots were not captured. If you add them, put files in `src/content/docs/assets/screenshots/` and reference them with a relative path such as `../assets/screenshots/01-example.png`.

## Deploy

Vercel settings are in `vercel.json` (`build`: `npm run build`, output: `dist/`).

```bash
npx vercel
npx vercel --prod
```
