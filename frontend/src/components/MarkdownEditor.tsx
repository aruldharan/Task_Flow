import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Heading2, Code, Link, Minus, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const tools = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**", placeholder: "bold text" },
  { icon: Italic, label: "Italic", prefix: "_", suffix: "_", placeholder: "italic text" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`", placeholder: "code" },
  { icon: Heading2, label: "Heading", prefix: "## ", suffix: "", placeholder: "heading", line: true },
  { icon: List, label: "Bullet List", prefix: "- ", suffix: "", placeholder: "list item", line: true },
  { icon: ListOrdered, label: "Numbered List", prefix: "1. ", suffix: "", placeholder: "list item", line: true },
  { icon: Quote, label: "Quote", prefix: "> ", suffix: "", placeholder: "quote", line: true },
  { icon: Minus, label: "Divider", prefix: "\n---\n", suffix: "", placeholder: "", line: true },
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)", placeholder: "link text" },
];

export const MarkdownEditor = ({ value, onChange, placeholder, rows = 4, className }: Props) => {
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const insertMarkdown = useCallback((tool: typeof tools[0]) => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = selectedText || tool.placeholder;
    const newText = value.substring(0, start) + tool.prefix + replacement + tool.suffix + value.substring(end);
    onChange(newText);

    // Set cursor position after insert
    setTimeout(() => {
      const cursorPos = start + tool.prefix.length + replacement.length;
      textareaRef.focus();
      textareaRef.setSelectionRange(
        selectedText ? cursorPos + tool.suffix.length : start + tool.prefix.length,
        selectedText ? cursorPos + tool.suffix.length : start + tool.prefix.length + replacement.length
      );
    }, 0);
  }, [textareaRef, value, onChange]);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-0.5 flex-wrap rounded-t-md border border-b-0 border-border bg-muted/50 px-1.5 py-1">
        {tools.map((tool, i) => (
          <Button
            key={tool.label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => insertMarkdown(tool)}
            title={tool.label}
          >
            <tool.icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
      <Textarea
        ref={setTextareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "Write with **markdown** support..."}
        rows={rows}
        className="rounded-t-none border-t-0 font-mono text-sm"
      />
    </div>
  );
};
