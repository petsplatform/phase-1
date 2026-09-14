/**
 * Utility functions for sanitizing, decoding, and formatting rich-text HTML/Markdown
 * content from backend APIs and catalog responses.
 */

export function decodeHtmlEntities(str) {
  if (!str || typeof str !== "string") return "";
  let content = str;
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
  return content;
}

export function formatProductRichContent(rawContent, product = {}) {
  let raw = "";

  if (typeof rawContent === "string" && rawContent.trim()) {
    raw = rawContent.trim();
  } else if (product) {
    raw =
      product.productDetails?.content ||
      product.productDetails?.overview ||
      product.content ||
      product.parentContent ||
      product.htmlContent ||
      product.detailedContent ||
      product.longDescription ||
      product.fullDescription ||
      product.description ||
      product.shortDescription ||
      "";
  }

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return "";
  }

  let content = decodeHtmlEntities(raw).trim();

  // 1. Convert markdown headers if present
  content = content.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  content = content.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  content = content.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // 2. Convert markdown bold and italic
  content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  content = content.replace(/__(.*?)__/g, "<strong>$1</strong>");
  content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // 3. Clean empty line containers (e.g. <div><br></div>)
  content = content
    .replace(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, "\n")
    .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "\n");

  // 4. Remove <div> wrappers that wrap block tags or list items from WYSIWYG line-wrappers
  content = content
    .replace(/<div[^>]*>\s*(<\/?(?:p|ul|ol|li|h[1-6]|blockquote|table|thead|tbody|tr|th|td)[^>]*>)\s*<\/div>/gi, "$1\n")
    .replace(/<div[^>]*>\s*(<li[^>]*>[\s\S]*?<\/li>)\s*<\/div>/gi, "$1\n")
    .replace(/<div[^>]*>\s*(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)\s*<\/div>/gi, "$1\n");

  // 5. Clean rogue div tags around p, ul, ol
  content = content
    .replace(/<p[^>]*>\s*<div[^>]*>/gi, "<p>")
    .replace(/<\/div>\s*<\/p>/gi, "</p>")
    .replace(/<div[^>]*>\s*<p[^>]*>/gi, "<p>")
    .replace(/<\/p>\s*<\/div>/gi, "</p>")
    .replace(/<ul[^>]*>\s*<div[^>]*>/gi, "<ul>")
    .replace(/<\/div>\s*<\/ul>/gi, "</ul>")
    .replace(/<ol[^>]*>\s*<div[^>]*>/gi, "<ol>")
    .replace(/<\/div>\s*<\/ol>/gi, "</ol>")
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, (match, inner) => {
      if (/<(?:h[1-6]|p|ul|ol|li|blockquote)/i.test(inner)) {
        return inner;
      }
      const trimmed = inner.trim();
      if (!trimmed) return "";
      return `<p>${trimmed}</p>`;
    });

  // 6. Convert bullet lists if markdown style
  if (!/<(?:ul|ol)[\s>]/i.test(content) && /^[-*•]\s+/m.test(content)) {
    const lines = content.split("\n");
    let inList = false;
    const processed = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^[-*•]\s+(.*)/.test(line)) {
        const match = line.match(/^[-*•]\s+(.*)/);
        if (!inList) {
          processed.push("<ul>");
          inList = true;
        }
        processed.push(`<li>${match[1]}</li>`);
      } else {
        if (inList) {
          processed.push("</ul>");
          inList = false;
        }
        processed.push(lines[i]);
      }
    }
    if (inList) processed.push("</ul>");
    content = processed.join("\n");
  }

  // 7. Clean up redundant empty paragraphs and excessive breaks
  content = content
    .replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, "")
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br/><br/>");

  // 8. Sanitize and enhance tables for modern responsive rendering
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

    // If top row of table contains only <td>, promote to <th> for proper header styling
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

    // Keep tables inside the full-width rich-content area without adding a
    // horizontal scrollbar. The table CSS below allows cells to wrap.
    content = content.replace(/(<table[\s\S]*?<\/table>)/gi, (match) => {
      return `<div class="rich-table-container w-full my-5 rounded-2xl border border-[#D9E8F2] bg-white shadow-xs">${match}</div>`;
    });
  }

  // 9. If the result has no HTML block tags at all, format as paragraphs
  if (!/<(?:h[1-6]|p|ul|ol|li|blockquote|table|br)/i.test(content)) {
    content = content
      .split(/\r?\n\r?\n/)
      .map((block) => `<p>${block.trim().replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  }

  return content.trim();
}
