// ============================================================================
// UI & DOM MANAGEMENT
// ============================================================================

import { debounce, extractItemId } from './utils.js';
import { NotificationManager } from './notifications.js';
import { republishItem } from './api.js';
import { CONFIG } from './config.js';

// ============================================================================
// USER INTERACTION
// ============================================================================

const promptForNewPrice = (currentPrice) => {
  const pricePrompt = `Prix actuel: ${currentPrice} €\n\nEntrez le nouveau prix (en euros) ou laissez vide pour garder le prix actuel:`;
  const input = prompt(pricePrompt, currentPrice);

  if (input === null) {
    return null;
  }

  if (input.trim() === '') {
    return currentPrice;
  }

  const newPrice = parseFloat(input.trim().replace(',', '.'));

  if (isNaN(newPrice) || newPrice <= 0) {
    throw new Error('Prix invalide. Veuillez entrer un nombre positif.');
  }

  return newPrice;
};

const confirmRepublish = (itemId, price) => confirm(
  '✅ Prêt à republier:\n\n' +
    `📋 Article #${itemId}\n` +
    `💰 ${price} €\n\n` +
    'Lancer la republication automatique?'
);

// ============================================================================
// REPUBLISH WORKFLOW
// ============================================================================

const handleRepublishClick = async (itemId) => {
  console.log(`Republication de l'article ${itemId}...`);

  let newPrice;

  try {
    newPrice = promptForNewPrice('?'); // current price unknown until fetch
  } catch (priceError) {
    NotificationManager.show(NotificationManager.error(priceError.message));

    return;
  }

  if (newPrice === null) {
    return;
  }

  if (!confirmRepublish(itemId, newPrice)) {
    return;
  }

  const loadingNotif = NotificationManager.show(
    NotificationManager.loading('Récupération de l\'article...')
  );

  try {
    const onPhotoProgress = (current, total) => {
      NotificationManager.remove('vrl-loading');
      NotificationManager.remove('vrl-uploading');
      NotificationManager.show(NotificationManager.uploading(current, total));
    };

    const newId = await republishItem(itemId, newPrice, onPhotoProgress);

    NotificationManager.removeMultiple('vrl-loading', 'vrl-uploading', 'vrl-publishing', 'vrl-deleting');

    const successNotif = NotificationManager.show(NotificationManager.success(newId));

    NotificationManager.fadeOut(successNotif, CONFIG.delays.notificationFade);
  } catch (error) {
    console.error('Erreur de republication:', error);
    NotificationManager.removeMultiple('vrl-loading', 'vrl-uploading', 'vrl-publishing', 'vrl-deleting');

    const errorNotif = NotificationManager.show(NotificationManager.error(error.message));

    setTimeout(() => errorNotif.remove(), CONFIG.delays.notificationError);

    loadingNotif?.remove();
  }
};

// ============================================================================
// BUTTON INJECTION
// ============================================================================

// Two visual modes depending on where we end up injecting:
//  - "inline": next to the official "Booster" button, full-width like a sibling action
//  - "overlay": absolute overlay top-left of the item photo (fallback when actions row is missing)
const createRepublishButton = (itemId, mode) => {
  const button = document.createElement('button');

  button.setAttribute('data-vrl-republish-btn', itemId);
  button.type = 'button';
  button.title = 'Republier cet article';
  button.textContent = '✨ Republier';

  const baseStyle = `
    background: linear-gradient(135deg, #09b1ba 0%, #0891a8 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  `;

  if (mode === 'inline') {
    button.style.cssText = `${baseStyle}
      width: 100%;
      padding: 8px 12px;
      font-size: 13px;
      margin-top: 6px;
    `;
  } else {
    button.style.cssText = `${baseStyle}
      padding: 6px 10px;
      font-size: 12px;
    `;
  }

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleRepublishClick(itemId);
  });

  if (mode === 'inline') {
    return button;
  }

  const overlay = document.createElement('div');

  overlay.style.cssText = 'position: absolute; top: 8px; left: 8px; z-index: 10;';
  overlay.appendChild(button);

  return overlay;
};

const findInjectionTarget = (itemElement) => {
  if (itemElement.querySelector(CONFIG.selectors.republishButton)) {
    return null;
  }

  const link = itemElement.querySelector(CONFIG.selectors.itemLink);
  const itemId = extractItemId(link?.getAttribute('href'));

  if (!itemId) {
    return null;
  }

  // Strategy 1: sibling of the official Bump (Booster) button — same row.
  const bumpButton = itemElement.querySelector(CONFIG.selectors.bumpButton);

  if (bumpButton?.parentElement) {
    return { itemId, target: bumpButton.parentElement, mode: 'inline' };
  }

  // Strategy 2: fallback to absolute overlay on the card itself.
  return { itemId, target: itemElement, mode: 'overlay' };
};

export const injectRepublishButtons = () => {
  try {
    const items = document.querySelectorAll(CONFIG.selectors.itemContainer);
    let injectedCount = 0;

    items.forEach((item) => {
      const result = findInjectionTarget(item);

      if (!result) {
        return;
      }

      const { itemId, target, mode } = result;
      const button = createRepublishButton(itemId, mode);

      if (mode === 'overlay') {
        const computed = getComputedStyle(target);

        if (computed.position === 'static') {
          target.style.position = 'relative';
        }
      }

      target.appendChild(button);
      injectedCount++;
    });

    if (injectedCount > 0) {
      console.log(`✓ ${injectedCount} boutons injectés sur ${items.length} articles`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'injection des boutons:', error);
  }
};

// ============================================================================
// DOM OBSERVER
// ============================================================================

const debouncedInject = debounce(injectRepublishButtons, CONFIG.delays.buttonInjection);

const hasItemContainerChanges = (mutations) => mutations.some((mutation) =>
  Array.from(mutation.addedNodes).some((node) => {
    if (node.nodeType !== 1) {
      return false;
    }

    return node.matches?.(CONFIG.selectors.itemContainer) ||
      node.querySelector?.(CONFIG.selectors.itemContainer);
  })
);

export const observeItemChanges = () => {
  const observer = new MutationObserver((mutations) => {
    if (hasItemContainerChanges(mutations)) {
      debouncedInject();
    }
  });

  const list = document.querySelector(CONFIG.selectors.itemListContainer);
  const target = list || document.body;

  observer.observe(target, { childList: true, subtree: true });
  console.log(`Observer attaché à: ${list ? 'item-list-container' : 'document.body'}`);
};

export const scheduleRetries = () => {
  CONFIG.delays.retryAttempts.forEach((d) => {
    setTimeout(injectRepublishButtons, d);
  });

  if (CONFIG.debug) {
    setTimeout(diagnoseDressing, 3500);
  }
};

// ============================================================================
// DEBUG / DIAGNOSTICS
// ============================================================================
//
// Dumps to console enough info to figure out which selectors Vinted is using
// for the current build. Activated by CONFIG.debug. Safe to leave in dev,
// must be off in production.

let diagnoseHasRun = false;

const diagnoseDressing = () => {
  if (diagnoseHasRun) {
    return;
  }
  diagnoseHasRun = true;

  const log = (msg) => console.log(`[VRL diag] ${msg}`);

  log('=== dressing DOM diagnostics ===');

  // 1. Count candidates for each selector currently in CONFIG.
  log(`itemContainer    matches: ${document.querySelectorAll(CONFIG.selectors.itemContainer).length}`);
  log(`itemLink         matches: ${document.querySelectorAll(CONFIG.selectors.itemLink).length}`);
  log(`actionsContainer matches: ${document.querySelectorAll(CONFIG.selectors.actionsContainer).length}`);
  log(`itemListContainer matches: ${document.querySelectorAll(CONFIG.selectors.itemListContainer).length}`);

  // 2. Top data-testid values present on the page (best signal for Vinted).
  const testidCounts = new Map();
  const all = document.querySelectorAll('[data-testid]');

  all.forEach((el) => {
    const id = el.getAttribute('data-testid');

    testidCounts.set(id, (testidCounts.get(id) ?? 0) + 1);
  });

  const sortedTestids = Array.from(testidCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  log(`Total [data-testid] elements: ${all.length}`);
  log('Top 30 data-testid values:');
  sortedTestids.forEach(([id, count]) => log(`  ${count}x ${id}`));

  // 3. Walk up from the first /items/ link to find its real card container.
  const firstItemLink = document.querySelector('a[href*="/items/"]');

  if (firstItemLink) {
    log(`First /items/ link href: ${firstItemLink.getAttribute('href')}`);
    let node = firstItemLink;

    for (let i = 0; i < 8 && node; i++) {
      const tag = node.tagName?.toLowerCase();
      const tid = node.getAttribute?.('data-testid');
      const cls = (node.className && typeof node.className === 'string')
        ? node.className.slice(0, 80)
        : '';

      log(`  ancestor[${i}] ${tag}${tid ? `[data-testid="${tid}"]` : ''}${cls ? ` class="${cls}"` : ''}`);
      node = node.parentElement;
    }
  } else {
    log('NO <a href*="/items/"> found on page — items not rendered yet or different markup.');
  }

  log('=== end ===');
};
