export function hasFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function openNativeVault(): Promise<void> {
  throw new Error('Native folder vaults are planned after the MVP browser slice.');
}
