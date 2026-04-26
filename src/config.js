// ============================================================================
// CONFIGURATION
// ============================================================================
//
// Central source of truth for selectors, endpoints, delays and headers.
// API endpoints below are placeholders to be confirmed against a HAR capture
// of the official Vinted "create item" + "delete item" flows.

export const CONFIG = {
  version: process.env.VERSION,
  baseHost: 'https://www.vinted.fr',

  // Diagnostic logging. Enabled in dev builds (set to false before prod ship).
  debug: true,

  selectors: {
    // Dashboard URL: /member/{user_id} (the public profile, "Annonces" tab is
    // active by default and lists the seller's items). User id is numeric.
    dashboardPathPattern: /^\/member\/\d+\/?$/,

    // Item card containers in the dressing grid. Confirmed via diagnostic
    // run on /member/{id}: each card has data-testid="grid-item".
    itemContainer: '[data-testid="grid-item"]',
    itemLink: 'a[href*="/items/"]',

    // The official "Booster" CTA Vinted ships per card. We inject our
    // republish button right next to it (same actions row).
    // Vinted internally calls this "bump", not "booster".
    bumpButton: '[data-testid="bump-button"]',

    // Marker on the injected button itself, used to dedupe re-injections.
    republishButton: '[data-vrl-republish-btn]',

    // Outer dressing list. No reliable single testid wrapping all grid-items
    // on the public profile page, so the observer falls back to document.body.
    itemListContainer: '[data-testid="closet-grid"], [data-testid="item-grid"], [data-testid="profile-items"]'
  },

  delays: {
    // Static UI / DOM debounce delays
    buttonInjection: 500,
    pageReload: 3000,
    notificationFade: 6000,
    notificationError: 10000,
    fadeOut: 300,
    retryAttempts: [1000, 2000, 3000, 5000],

    // Anti-detection jitter ranges. All API-side delays MUST go through
    // utils.humanDelay(min, max) which sleeps a random duration in [min, max].
    // Rationale: Vinted's anti-bot stack (Datadome) flags request timings
    // that are too regular. Random jitter on each step makes the traffic
    // look closer to a human filling out the deposit form.
    humanBeforeRequest: [400, 1100],   // before any individual API call
    humanBetweenSteps: [800, 2000],    // between major workflow phases
    humanBetweenPhotoUploads: [600, 1400] // between consecutive photo uploads
  },

  api: {
    // To be validated from HAR. Vinted's public-ish API is /api/v2.
    base: 'https://www.vinted.fr/api/v2',
    item: (itemId) => `https://www.vinted.fr/api/v2/items/${itemId}`,
    itemCreate: 'https://www.vinted.fr/api/v2/items',
    itemDelete: (itemId) => `https://www.vinted.fr/api/v2/items/${itemId}`,
    photoUpload: 'https://www.vinted.fr/api/v2/photos'
  },

  headers: {
    accept: 'application/json, text/plain, */*',
    acceptLanguage: 'fr-FR,fr;q=0.9',
    contentType: 'application/json',
    origin: 'https://www.vinted.fr'
  },

  referers: {
    sell: 'https://www.vinted.fr/items/new',
    closet: 'https://www.vinted.fr/member/items/current'
  },

  // Fields that must NOT be carried over from the old item to the create
  // payload. To be expanded once the create payload schema is confirmed
  // from HAR (server-managed, immutable, or derived fields).
  readOnlyFields: [
    'id',
    'created_at',
    'updated_at',
    'view_count',
    'favourite_count',
    'user_id',
    'url',
    'photos'
  ]
};
