import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

const WIKI_LINK = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;
const CALLOUT = /^>\s*\[!(\w+)\]\s*/gim;

function slugifyFragment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeMarkdown(
  markdown: string,
  routeMap: Record<string, string>,
): string {
  const withLinks = markdown.replace(WIKI_LINK, (_match, rawTarget, rawLabel) => {
    const target = String(rawTarget).trim().toLowerCase();
    const label = String(rawLabel ?? rawTarget).trim();
    const href = routeMap[target] ?? "#";
    return `[${label}](${href})`;
  });

  return withLinks.replace(CALLOUT, (_match, kind) => `> ${String(kind).toUpperCase()}: `);
}

export async function renderMarkdown(
  markdown: string,
  routeMap: Record<string, string>,
): Promise<string> {
  const normalized = normalizeMarkdown(markdown, routeMap);
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(normalized);

  return String(file);
}

export function renderMarkdownSync(
  markdown: string,
  routeMap: Record<string, string>,
): string {
  const normalized = normalizeMarkdown(markdown, routeMap);
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .processSync(normalized);

  return String(file);
}

export function splitMarkdownSections(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const matches = [...normalized.matchAll(/^##\s+(.+)$/gm)];

  if (!matches.length) {
    return {
      intro: normalized,
      sections: [],
    };
  }

  const intro = normalized.slice(0, matches[0]?.index ?? 0).trim();
  const sections = matches.map((match, index) => {
    const title = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    const content = normalized.slice(start, end).trim();

    return {
      id: slugifyFragment(title),
      title,
      markdown: content,
    };
  });

  return { intro, sections };
}
