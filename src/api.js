// ============================================================================
// API FUNCTIONS
// ============================================================================
//
// Skeleton of the republish workflow against the Vinted API.
//
// !! TO BE FINALIZED FROM A REAL HAR CAPTURE !!
//
// The endpoints, payload shapes, and exact header set used here are best-
// effort placeholders. They MUST be cross-checked against a fresh HAR of:
//   1. GET item details
//   2. POST a new item (with photo upload)
//   3. DELETE an existing item
// before the click-handler in ui.js is wired to call createAdViaAPI/deleteAd.

import { buildHeaders } from './auth.js';
import { humanDelay } from './utils.js';
import { CONFIG } from './config.js';

const handleApiResponse = async (response, action) => {
  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Erreur ${action}: ${response.status} ${errorText}`);
  }

  return response;
};

// ============================================================================
// FETCH ITEM
// ============================================================================

export const fetchItem = async (itemId) => {
  console.log(`Récupération de l'article ${itemId}...`);
  await humanDelay(CONFIG.delays.humanBeforeRequest);

  const response = await fetch(CONFIG.api.item(itemId), {
    method: 'GET',
    headers: buildHeaders(CONFIG.referers.closet),
    credentials: 'include'
  });

  await handleApiResponse(response, 'fetchItem');
  const data = await response.json();

  console.log('✓ Article récupéré');

  return data.item ?? data;
};

// ============================================================================
// PHOTO UPLOAD
// ============================================================================
//
// Vinted's photo upload endpoint expects a multipart body with the binary file.
// The exact field name(s) and any companion fields (e.g. "type", "temp_uuid")
// must be confirmed from HAR. This shape is the most common Rails-style form.

export const uploadPhotoFromUrl = async (sourceUrl) => {
  await humanDelay(CONFIG.delays.humanBeforeRequest);

  // 1. Fetch the original photo bytes from the Vinted CDN.
  //    May fail with CORS — fallback (canvas / image proxy) to be added if needed.
  const photoResp = await fetch(sourceUrl, { credentials: 'include' });

  if (!photoResp.ok) {
    throw new Error(`Impossible de récupérer la photo source: ${photoResp.status}`);
  }
  const blob = await photoResp.blob();

  // 2. Upload bytes to Vinted as a fresh photo, get back a temp uuid we can
  //    reference in the create-item payload.
  const formData = new FormData();

  formData.append('file', blob, 'photo.jpg');

  const uploadHeaders = buildHeaders(CONFIG.referers.sell);

  // multipart boundary must be set by the browser — strip JSON content-type
  delete uploadHeaders['content-type'];

  const response = await fetch(CONFIG.api.photoUpload, {
    method: 'POST',
    headers: uploadHeaders,
    credentials: 'include',
    body: formData
  });

  await handleApiResponse(response, 'uploadPhoto');
  const data = await response.json();

  // The exact response shape is API-version-dependent. Common keys: temp_uuid, id.
  return data.temp_uuid ?? data.photo?.temp_uuid ?? data.id;
};

// ============================================================================
// CREATE ITEM
// ============================================================================

export const cleanCreatePayload = (item, newPrice, photoTempUuids) => {
  const payload = { ...item };

  CONFIG.readOnlyFields.forEach((field) => delete payload[field]);

  if (typeof newPrice === 'number') {
    payload.price = newPrice;
  }
  payload.photos = photoTempUuids;

  return { item: payload };
};

export const createItem = async (item, newPrice, photoTempUuids) => {
  console.log('Création du nouvel article...');
  await humanDelay(CONFIG.delays.humanBetweenSteps);

  const body = cleanCreatePayload(item, newPrice, photoTempUuids);
  const response = await fetch(CONFIG.api.itemCreate, {
    method: 'POST',
    headers: buildHeaders(CONFIG.referers.sell),
    credentials: 'include',
    body: JSON.stringify(body)
  });

  await handleApiResponse(response, 'createItem');
  const data = await response.json();

  console.log('✓ Article créé');

  return data.item?.id ?? data.id;
};

// ============================================================================
// DELETE ITEM
// ============================================================================

export const deleteItem = async (itemId) => {
  console.log(`Suppression de l'article ${itemId}...`);
  await humanDelay(CONFIG.delays.humanBetweenSteps);

  const response = await fetch(CONFIG.api.itemDelete(itemId), {
    method: 'DELETE',
    headers: buildHeaders(CONFIG.referers.closet),
    credentials: 'include'
  });

  await handleApiResponse(response, 'deleteItem');
  console.log('✓ Article supprimé');
};

// ============================================================================
// FULL REPUBLISH WORKFLOW
// ============================================================================

export const republishItem = async (itemId, newPrice, onPhotoProgress) => {
  const original = await fetchItem(itemId);
  const photos = original.photos ?? [];
  const tempUuids = [];

  for (let i = 0; i < photos.length; i++) {
    const url = photos[i].full_size_url ?? photos[i].url;

    onPhotoProgress?.(i + 1, photos.length);
    const uuid = await uploadPhotoFromUrl(url);

    tempUuids.push(uuid);
    await humanDelay(CONFIG.delays.humanBetweenPhotoUploads);
  }

  const newId = await createItem(original, newPrice, tempUuids);

  await deleteItem(itemId);

  return newId;
};
