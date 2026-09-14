import React, { useEffect, useState } from "react";
import { normalizeImageSource } from "../../utils/productImages";

const ProductImage = ({ src, alt, product: _product, onError, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(() =>
    normalizeImageSource(src),
  );

  useEffect(() => {
    setCurrentSrc(normalizeImageSource(src));
  }, [src]);

  const handleError = (event) => {
    setCurrentSrc("");
    onError?.(event);
  };

  if (!currentSrc) return null;

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
    />
  );
};

export default ProductImage;
