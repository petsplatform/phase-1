import { useEffect } from "react";

const setMetaTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      if (key !== "content") tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", attributes.content);
};

const SEO = ({ title, description, ogTitle, ogDescription }) => {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      setMetaTag('meta[name="description"]', {
        name: "description",
        content: description,
      });
    }

    if (ogTitle) {
      setMetaTag('meta[property="og:title"]', {
        property: "og:title",
        content: ogTitle,
      });
    }

    if (ogDescription) {
      setMetaTag('meta[property="og:description"]', {
        property: "og:description",
        content: ogDescription,
      });
    }
  }, [description, ogDescription, ogTitle, title]);

  return null;
};

export default SEO;
