import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize untrusted HTML strings to prevent Stored & Reflected XSS attacks
 * before passing them to dangerouslySetInnerHTML or rendering in DOM.
 *
 * @param dirty - Untrusted HTML string, potentially containing script tags or inline handlers
 * @param options - Optional DOMPurify configuration overrides
 * @returns Clean, safe HTML string
 */
export function sanitizeHtml(
  dirty?: string | null,
  options?: Parameters<typeof DOMPurify.sanitize>[1]
): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "span", "div", "br", "hr",
      "b", "strong", "i", "em", "u", "s", "strike", "sub", "sup",
      "ul", "ol", "li",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
      "a", "img",
      "blockquote", "code", "pre",
      "figure", "figcaption", "section", "article"
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title", "width", "height",
      "style", "class", "id", "border", "cellpadding", "cellspacing", "colspan", "rowspan", "align"
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ["target"],
    ...options,
  }) as string;
}

export default sanitizeHtml;
