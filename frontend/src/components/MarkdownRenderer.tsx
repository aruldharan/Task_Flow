import { useMemo } from "react";

const RULES: [RegExp, (match: RegExpMatchArray, key: number) => JSX.Element][] = [
  // Horizontal rule
  [/^---$/gm, (_m, k) => <hr key={k} className="my-3 border-border" />],
  // Headers
  [/^### (.+)$/gm, (m, k) => <h3 key={k} className="text-sm font-bold mt-3 mb-1">{m[1]}</h3>],
  [/^## (.+)$/gm, (m, k) => <h2 key={k} className="text-base font-bold mt-3 mb-1">{m[1]}</h2>],
  [/^# (.+)$/gm, (m, k) => <h1 key={k} className="text-lg font-bold mt-3 mb-1">{m[1]}</h1>],
];

const renderInline = (text: string): (string | JSX.Element)[] => {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let keyCounter = 0;

  // Process inline patterns
  const patterns: [RegExp, (match: RegExpMatchArray) => JSX.Element][] = [
    [/\*\*(.+?)\*\*/g, (m) => <strong key={`b${keyCounter++}`} className="font-bold">{m[1]}</strong>],
    [/_(.+?)_/g, (m) => <em key={`i${keyCounter++}`} className="italic">{m[1]}</em>],
    [/`(.+?)`/g, (m) => <code key={`c${keyCounter++}`} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{m[1]}</code>],
    [/\[(.+?)\]\((.+?)\)/g, (m) => <a key={`l${keyCounter++}`} href={m[2]} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">{m[1]}</a>],
  ];

  // Simple sequential replacement
  let result = remaining;
  const elements: JSX.Element[] = [];
  
  // For simplicity, return the text with basic replacements
  for (const [pattern, renderer] of patterns) {
    result = result.replace(pattern, (...args) => {
      const el = renderer(args as any);
      const placeholder = `__MD_${elements.length}__`;
      elements.push(el);
      return placeholder;
    });
  }

  // Split by placeholders and interleave
  const finalParts = result.split(/(__MD_\d+__)/);
  return finalParts.map((part, i) => {
    const match = part.match(/^__MD_(\d+)__$/);
    if (match) return elements[parseInt(match[1])];
    return part;
  });
};

interface Props {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className }: Props) => {
  const rendered = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let key = 0;
    let inList = false;
    let listItems: JSX.Element[] = [];
    let listType: "ul" | "ol" = "ul";

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === "ul") {
          elements.push(<ul key={`list${key++}`} className="list-disc list-inside space-y-0.5 my-1 text-sm">{listItems}</ul>);
        } else {
          elements.push(<ol key={`list${key++}`} className="list-decimal list-inside space-y-0.5 my-1 text-sm">{listItems}</ol>);
        }
        listItems = [];
        inList = false;
      }
    };

    for (const line of lines) {
      // Horizontal rule
      if (/^---$/.test(line.trim())) {
        flushList();
        elements.push(<hr key={key++} className="my-3 border-border" />);
        continue;
      }

      // Headers
      const h3 = line.match(/^### (.+)$/);
      if (h3) { flushList(); elements.push(<h3 key={key++} className="text-sm font-bold mt-3 mb-1">{renderInline(h3[1])}</h3>); continue; }
      const h2 = line.match(/^## (.+)$/);
      if (h2) { flushList(); elements.push(<h2 key={key++} className="text-base font-bold mt-3 mb-1">{renderInline(h2[1])}</h2>); continue; }
      const h1 = line.match(/^# (.+)$/);
      if (h1) { flushList(); elements.push(<h1 key={key++} className="text-lg font-bold mt-3 mb-1">{renderInline(h1[1])}</h1>); continue; }

      // Blockquote
      const quote = line.match(/^> (.+)$/);
      if (quote) { flushList(); elements.push(<blockquote key={key++} className="border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground italic my-1">{renderInline(quote[1])}</blockquote>); continue; }

      // Unordered list
      const ul = line.match(/^[-*] (.+)$/);
      if (ul) {
        if (!inList || listType !== "ul") { flushList(); inList = true; listType = "ul"; }
        listItems.push(<li key={`li${key++}`}>{renderInline(ul[1])}</li>);
        continue;
      }

      // Ordered list
      const ol = line.match(/^\d+\. (.+)$/);
      if (ol) {
        if (!inList || listType !== "ol") { flushList(); inList = true; listType = "ol"; }
        listItems.push(<li key={`li${key++}`}>{renderInline(ol[1])}</li>);
        continue;
      }

      // Empty line
      if (line.trim() === "") {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(<p key={key++} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    }

    flushList();
    return elements;
  }, [content]);

  if (!content) return <p className="text-sm text-muted-foreground">No description yet.</p>;

  return <div className={className}>{rendered}</div>;
};
