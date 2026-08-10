package net.bastianklaus.keepinveverywhere.region;

/** Display metadata for a saved region (kept in regions/index.json). */
public record RegionMeta(String fileName, String displayName, long createdEpochMs,
                         int blockCount, int sizeX, int sizeY, int sizeZ) {
}
