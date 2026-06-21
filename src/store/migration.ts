// One-time localStorage key migration helper.
//
// Renames keys in localStorage from a legacy name to a new name.
// - If the old key has data AND the new key is empty, copies the value to the new key.
// - If the old key has data AND the new key already has data, only deletes the old key
//   (the new key wins — it might have been written by a newer build).
// - If the old key is missing, this is a no-op.
// - Safe when `localStorage` is unavailable (SSR, Safari private mode, etc.) — wraps in try/catch.
// - Idempotent — safe to call multiple times.
//
// Used by the store modules during the interview-trainer/* → smokyclaw/* rename
// (Phase 5 of the audit). After this migration runs once on a user's device,
// the old keys are gone and subsequent calls are no-ops.
export function migrateStorageKey(oldKey: string, newKey: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue === null) return;
    const newValue = localStorage.getItem(newKey);
    if (newValue === null) {
      localStorage.setItem(newKey, oldValue);
    }
    localStorage.removeItem(oldKey);
  } catch {
    // localStorage may throw (Safari private mode, quota, disabled cookies).
    // Silently ignore — the user simply starts from default state.
  }
}