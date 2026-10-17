export const DEFAULT_GARDEN_NAME = 'My Garden';
export const GARDEN_NAME_KEY = 'gardenName';
export const NAME_PROMPT_KEY = 'gardenNameAsked';
export function cleanGardenName(value: string) { return value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }
export function gardenLabel(value: string) { const name = cleanGardenName(value); return !name || /^my garden$/i.test(name) ? DEFAULT_GARDEN_NAME : `${name}'s garden`; }
export function readGardenName(search = '') {
  const fromUrl = cleanGardenName(new URLSearchParams(search).get('name') || '');
  if (fromUrl) { try { localStorage.setItem(GARDEN_NAME_KEY, fromUrl); } catch {} return fromUrl; }
  try { return cleanGardenName(localStorage.getItem(GARDEN_NAME_KEY) || '') || DEFAULT_GARDEN_NAME; } catch { return DEFAULT_GARDEN_NAME; }
}
export function writeGardenName(value: string) {
  const name = cleanGardenName(value) || DEFAULT_GARDEN_NAME;
  try { localStorage.setItem(GARDEN_NAME_KEY, name); localStorage.setItem(NAME_PROMPT_KEY, 'true'); return name; } catch { return null; }
}
