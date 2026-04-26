// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const escapeHtml = (text) => {
  const div = document.createElement('div');

  div.textContent = text;

  return div.innerHTML;
};

// Vinted item URLs look like /items/1234567890-some-slug
// or /items/1234567890. We just want the leading numeric id.
export const extractItemId = (url) => {
  const match = url?.match(/\/items\/(\d+)/);

  return match ? match[1] : null;
};

export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`${name}=([^;]+)`));

  return match ? match[1] : null;
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Sleep for a uniformly random duration in [minMs, maxMs].
// Used everywhere we want to look like a human instead of a script:
// before each API call, between workflow steps, between photo uploads.
export const humanDelay = (range) => {
  const [minMs, maxMs] = range;
  const ms = Math.floor(minMs + Math.random() * (maxMs - minMs));

  return delay(ms);
};

export const debounce = (func, wait) => {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
