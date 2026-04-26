# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chrome extension (Manifest V3) that adds a "Republish" button to a user's Vinted dressing (`/member/items/current`) and re-creates each item via the Vinted public API. Sister project of `lbc-relister` (same architectural pattern).

V1 scope: `vinted.fr` only.

## Commands

```bash
npm install         # Install build deps (rollup, eslint, etc.)
npm run build       # Production build → dist/ (terser, drop_console)
npm run build:dev   # Dev build (no minification)
npm run dev         # Rollup watch
npm run package     # zip dist → extension.zip (Web Store upload)
npm run lint        # ESLint over src/**/*.js
npm run lint:fix    # ESLint --fix
```

Loading in Chrome (dev): build, then `chrome://extensions` → "Load unpacked" → select the **repo root** (root manifest references `dist/main.js`). The build also emits a path-stripped copy of `manifest.json` into `dist/` for zipping.

## Architecture

Single content script (`src/main.js`) injected at `document_start` in the **MAIN world** so it shares cookies and the page's JS context with Vinted's SPA. Same SPA-navigation handling as `lbc-relister`: wraps `history.pushState`/`replaceState` and listens for `popstate`.

Module layout (`src/`):

- `main.js` — entry, dashboard detection, SPA hooks
- `ui.js` — `MutationObserver` over the dressing grid, button injection per item card, click handler driving the republish workflow
- `api.js` — full republish workflow: GET item → upload each photo (multipart) → POST new item → DELETE old item
- `auth.js` — reads CSRF token from `<meta name="csrf-token">`. **No bearer token** (Vinted is cookie-session based, attached automatically when fetching with `credentials: 'include'` from MAIN world)
- `config.js` — single source of truth for selectors, endpoints, delays, headers, `readOnlyFields`. Edit this first when Vinted changes the DOM or API
- `utils.js` — `extractItemId`, `getCookie`, `delay`, `humanDelay`, `debounce`
- `notifications.js` — toast UI built with DOM API (no `innerHTML`)

## Anti-detection (CRITICAL)

Vinted uses Datadome and other bot-detection layers. Several free relisters in the past got users banned. **All API-side delays must go through `humanDelay(range)` from `utils.js`**, which sleeps a uniformly random duration in `[min, max]` ms.

Rules:

- **Never** make two API calls back-to-back without a `humanDelay`. Use `CONFIG.delays.humanBeforeRequest` before each individual request, `humanBetweenSteps` between major workflow phases (fetch → upload → create → delete), and `humanBetweenPhotoUploads` between consecutive photo uploads.
- **Never** lower the jitter ranges in `config.js` "to make it faster". The whole point is variance.
- **Stay in MAIN world** (`manifest.json` `world: "MAIN"`). Switching to `ISOLATED` would break cookie auth and lose the page's runtime fingerprint, both of which Datadome correlates.
- **Always send `credentials: 'include'`** so the session/Datadome cookies follow.
- **Always supply `referer`** matching the human flow (`/items/new` for create/upload, `/member/items/current` for fetch/delete) — Vinted's edge logs request origin patterns.
- When introducing a new request type, capture it from the live UI first (DevTools → HAR) and mirror its headers exactly. Don't invent header values.

If a feature requires a tight loop (rare), discuss it with the user first.

## API integration status

The `src/api.js` file is a **scaffold** with placeholder endpoints and payload shapes inferred from public knowledge of Vinted's API. They MUST be confirmed against a real HAR capture before relying on them in production. Concretely, validate against HAR:

- `GET /api/v2/items/{id}` — exact response shape, especially the `photos[]` schema (`full_size_url` vs `url`)
- `POST /api/v2/photos` — multipart field name (`file`?), companion fields, response shape (`temp_uuid` vs `id`)
- `POST /api/v2/items` — payload root (`{ item: {...} }` vs flat), required fields, full `readOnlyFields` list
- `DELETE /api/v2/items/{id}` — confirm 204 response and any required body

The user captures the HAR by going through the live "Vendre" flow in DevTools (Network tab, Preserve log). HAR files are gitignored (`*.har`, `.har/`).

## DOM selectors

Vinted uses hashed CSS class names (`web_ui__ItemBox__container` etc.) which break across deploys. The selectors in `CONFIG.selectors` deliberately prefer `data-testid` attributes when available. If button injection stops working after a Vinted UI update, check there first.

## Conventions

- ESLint config (`.eslintrc.json`) is strict: 2-space indent, single quotes, no trailing commas, blank line before `return` and after `const`/`let` declaration blocks. `npm run lint` must pass.
- User-facing strings in **French**; module headers and identifiers in **English**.
- No Sentry / external logging in V1 (intentional, may revisit opt-in later).
- No background service worker. Static popup only.

## Don'ts

- Don't add npm deps casually — extension bundle size matters.
- Don't introduce auto-refresh of the dashboard; sister project (`lbc-relister`) explicitly removed it. User reloads manually after a successful republish.
- Don't hardcode an item-create payload from a single HAR; Vinted varies it by category. Strip server-managed fields via `CONFIG.readOnlyFields` and pass the rest through.
- Don't disable `humanDelay` calls "for testing". Use a feature flag in `config.js` if you really need a fast path during dev.
