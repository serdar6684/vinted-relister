// ============================================================================
// VINTED RELISTER - Main Entry Point
// ============================================================================

import { CONFIG } from './config.js';
import { observeItemChanges, scheduleRetries } from './ui.js';

console.log('Vinted ReLister chargé', CONFIG.version);

const isDashboardPage = () =>
  window.location.pathname.startsWith(CONFIG.selectors.dashboardPath);

let isInitialized = false;

const initialize = () => {
  if (!isDashboardPage()) {
    return;
  }

  if (isInitialized) {
    return;
  }

  try {
    const start = () => {
      observeItemChanges();
      scheduleRetries();
      isInitialized = true;
      console.log('✓ Vinted ReLister prêt');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
  }
};

// SPA navigation: Vinted is a Next/React app, route changes don't reload.
window.addEventListener('popstate', () => {
  isInitialized = false;
  initialize();
});

const originalPushState = history.pushState;

history.pushState = function (...args) {
  originalPushState.apply(this, args);
  isInitialized = false;
  setTimeout(initialize, 100);
};

const originalReplaceState = history.replaceState;

history.replaceState = function (...args) {
  originalReplaceState.apply(this, args);
  isInitialized = false;
  setTimeout(initialize, 100);
};

initialize();
