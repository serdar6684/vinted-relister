// ============================================================================
// AUTHENTICATION & HEADERS
// ============================================================================
//
// Unlike Leboncoin, Vinted does not use a Bearer token in client-side calls.
// Auth is cookie-based (`_vinted_fr_session`, `v_sid`, etc.) attached
// automatically when fetch is called with `credentials: 'include'` from the
// MAIN world (which inherits the page's origin and cookie jar).
//
// What we DO need to supply explicitly: the CSRF token, exposed by Vinted
// as a meta tag in the HTML <head>: <meta name="csrf-token" content="...">.

import { CONFIG } from './config.js';

export const getCsrfToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  const token = meta?.getAttribute('content');

  if (!token) {
    throw new Error('CSRF token introuvable. Êtes-vous bien connecté à Vinted ?');
  }

  return token;
};

export const buildHeaders = (referer = CONFIG.referers.closet) => ({
  accept: CONFIG.headers.accept,
  'accept-language': CONFIG.headers.acceptLanguage,
  'content-type': CONFIG.headers.contentType,
  origin: CONFIG.headers.origin,
  referer,
  'x-csrf-token': getCsrfToken(),
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin'
});
