// ============================================================================
// NOTIFICATION MANAGER
// ============================================================================

import { CONFIG } from './config.js';
import iconImage from '../icons/icon-48.png';

const buildBaseStyles = (borderColor, color) => `
  position: fixed;
  top: 20px;
  right: 20px;
  background: #1f2937;
  color: ${color || '#e4e4e7'};
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
  border-left: 3px solid ${borderColor || '#6b7280'};
  max-width: 320px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const createIconNode = () => {
  const img = document.createElement('img');

  img.src = iconImage;
  img.width = 20;
  img.height = 20;
  img.alt = 'VRL';
  img.style.cssText = 'flex-shrink: 0; margin-top: 1px; border-radius: 4px;';

  return img;
};

const createTextBody = (text) => {
  const body = document.createElement('div');

  body.style.flex = '1';
  body.textContent = text;

  return body;
};

const createTitledBody = (title, detail) => {
  const wrapper = document.createElement('div');

  wrapper.style.flex = '1';

  const titleNode = document.createElement('div');

  titleNode.style.cssText = 'font-weight: 600; margin-bottom: 6px;';
  titleNode.textContent = title;

  const detailNode = document.createElement('div');

  detailNode.style.cssText = 'font-size: 12px; color: #a1a1aa;';
  detailNode.textContent = detail;

  wrapper.appendChild(titleNode);
  wrapper.appendChild(detailNode);

  return wrapper;
};

const createBase = ({ id, borderColor, color }, bodyNode) => {
  const notification = document.createElement('div');

  notification.id = id;
  notification.style.cssText = buildBaseStyles(borderColor, color);
  notification.appendChild(createIconNode());
  notification.appendChild(bodyNode);

  return notification;
};

export const NotificationManager = {
  show(notification) {
    document.body.appendChild(notification);

    return notification;
  },

  remove(id) {
    const notification = document.getElementById(id);

    notification?.remove();
  },

  removeMultiple(...ids) {
    ids.forEach(id => this.remove(id));
  },

  fadeOut(element, delayMs) {
    setTimeout(() => {
      element.style.transition = 'opacity 0.3s';
      element.style.opacity = '0';
      setTimeout(() => element.remove(), CONFIG.delays.fadeOut);
    }, delayMs);
  },

  loading(message = 'Chargement...') {
    return createBase(
      { id: 'vrl-loading', borderColor: '#09b1ba' },
      createTextBody(message)
    );
  },

  uploading(current, total) {
    return createBase(
      { id: 'vrl-uploading', borderColor: '#09b1ba' },
      createTextBody(`Upload des photos (${current}/${total})...`)
    );
  },

  publishing() {
    return createBase(
      { id: 'vrl-publishing', borderColor: '#0891a8' },
      createTextBody('Publication du nouvel article...')
    );
  },

  deleting() {
    return createBase(
      { id: 'vrl-deleting', borderColor: '#0891a8' },
      createTextBody('Suppression de l\'ancien article...')
    );
  },

  success(itemId) {
    return createBase(
      { id: 'vrl-success', borderColor: '#10b981' },
      createTitledBody(
        'Republication réussie',
        `Article #${itemId} créé avec succès, rafraîchissez la page.`
      )
    );
  },

  error(message) {
    return createBase(
      { id: 'vrl-error', borderColor: '#ef4444' },
      createTitledBody('Erreur', message)
    );
  }
};
