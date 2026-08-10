/**
 * Utilities for indexing and resolving local files selected by the user.
 */

// Global object URL cache to prevent memory leaks by reusing URLs and revoking them if needed.
const objectUrlCache = new Map<string, string>();

/**
 * Normalizes file paths for consistent index matching.
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase().trim();
}

/**
 * Gets a clean filename from a path or URL.
 */
export function getFilename(path: string): string {
  try {
    const decodeUrl = decodeURIComponent(path);
    const parts = decodeUrl.split('/');
    return parts[parts.length - 1] || '';
  } catch {
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  }
}

/**
 * Builds an index of files. For folder inputs, we store:
 * 1. The filename itself (e.g., "my_photo.png")
 * 2. The normalized relative path suffix (e.g., "messages/general/media/my_photo.png")
 */
export function buildAssetMap(files: FileList | File[]): Record<string, File> {
  const map: Record<string, File> = {};

  const fileArray = Array.isArray(files) ? files : Array.from(files);

  for (const file of fileArray) {
    const name = file.name.toLowerCase();
    const relPath = file.webkitRelativePath ? normalizePath(file.webkitRelativePath) : '';

    // Index by relative path if available
    if (relPath) {
      map[relPath] = file;
      
      // Also index by parts of the path, e.g. "general/media/photo.png"
      const pathParts = relPath.split('/');
      if (pathParts.length >= 3) {
        // e.g. channelname/media/filename
        const channelSuffix = pathParts.slice(-3).join('/');
        map[channelSuffix] = file;
      }
      if (pathParts.length >= 2) {
        // e.g. media/filename or channelname/filename
        const simpleSuffix = pathParts.slice(-2).join('/');
        map[simpleSuffix] = file;
      }
    }

    // Default fallback index by name (may overwrite if duplicates, but acts as final resort)
    map[name] = file;
  }

  return map;
}

/**
 * Attempts to resolve an attachment or image URL to a local object URL.
 * If not found locally, returns the original web URL.
 */
export function resolveLocalAsset(
  fileName: string,
  attachmentUrl: string | null,
  channelName: string | null,
  assetMap: Record<string, File>
): string | null {
  if (!fileName && !attachmentUrl) return null;

  const targetName = (fileName || getFilename(attachmentUrl || '')).toLowerCase();
  if (!targetName) return attachmentUrl;

  // Let's check keys in our map.
  // 1. Exact match by filename
  if (assetMap[targetName]) {
    return getOrCreateObjectURL(assetMap[targetName]);
  }

  // 2. Match using channel folder suffix (e.g., "general/media/my_photo.png" or "general/my_photo.png")
  if (channelName) {
    const cleanChannel = channelName.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const suffixes = [
      `${cleanChannel}/${targetName}`,
      `${cleanChannel}/media/${targetName}`,
      `${cleanChannel}/attachments/${targetName}`,
    ];

    for (const suffix of suffixes) {
      // Find any key that ends with this suffix
      const matchingKey = Object.keys(assetMap).find(key => key.endsWith(suffix));
      if (matchingKey && assetMap[matchingKey]) {
        return getOrCreateObjectURL(assetMap[matchingKey]);
      }
    }
  }

  // 3. Fallback: Search all keys in assetMap to see if any key ends with "/" + targetName
  const suffixMatchKey = Object.keys(assetMap).find(key => key.endsWith('/' + targetName));
  if (suffixMatchKey && assetMap[suffixMatchKey]) {
    return getOrCreateObjectURL(assetMap[suffixMatchKey]);
  }

  // If not found in our asset map, return the remote URL (might fail offline but serves as fallback)
  return attachmentUrl;
}

/**
 * Creates or retrieves a cached Object URL for a given File to prevent memory leaks.
 */
function getOrCreateObjectURL(file: File): string {
  // Use a combination of name, size, and last modified as a unique cache key
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
  
  if (objectUrlCache.has(cacheKey)) {
    return objectUrlCache.get(cacheKey)!;
  }

  const url = URL.createObjectURL(file);
  objectUrlCache.set(cacheKey, url);
  return url;
}

/**
 * Revokes all cached Object URLs. Call this when unloading an archive to free memory.
 */
export function clearObjectURLs(): void {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  objectUrlCache.clear();
}

/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
