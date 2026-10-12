import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: bold, italic, inline code, safe links.
 * Returns an array of ReactNodes without dangerouslySetInnerHTML.
 */
function parseInline(text: string): React.ReactNode[] {
  // Pattern matching:
  // [text](url)
  // **bold**
  // *italic*
  // `code`
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Link: [label](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const closingBracket = part.indexOf('](');
      const label = part.substring(1, closingBracket);
      const url = part.substring(closingBracket + 2, part.length - 1).trim();

      // Ensure protocol is safe
      const isSafeUrl =
        url.startsWith('/') ||
        url.startsWith('https://') ||
        url.startsWith('http://') ||
        url.startsWith('#');

      if (isSafeUrl) {
        const isExternal = url.startsWith('http');
        return (
          <a
            key={index}
            href={url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="editorial-link"
          >
            {label}
          </a>
        );
      }
      return <span key={index}>{label}</span>;
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    // Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return <code key={index} className="editorial-code">{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

/**
 * Minimal safe subset markdown renderer
 * Headings (#, ##, ###), Paragraphs, Blockquotes, Lists (ordered & unordered)
 * Pure React elements, 0% unsanitized HTML.
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into block sections separated by double newlines or consecutive list items
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let blockquoteLines: string[] = [];

  const flushList = () => {
    if (currentList) {
      const ListTag = currentList.type;
      elements.push(
        <ListTag key={`list-${elements.length}`} className="editorial-list">
          {currentList.items.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ListTag>
      );
      currentList = null;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="editorial-blockquote">
          {blockquoteLines.map((line, idx) => (
            <p key={idx}>{parseInline(line)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      flushBlockquote();
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushList();
      blockquoteLines.push(trimmed.replace(/^>\s*/, ''));
      continue;
    } else {
      flushBlockquote();
    }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.substring(2).trim();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch && olMatch[2] !== undefined) {
      const itemText = olMatch[2].trim();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Any other line flushes list
    flushList();

    // Headings (H1 reserved for page title, so map # to h3, ## to h4, ### to h5)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h-${elements.length}`} className="editorial-h4">
          {parseInline(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h-${elements.length}`} className="editorial-h3">
          {parseInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h-${elements.length}`} className="editorial-h3">
          {parseInline(trimmed.substring(2))}
        </h3>
      );
    } else {
      // Paragraph
      elements.push(
        <p key={`p-${elements.length}`} className="editorial-p">
          {parseInline(trimmed)}
        </p>
      );
    }
  }

  flushList();
  flushBlockquote();

  return <div className={`editorial-markdown ${className}`}>{elements}</div>;
};
