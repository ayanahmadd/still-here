export type GardenContact = { name: string; phone: string };
export const CONTACT_KEY = 'memory-garden-contact-v1';

export function normalisePhone(phone: string): string | null {
  const clean = phone.trim();
  if (!/^\+?[\d\s().-]+$/.test(clean)) return null;
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return (clean.startsWith('+') ? '+' : '') + digits;
}

export function readContact(): GardenContact | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) || 'null');
    if (typeof saved?.name !== 'string' || !saved.name.trim() || saved.name.length > 40 || typeof saved.phone !== 'string') return null;
    const phone = normalisePhone(saved.phone);
    return phone ? { name: saved.name.trim(), phone } : null;
  } catch { return null; }
}

export function writeContact(contact: GardenContact | null): boolean {
  try {
    if (!contact) localStorage.removeItem(CONTACT_KEY);
    else {
      const phone = normalisePhone(contact.phone);
      if (!phone || !contact.name.trim() || contact.name.length > 40) return false;
      localStorage.setItem(CONTACT_KEY, JSON.stringify({ name: contact.name.trim(), phone }));
    }
    return true;
  } catch { return false; }
}
