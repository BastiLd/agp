export function createMarkdownDocument(title: string): string {
  return `# ${title}\n\nStart writing here. Link notes with [[FileName]] or [[Folder/FileName]].\n`;
}

export function getMarkdownTitle(markdown: string, fallback: string): string {
  const firstHeading = markdown.match(/^#\s+(.+)$/m);
  return firstHeading?.[1]?.trim() || fallback.replace(/\.md$/i, '');
}
