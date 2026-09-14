const STORAGE_KEY = 'pizza:orderDraft';

/**
 * A client-side "ready for checkout" pizza configuration - either a
 * ready-made pizza or a validated custom build. Stored in sessionStorage
 * so it survives navigation to the review screen but not future prompts'
 * order-creation logic, which must treat it as untrusted input.
 */
export function saveOrderDraft(draft) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
}

export function loadOrderDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOrderDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}
