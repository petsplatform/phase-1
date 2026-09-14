/**
 * Utility functions for sanitizing, decoding, and styling rich-text HTML content
 * received from backend APIs or admin rich-text editors.
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

/**
 * Checks if a string contains actual visible/meaningful text
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

function getProductDetails(product) {
  const details = product?.productDetails;
  if (!details) return {};
  if (typeof details === "object" && !Array.isArray(details)) return details;
  if (typeof details !== "string") return {};
  try {
    const parsed = JSON.parse(details);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function formatProductRichContent(rawContent, product = {}) {
  let raw = "";
  const productDetails = getProductDetails(product);

  if (hasMeaningfulContent(rawContent) && !isSlugLike(rawContent)) {
    raw = rawContent.trim();
  } else if (product) {
    const candidates = [
      productDetails.content,
      productDetails.overview,
      product.content,
      product.parentContent,
      product.htmlContent,
      product.detailedContent,
      product.longDescription,
      product.description,
      product.shortDescription,
    ];
    for (const c of candidates) {
      if (hasMeaningfulContent(c) && !isSlugLike(c)) {
        raw = c.trim();
        break;
      }
    }
  }

  // If no meaningful content exists, return empty string (no fake fallback template)
  if (!hasMeaningfulContent(raw)) {
    return "";
  }

  let content = raw.trim();

  // 1. Decode HTML entities (e.g., &lt;h2&gt; -> <h2>, &amp; -> &)
  // Run up to 2 passes to safely resolve double-encoded entities
  for (let pass = 0; pass < 2; pass++) {
    if (
      content.includes("&lt;") ||
      content.includes("&gt;") ||
      content.includes("&amp;") ||
      content.includes("&quot;") ||
      content.includes("&#39;")
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

  // 2. Clean empty line containers (e.g. <div><br></div>, <div><br/></div>)
  content = content
    .replace(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, "\n")
    .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "\n");

  // 3. Remove <div> wrappers that wrap block tags or list items from WYSIWYG line-wrappers
  content = content
    .replace(/<div[^>]*>\s*(<\/?(?:p|ul|ol|li|h[1-6]|blockquote|table|thead|tbody|tr|th|td)[^>]*>)\s*<\/div>/gi, "$1\n")
    .replace(/<div[^>]*>\s*(<li[^>]*>[\s\S]*?<\/li>)\s*<\/div>/gi, "$1\n")
    .replace(/<div[^>]*>\s*(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>)\s*<\/div>/gi, "$1\n");

  // 4. Remove any rogue div tags inside or around p, ul, ol
  content = content
    .replace(/<p[^>]*>\s*<div[^>]*>/gi, "<p>")
    .replace(/<\/div>\s*<\/p>/gi, "</p>")
    .replace(/<div[^>]*>\s*<p[^>]*>/gi, "<p>")
    .replace(/<\/p>\s*<\/div>/gi, "</p>")
    .replace(/<ul[^>]*>\s*<div[^>]*>/gi, "<ul>")
    .replace(/<\/div>\s*<\/ul>/gi, "</ul>")
    .replace(/<ol[^>]*>\s*<div[^>]*>/gi, "<ol>")
    .replace(/<\/div>\s*<\/ol>/gi, "</ol>")
    .replace(/<p>\s*<div[^>]*>([\s\S]*?)<\/div>\s*<\/p>/gi, "<p>$1</p>")
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, (match, inner) => {
      // If inner contains block elements like <h2>, <p>, <ul>, just return inner
      if (/<(?:h[1-6]|p|ul|ol|li|blockquote)/i.test(inner)) {
        return inner;
      }
      const trimmed = inner.trim();
      if (!trimmed) return "";
      return `<p>${trimmed}</p>`;
    });

  // 5. Clean up redundant empty paragraphs and excessive breaks
  content = content
    .replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, "")
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br/><br/>");

  // 5b. Wrap HTML tables in a responsive scroll container if not already wrapped
  content = content.replace(
    /(?:<div[^>]*class="[^"]*table-container[^"]*"[^>]*>\s*)?(<table[\s\S]*?<\/table>)(?:\s*<\/div>)?/gi,
    (match, tbl) => {
      return `<div class="table-container">${tbl}</div>`;
    }
  );

  // 6. If the result has no HTML tags at all, format as paragraphs
  if (!/<(?:h[1-6]|p|ul|ol|li|b|strong|div|br|table)/i.test(content)) {
    content = content
      .split(/\r?\n\r?\n/)
      .map((block) => `<p>${block.trim()}</p>`)
      .join("\n");
  }

  return content.trim();
}
