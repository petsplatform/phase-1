/**
 * HTML decoding and text utilities for rich product content formatting.
 */

/**
 * Checks if a string looks like a technical slug or internal ID rather than real user copy
 */
export function isSlugLike(str) {
  if (!str || typeof str !== "string") return true;
  const trimmed = str.trim();
  if (!trimmed) return true;
  if (/^(?:PRD|sku|family|CAT|PROD)-/i.test(trimmed)) return true;
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
      (hasMeaningfulContent(product.productDetails?.overview) ? product.productDetails.overview : "") ||
      (hasMeaningfulContent(product.content) ? product.content : "") ||
      (hasMeaningfulContent(product.parentContent) ? product.parentContent : "") ||
      (hasMeaningfulContent(product.overview) ? product.overview : "") ||
      (hasMeaningfulContent(product.longDescription) ? product.longDescription : "") ||
      (hasMeaningfulContent(product.description) ? product.description : "") ||
      "";
  }

  // If no meaningful content exists, return empty string
  if (!hasMeaningfulContent(raw)) {
    return "";
  }

  let content = raw.trim();

  // 1. Strip HTML comments (e.g. <!--StartFragment--> and <!--EndFragment-->)
  content = content.replace(/<!--[\s\S]*?-->/g, "");

  // 2. Decode common HTML entities
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
    // Strip fixed width styles and attributes from tables
    content = content.replace(/<table([^>]*)>/gi, (match, attrs) => {
      let cleanAttrs = attrs.replace(/\bwidth\s*=\s*["']?[^"'\s>]+["']?/gi, "");
      cleanAttrs = cleanAttrs.replace(/style="([^"]*)"/gi, (sMatch, style) => {
        const cleanStyle = style
          .replace(/(?:min-|max-)?width:\s*[^;]+;?/gi, "")
          .replace(/margin(?:-block)?:[^;]+;?/gi, "")
          .trim();
        return cleanStyle ? `style="${cleanStyle}"` : "";
      });
      return `<table${cleanAttrs}>`;
    });

    // Strip inline widths from th/td/col/colgroup
    content = content.replace(/<(th|td|col|colgroup)([^>]*)>/gi, (match, tag, attrs) => {
      let cleanAttrs = attrs.replace(/\bwidth\s*=\s*["']?[^"'\s>]+["']?/gi, "");
      cleanAttrs = cleanAttrs.replace(/style="([^"]*)"/gi, (sMatch, style) => {
        const cleanStyle = style
          .replace(/(?:min-|max-)?width:\s*[^;]+;?/gi, "")
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
      return `<div class="rich-table-container overflow-x-auto w-full my-5 rounded-2xl border border-[#e8eef3] bg-white shadow-xs">${match}</div>`;
    });
  }

  // Strip hardcoded container width styles that exceed container
  content = content.replace(/\bstyle="([^"]*)"/gi, (match, styleContent) => {
    const cleanedStyle = styleContent
      .replace(/(?:min-|max-)?width\s*:\s*(?:1[0-9]{3,}|[8-9][0-9]{2,})px;?/gi, "")
      .trim();
    return cleanedStyle ? `style="${cleanedStyle}"` : "";
  });

  // 4. Check if content contains standard HTML elements
  const hasHtmlTags = /<\/?(h[1-6]|p|div|ul|ol|li|strong|b|em|i|table|thead|tbody|tr|th|td|span|blockquote|br)[\s>/]/i.test(content);
  if (hasHtmlTags) {
    return content.trim();
  }

  // 5. Parse markdown-like syntax if plain text with markdown is provided
  let formatted = content;

  // Convert markdown headers
  formatted = formatted.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  formatted = formatted.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  formatted = formatted.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Convert bold: **text** or __text__
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Convert italic: *text* or _text_
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert bullet lists
  const lines = formatted.split("\n");
  let inList = false;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^[-*•]\s+(.*)/.test(line)) {
      const match = line.match(/^[-*•]\s+(.*)/);
      if (!inList) {
        processedLines.push("<ul>");
        inList = true;
      }
      processedLines.push(`<li>${match[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      processedLines.push(lines[i]);
    }
  }
  if (inList) {
    processedLines.push("</ul>");
  }

  formatted = processedLines.join("\n");

  // If wrapped in HTML headings or lists, return it
  if (/<(h[1-6]|ul|ol|p|div)[\s>]/i.test(formatted)) {
    return formatted
      .split(/\n\s*\n/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        if (/^<(h[1-6]|ul|ol|table|blockquote|div|p)[\s>]/i.test(trimmed)) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
      })
      .filter(Boolean)
      .join("\n");
  }

  // Wrap plain text paragraphs
  const paragraphs = formatted
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length > 0) {
    return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
  }

  return `<p>${formatted}</p>`;
}
