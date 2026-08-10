package net.bastianklaus.keepinveverywhere.data;

/**
 * Lightweight display metadata for a saved slot (kept in slots/index.json).
 * {@code fileName} is the sanitized on-disk file stem; {@code displayName} is what the user typed.
 */
public record SlotMeta(String fileName, String displayName, long createdEpochMs, int itemCount) {
}
