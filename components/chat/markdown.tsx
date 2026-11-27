import type { ReactNode } from "react";

function renderInline(text: string, seed: number): ReactNode[] {
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${seed}-${index++}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function isBlockStart(line: string) {
  return /^(#{1,4}\s|```|\s*[-*]\s|\s*\d+\.\s|>|---)/.test(line);
}

export function ChatMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      i += 1;
      const code: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre key={key++}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(<h3 key={key++}>{renderInline(heading[2], key)}</h3>);
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, itemIndex)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={key++}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, itemIndex)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote key={key++} className="border-s-2 border-lime/40 ps-3 text-mist/90">
          {renderInline(quote.join(" "), key)}
        </blockquote>,
      );
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      blocks.push(<hr key={key++} />);
      i += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }

    if (paragraph.length) {
      blocks.push(<p key={key++}>{renderInline(paragraph.join(" "), key)}</p>);
    } else {
      i += 1;
    }
  }

  return <div className="chat-prose">{blocks}</div>;
}
