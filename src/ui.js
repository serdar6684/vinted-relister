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

const createRepublishButton = (itemId) => {
  const wrapper = document.createElement('div');

  wrapper.style.cssText = 'position: absolute; top: 8px; left: 8px; z-index: 10;';

  const button = document.createElement('button');

  button.setAttribute('data-vrl-republish-btn', itemId);
  button.type = 'button';
  button.title = 'Republier cet article';
  button.textContent = '✨ Republier';
  button.style.cssText = `
    background: linear-gradient(135deg, #09b1ba 0%, #0891a8 100%);
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  `;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleRepublishClick(itemId);
  });

  wrapper.appendChild(button);

  return wrapper;
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

  // Inject onto the closest positioned ancestor inside the card so the absolute
  // overlay sits over the photo. The card root is usually positioned relative.
  const overlay = itemElement.querySelector(CONFIG.selectors.actionsContainer)
    ?? itemElement;

  return { itemId, target: overlay };
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

      const { itemId, target } = result;
      const button = createRepublishButton(itemId);

      // Ensure target is positioned so absolute child anchors correctly
      const computed = getComputedStyle(target);

      if (computed.position === 'static') {
        target.style.position = 'relative';
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
};
