const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "CAPTION", "CODE", "COL", "COLGROUP", "DIV", "EM", "H1", "H2", "H3", "H4", "H5", "H6", "HR", "I", "LI", "OL", "P", "PRE", "S", "SPAN", "STRONG", "SUB", "SUP", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "U", "UL"]);
const allowedAttributes = new Set(["align", "alt", "class", "colspan", "height", "href", "rel", "rowspan", "scope", "style", "target", "title", "width"]);

const isSafeUrl = (value) => /^(https?:|mailto:|tel:|#|\/)/i.test(String(value || "").trim());

export const sanitizeRichTextHtml = (html = "") => {
  if (typeof window === "undefined" || !html) return String(html || "");
  const document = new DOMParser().parseFromString(String(html), "text/html");
  [...document.body.querySelectorAll("*")].forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (!allowedAttributes.has(name) || name.startsWith("on")) element.removeAttribute(attribute.name);
    });
    ["href", "src"].forEach((attribute) => {
      if (element.hasAttribute(attribute) && !isSafeUrl(element.getAttribute(attribute))) element.removeAttribute(attribute);
    });
    if (element.tagName === "A" && element.getAttribute("target") === "_blank") element.setAttribute("rel", "noopener noreferrer");
  });
  return document.body.innerHTML;
};
