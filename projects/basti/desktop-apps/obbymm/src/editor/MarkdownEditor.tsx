import type { VaultFile } from '../vault/vaultTypes';

interface MarkdownEditorProps {
  file: VaultFile;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ file, onChange }: MarkdownEditorProps) {
  return (
    <div className="markdown-editor">
      <textarea
        className="markdown-textarea"
        aria-label={`Edit ${file.name}`}
        placeholder="# Untitled"
        value={file.content}
        spellCheck
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
