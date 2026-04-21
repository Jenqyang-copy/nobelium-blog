# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Nobelium-based static blog: Next.js + Notion as CMS, styled with Tailwind, deployed on Vercel. Uses `pnpm` (see `pnpm-lock.yaml`, `.npmrc`) and Node 18.

## Commands

```bash
pnpm install          # install deps (patches react-notion-x and notion-utils; see patches/)
pnpm dev              # next dev — local development
pnpm build            # next build; postbuild runs next-sitemap
pnpm start            # next start — run production build
pnpm lint             # next lint (eslint-config-next)
pnpm format           # prettier --write .
pnpm format:check     # prettier --check .
```

Required env var: `NOTION_PAGE_ID` (the 32-char id of a public Notion database page). Optional: `NOTION_ACCESS_TOKEN` (for private databases — tokens expire every 180 days). `VERCEL_ENV=production` gates `BLOG.isProd`.

## Architecture

**Data flow (Notion → page):**
1. `lib/server/notion-api.js` wraps `notion-client` to fetch from Notion.
2. `lib/notion/getAllPosts.js` pulls the collection at `NOTION_PAGE_ID`, iterates pages, hydrates each via `getPageProperties.js`, attaches `fullWidth` + unix `date`, filters via `filterPublishedPosts.js` (status/type/publish date), and optionally sorts by date (`BLOG.sortByDate`).
3. `lib/notion/getPostBlocks.js` fetches the Notion block tree (`recordMap`) for a single post; rendered client-side by `components/NotionRenderer.js` (react-notion-x).
4. `lib/notion` barrel is re-exported from `lib/notion.js`.

**Routing (`pages/`):**
- `index.js` — home list (first page), uses `BLOG.postsPerPage`.
- `page/[page].js` — paginated list.
- `tag/[tag].js` + `tag/[tag]/page/[page].js` — tag-filtered lists.
- `[slug].js` — post detail. `getStaticPaths` enumerates all slugs (with `includePages: true`), `getStaticProps` returns `{ post, blockMap, emailHash }` with `revalidate: 1` (ISR).
- `search.js` — client-side search layout.
- `feed.js` — invokes `lib/rss.js` during build to emit `public/feed.xml`.
- `api/config.js` — exposes runtime config.

**Config split (important):**
- `blog.config.js` is CommonJS (`module.exports = BLOG`) so it can be `require`d from Node build scripts.
- `lib/server/config.js` reads `blog.config.js` from disk and `eval`s it — this is the server-side entry. Exports `{ config, clientConfig }`.
- `lib/config.js` is the client-side React context (`ConfigProvider` / `useConfig`). The provider is wired in `pages/_app.js` with `clientConfig` as the value.
- When editing config, update `blog.config.js`; don't introduce ES module syntax there.

**Path alias:** `@/*` maps to repo root (see `jsconfig.json`) — e.g. `@/lib/notion`, `@/components/Post`, `@/lib/server/config`.

**Layouts & components:** `layouts/search.js` is the only layout file; most "layout" logic lives in `components/Container.js` (head tags, Header/Footer wrapper, SEO). Theme (light/dark/auto) handled in `lib/theme.js`; i18n strings in `lib/locale.js` keyed by `BLOG.lang`.

**Patches:** `patches/react-notion-x@6.16.0.patch` and `patches/notion-utils@6.16.0.patch` are applied via pnpm's `patchedDependencies`. If those packages are upgraded, the patches must be regenerated or removed.

**Analytics/comments** are pluggable via `BLOG.analytics.provider` (`ga` | `ackee`) and `BLOG.comment.provider` (`gitalk` | `utterances` | `cusdis`); empty string disables. Vercel Analytics is always enabled via `@vercel/analytics` in `pages/_app.js`.
