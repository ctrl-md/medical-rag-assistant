import React from "react";

// Parses a single line's inline formatting (bold, italic, citation markers
// like [1] or [1, 2]) into an array of React nodes, in order. Built as a
// small hand-written tokenizer rather than a markdown library, since the
// only formatting Groq's responses actually use is this small, known set.
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[(\d+(?:,\s*\d+)*)\]/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const [full, bold, italic, citation] = match;
    if (bold !== undefined) {
      nodes.push(
        <strong
          key={`${keyPrefix}-${key++}`}
          className="font-semibold text-slate-900"
        >
          {bold}
        </strong>,
      );
    } else if (italic !== undefined) {
      nodes.push(
        <em key={`${keyPrefix}-${key++}`} className="text-slate-500 not-italic">
          {italic}
        </em>,
      );
    } else if (citation !== undefined) {
      nodes.push(
        <span
          key={`${keyPrefix}-${key++}`}
          className="ml-0.5 mr-px inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600 align-middle"
        >
          {citation}
        </span>,
      );
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

// Parses the full answer text into block-level React nodes: headers
// (**Bold Line** on its own), bullet lists (* item), horizontal rules
// (---), and paragraphs -- matching the structure Groq's responses
// actually produce for this prompt.
export function renderAnswer(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let blockKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${blockKey++}`} className="mb-4 ml-1 space-y-2">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  };

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (line === "") return;

    if (line === "---") {
      flushList();
      blocks.push(
        <hr key={`hr-${blockKey++}`} className="my-6 border-slate-200" />,
      );
      return;
    }

    const headerMatch = /^\*\*([^*]+)\*\*$/.exec(line);
    if (headerMatch) {
      flushList();
      blocks.push(
        <h3
          key={`h-${blockKey++}`}
          className="mb-3 mt-6 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900 first:mt-0"
        >
          {headerMatch[1]}
        </h3>,
      );
      return;
    }

    if (line.startsWith("* ")) {
      listItems.push(
        <li
          key={`li-${i}`}
          className="flex gap-2.5 text-[15px] leading-relaxed text-slate-700"
        >
          <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
          <span>{parseInline(line.slice(2), `li-${i}`)}</span>
        </li>,
      );
      return;
    }

    flushList();
    blocks.push(
      <p
        key={`p-${blockKey++}`}
        className="mb-4 text-[15px] leading-relaxed text-slate-700"
      >
        {parseInline(line, `p-${blockKey}`)}
      </p>,
    );
  });

  flushList();
  return blocks;
}
