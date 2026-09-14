
export function isSlugLike(str) {
  if (!str || typeof str !== "string") return true;
  const trimmed = str.trim();
  if (!trimmed) return true;
  // Technical ID formats (e.g. PRD-1789017813705, sku-12345, family-98765, CAT-06)
  if (/^(?:PRD|sku|family|CAT|PROD)-/i.test(trimmed)) return true;
  // Slug strings containing multiple hyphens without spaces (e.g. "simparica-trio-for-dogs-56-11-lbs-purple-pack-983" or "testing-products")
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(trimmed) && !/\s/.test(trimmed)) return true;
  return false;
}

export function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, " ");
}

/**
 * Checks if a string contains actual visible/meaningful text (not just empty HTML tags like <h2><br></h2>)
 */
export function hasMeaningfulContent(htmlOrText) {
  if (!htmlOrText || typeof htmlOrText !== "string") return false;
  // Strip HTML comments, tags, &nbsp;, and whitespace
  const clean = htmlOrText
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, "")
    .trim();
  return clean.length > 0;
}

export function formatProductRichContent(rawContent, product = {}) {
  let raw = "";

  if (hasMeaningfulContent(rawContent)) {
    raw = rawContent.trim();
  } else if (product) {
    raw =
      (hasMeaningfulContent(product.productDetails?.content) ? product.productDetails.content : "") ||
      (hasMeaningfulContent(product.content) ? product.content : "") ||
      (hasMeaningfulContent(product.parentContent) ? product.parentContent : "") ||
      "";
  }

  // If no meaningful content exists, return empty string so callers can handle fallback gracefully
  if (!hasMeaningfulContent(raw)) {
    return "";
  }

  let content = raw.trim();

  // 1. Strip HTML comments (e.g. <!--StartFragment--> and <!--EndFragment--> from copy-paste / rich editors)
  content = content.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Decode HTML entities (e.g., &lt;h2&gt; -> <h2>, &amp; -> &)
  // Run up to 2 passes to safely resolve double-encoded entities
  for (let pass = 0; pass < 2; pass++) {
    if (
      content.includes("&lt;") ||
      content.includes("&gt;") ||
      content.includes("&amp;") ||
      content.includes("&quot;") ||
      content.includes("&#39;") ||
      content.includes("&nbsp;")
    ) {
      content = content
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&amp;nbsp;/gi, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&");
    } else {
      break;
    }
  }

  // 3. Sanitize and enhance tables for modern responsive rendering
  if (/<table/i.test(content)) {
    // Strip fixed width styles from tables
    content = content.replace(/<table([^>]*)>/gi, (match, attrs) => {
      const cleanAttrs = attrs.replace(/style="([^"]*)"/gi, (sMatch, style) => {
        const cleanStyle = style
          .replace(/(?:min-)?width:\s*[^;]+;?/gi, "")
          .replace(/margin(?:-block)?:[^;]+;?/gi, "")
          .trim();
        return cleanStyle ? `style="${cleanStyle}"` : "";
      });
      return `<table${cleanAttrs}>`;
    });

    // Strip inline widths from th/td
    content = content.replace(/<(th|td)([^>]*)>/gi, (match, tag, attrs) => {
      const cleanAttrs = attrs.replace(/style="([^"]*)"/gi, (sMatch, style) => {
        const cleanStyle = style
          .replace(/(?:min-)?width:\s*[^;]+;?/gi, "")
          .trim();
        return cleanStyle ? `style="${cleanStyle}"` : "";
      });
      return `<${tag}${cleanAttrs}>`;
    });

    // If top row of table contains only <td>, promote to <th> for proper semantic header styling
    content = content.replace(
      /(<(?:thead|tbody|table)[^>]*>\s*<tr[^>]*>)([\s\S]*?)(<\/tr>)/gi,
      (match, openTr, inner, closeTr) => {
        if (!/<th/i.test(inner)) {
          const converted = inner.replace(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi, '<th$1>$2</th>');
          return `${openTr}${converted}${closeTr}`;
        }
        return match;
      }
    );

    // Wrap tables in responsive scroll wrapper (avoid double wrapping)
    content = content.replace(/(?<!<div class="rich-table-container[^>]*>\s*)(<table[\s\S]*?<\/table>)/gi, (match) => {
      return `<div class="rich-table-container overflow-x-auto w-full my-5 rounded-2xl border border-outline bg-white shadow-xs">${match}</div>`;
    });
  }

  // 4. If the content contains standard HTML elements, return cleanly trimmed
  if (/<(?:table|thead|tbody|tr|th|td|h[1-6]|p|ul|ol|li|div|blockquote|section|article|span)/i.test(content)) {
    return content.trim();
  }

  // 5. Plain text without HTML tags: split on double newlines and wrap in clean <p> tags
  content = content
    .split(/\r?\n\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\r?\n/g, "<br/>")}</p>`)
    .join("\n");

  return content.trim();
}
