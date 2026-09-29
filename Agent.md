# GO-DUCK Docs Agent Brief

**You are the implementation agent for this repo:** `/Users/abdulla/Work/go-duck-doc`

Build a deployable **Astro Starlight** documentation site for **GO-DUCK** (Go microservice generator / orchestrator), matching the architecture and UX of CRUDForge docs (`/Users/abdulla/Work/crud-fordge-doc`).

---

## Source of truth (LOCAL — do not rely on the live site)

**Primary corpus (read every file):**

```text
/Users/abdulla/Work/current-go-duck-doc/Website
```

Optional live preview (same content family, may lag local): https://goduck.theheavenscode.com/  
→ Prefer **local HTML** when they differ. Use the live site only if a page is missing locally.

**Assets in the same folder:** `logo.png`, `gin_bottle.png`, `kratos_mark.png`, `triple_identity_registry.png`, `intro.mp4`

Do **not** invent CLI flags, GDL syntax, or config keys. Extract from these HTML files. Mark gaps as `TODO`.

---

## Mission

1. **Mine** the local `Website/` HTML completely  
2. **Implement** Starlight in `/Users/abdulla/Work/go-duck-doc`  
3. Match CRUDForge patterns: custom landing, wide splash, light/dark themes, IA sections, colocated screenshots, Vercel-ready build  

**Pattern reference (copy structure/CSS/components — not CRUDForge product text):**

- `/Users/abdulla/Work/crud-fordge-doc`  
  - `src/components/CustomHero.astro`  
  - `src/components/InstallBar.astro`  
  - `src/styles/brand.css`  
  - `astro.config.mjs`  
  - Screenshots under `src/content/docs/assets/screenshots/`  

---

## Phase 0 — Mandatory local crawl

### Inventory (process ALL)

| Topic | File |
|-------|------|
| Home / marketing | `index.html` |
| Legend | `legend.html` |
| GDL getting started | `gdl.html` |
| Entities & fields | `gdl-entities.html` |
| Relationships | `gdl-relationships.html` |
| Annotations | `gdl-annotations.html` |
| Advanced GDL | `gdl-advanced.html` |
| Config wizard | `wizard.html` |
| CLI reference | `cli.html` |
| Configuration | `configuration.html` |
| REST & search | `rest.html` |
| Elasticsearch | `elasticsearch.html` |
| GraphQL | `graphql.html` |
| Multi-tenancy | `multitenancy.html` |
| Federation | `federation.html` |
| Strait of Duck Gateway | `gateway.html` |
| Hybrid-Store | `hybrid-store.html` |
| gRPC | `grpc.html` |
| WebSockets / realtime | `realtime.html` |
| Mosquitto / MQTT | `mosquitto.html` |
| Audit logs | `audit.html` |
| Observability | `observability.html` |
| OpenTelemetry | `otel.html` |
| Datadog | `datadog.html` |
| Security | `security.html` |
| Redis | `redis.html` |
| Keycloak | `keycloak.html` |
| Serverless | `serverless.html` |
| Storage / S3 bridge | `storage.html` |
| Saga / outbox | `saga.html` |
| Integrations | `integrations.html` |

### How to extract

```bash
# Example: list pages
ls /Users/abdulla/Work/current-go-duck-doc/Website/*.html

# Pull titles / headings / code from a page
rg -n '<h[1-3]|<pre|<code|go-duck-cli|@Audited|entity ' \
  /Users/abdulla/Work/current-go-duck-doc/Website/cli.html | head -80
```

Or open files with the Read tool. For each page, capture into:

`research/SOURCE_NOTES.md`

Required sections in notes:

- Product one-liner (tone down “560% / empire” marketing; keep technical claims)  
- Install / CLI (`go-duck-cli`, `create-gateway`, generate/evolve, wizard)  
- GDL surface (enums, entities, fields, relationships, annotations)  
- Config keys & wizard outputs  
- API: REST filters, ES, GraphQL, gRPC, gateway, hybrid-store, multi-tenant, federation  
- Ops: websockets, MQTT, audit, OTel, Datadog, observability  
- Infra: security, DuckGuard ACL, Triple-Identity, Keycloak, Redis, serverless, storage, saga  
- Brand: sample colors from CSS/logo (`logo.png`) → primary hex for Starlight  

Copy useful static assets into `go-duck-doc/public/` or `src/assets/` (logo at minimum).

---

## Phase A — Scaffold Starlight

```bash
cd /Users/abdulla/Work/go-duck-doc
# Keep Agent.md; scaffold Starlight around it
npm create astro@latest . -- --template starlight --install --no-git --typescript strict -y
# If create fails: mirror package setup from crud-fordge-doc

npm pkg set name="@goduck/docs"
npm pkg set scripts.dev="astro dev --host 127.0.0.1 --port 4321"
npm pkg set scripts.build="astro build"
npm pkg set scripts.preview="astro preview --host 127.0.0.1 --port 4321"
```

Target tree:

```text
go-duck-doc/
├── Agent.md
├── README.md
├── astro.config.mjs
├── research/SOURCE_NOTES.md
├── public/                 # favicon, logo, og-poster.jpg
├── scripts/
├── src/
│   ├── assets/
│   ├── components/         # CustomHero, InstallBar
│   ├── content/docs/
│   │   ├── index.mdx
│   │   ├── getting-started/
│   │   ├── gdl/
│   │   ├── features/
│   │   ├── guides/
│   │   ├── reference/
│   │   └── assets/screenshots/
│   └── styles/brand.css
└── .cursor/agents/         # optional
```

---

## Phase B — Landing (CRUDForge-style)

1. Override `components.Hero` → `CustomHero.astro`  
2. Full-bleed hero: **GO-DUCK** + gradient accent; subtitle (GDL → Go microservices); CTAs  
3. HTML terminal mock (real commands from `cli.html`) — not a tall poster  
4. Light + dark both work (scope splash styles under `:root[data-theme='light'|'dark']`)  
5. Wide layout: `--sl-content-width: min(92rem, calc(100vw - 2rem))`; hero edge-to-edge  
6. Feature cards from real pillars (Hybrid-Store, Dual-Protocol, DuckGuard, Gateway, …)  
7. `InstallBar` with install commands from source  

`npm run build` must pass; theme toggle must change the page.

---

## Phase C — Map Website → Starlight IA

### Getting started
- Introduction ← `index.html` (technical summary)  
- Install / first generate ← `cli.html` + wizard  
- Legend ← `legend.html` (short)  

### GDL language
- Getting started ← `gdl.html`  
- Entities & fields ← `gdl-entities.html`  
- Relationships ← `gdl-relationships.html`  
- Annotations ← `gdl-annotations.html`  
- Advanced ← `gdl-advanced.html`  

### Generation & CLI
- Config wizard ← `wizard.html`  
- CLI reference ← `cli.html`  
- Configuration ← `configuration.html`  

### Features / API
- Overview  
- REST & search ← `rest.html`  
- Elasticsearch ← `elasticsearch.html`  
- GraphQL ← `graphql.html`  
- Multi-tenancy ← `multitenancy.html`  
- Federation ← `federation.html`  
- Gateway ← `gateway.html`  
- Hybrid-Store ← `hybrid-store.html`  
- gRPC ← `grpc.html`  
- Saga ← `saga.html`  
- Integrations ← `integrations.html`  

### Operations
- WebSockets ← `realtime.html`  
- Mosquitto ← `mosquitto.html`  
- Audit ← `audit.html`  
- Observability ← `observability.html`  
- OpenTelemetry ← `otel.html`  
- Datadog ← `datadog.html`  

### Infrastructure
- Security ← `security.html`  
- Redis ← `redis.html`  
- Keycloak ← `keycloak.html`  
- Storage ← `storage.html`  
- Serverless ← `serverless.html`  

### Reference
- Config keys  
- Precautions (secrets, multi-tenant, K8s)  

**Writing rules:** accurate engineering prose; keep capability claims; reduce hype; code fences; cross-links; no secrets.

---

## Phase D — Screenshots (optional)

- Colocate under `src/content/docs/assets/screenshots/`  
- Paths like `../assets/screenshots/01-….png`  
- Can screenshot a local static serve of `Website/` if useful:

```bash
cd /Users/abdulla/Work/current-go-duck-doc/Website && python3 -m http.server 8765
# then Playwright → go-duck-doc screenshots
```

---

## Phase E — Ship

- README: local source path, scripts, `npm run dev`  
- Vercel static `dist/`  
- Optional Cursor agents  
- Domain suggestion: `docs.goduck.dev`  

---

## Kickoff prompt

```text
Read /Users/abdulla/Work/go-duck-doc/Agent.md and execute it.

SOURCE: /Users/abdulla/Work/current-go-duck-doc/Website  (all *.html + logo assets)
PATTERN: /Users/abdulla/Work/crud-fordge-doc

1) Crawl every HTML file → research/SOURCE_NOTES.md
2) Scaffold Astro Starlight in go-duck-doc
3) CustomHero + InstallBar + brand.css (light/dark, wide splash)
4) Port all topics into Starlight IA
5) npm run build must pass

Start Phase 0 + A + B so http://127.0.0.1:4321 shows GO-DUCK landing today.
```

---

## Definition of done

- [ ] Every `Website/*.html` reflected in notes and a docs page (or explicit skip reason)  
- [ ] Logo from local `Website/logo.png` wired  
- [ ] `npm run dev` on `:4321` and `npm run build` green  
- [ ] Light / Dark / Auto work on splash  
- [ ] Install, CLI, GDL, gateway, Keycloak, Hybrid-Store documented from local HTML  
- [ ] README cites local source path (not only the live URL)  
- [ ] No invented flags/keys  

---

## Anti-patterns

- Preferring https://goduck.theheavenscode.com/ over newer local HTML  
- Tall portrait as `hero.image` → use CustomHero + terminal  
- Screenshots only under `src/assets/` with deep `../` → colocate under content  
- Forcing dark on all `[data-has-hero]` → breaks theme toggle  
- Copying “560% empire” fluff without technical substance  

---

**Source:** `/Users/abdulla/Work/current-go-duck-doc/Website`  
**Implement in:** `/Users/abdulla/Work/go-duck-doc`  
**UX pattern:** `/Users/abdulla/Work/crud-fordge-doc`
