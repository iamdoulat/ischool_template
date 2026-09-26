import React from "react";

interface ServerHeadCodeProps {
  code?: string;
}

/**
 * Extracts attribute key-value pairs from an HTML tag string.
 */
function parseAttributes(tagStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:["']([^"']*)["']|([^>\s]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(tagStr)) !== null) {
    const key = match[1].toLowerCase();
    if (key === "meta" || key === "link" || key === "style" || key === "script") continue;
    const value = match[2] ?? match[3] ?? "";
    attrs[key] = value;
  }

  return attrs;
}

/**
 * Parses and renders meta, link, and style tags on the server for SSR output in <head>.
 * This ensures search engine verification crawlers and social scrapers see verification
 * meta tags in the raw initial HTML response before client-side hydration.
 */
export function ServerHeadCode({ code }: ServerHeadCodeProps) {
  if (!code || typeof code !== "string" || !code.trim()) {
    return null;
  }

  const elements: React.ReactNode[] = [];
  let keyIndex = 0;

  // 1. Extract <meta ... /> tags
  const metaRegex = /<meta\s+([^>]+?)\/?>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(code)) !== null) {
    const attrs = parseAttributes(metaMatch[1]);
    elements.push(
      <meta key={`ssr-meta-${keyIndex++}`} {...attrs} />
    );
  }

  // 2. Extract <link ... /> tags
  const linkRegex = /<link\s+([^>]+?)\/?>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(code)) !== null) {
    const attrs = parseAttributes(linkMatch[1]);
    elements.push(
      <link key={`ssr-link-${keyIndex++}`} {...attrs} />
    );
  }

  // 3. Extract <style ...>...</style> tags
  const styleRegex = /<style(?:\s+[^>]*)?>([\s\S]*?)<\/style>/gi;
  let styleMatch: RegExpExecArray | null;
  while ((styleMatch = styleRegex.exec(code)) !== null) {
    const cssContent = styleMatch[1];
    elements.push(
      <style
        key={`ssr-style-${keyIndex++}`}
        dangerouslySetInnerHTML={{ __html: cssContent }}
      />
    );
  }

  return <>{elements}</>;
}
