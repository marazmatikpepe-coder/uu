'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { IconButton } from '@/components/ui/IconButton';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const ext = languageToExtension(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-border bg-[#0d0d14]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-border">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{language}</span>
        <div className="flex gap-1">
          <IconButton icon="copy" label={copied ? 'Скопировано' : 'Копировать'} onClick={handleCopy} size={15} />
          <IconButton icon="downloadFile" label="Скачать" onClick={handleDownload} size={15} />
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{ margin: 0, background: 'transparent', fontSize: '0.85rem', padding: '1rem' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function languageToExtension(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    tsx: 'tsx',
    jsx: 'jsx',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    csharp: 'cs',
    php: 'php',
    sql: 'sql',
    json: 'json',
    yaml: 'yml',
    bash: 'sh',
    html: 'html',
    css: 'css',
  };
  return map[lang.toLowerCase()] ?? 'txt';
}
