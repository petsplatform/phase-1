import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

const RatingBar = ({
  // Optional parameters
  layout_width,
  position,
  
  // Standard props
  rating = 0,
  maxRating = 5,
  size = 20,
  activeColor = '#FFA500',
  inactiveColor = '#E5E7EB',
  readOnly = false,
  onChange,
  className,
  ...props
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  // Safe validation for optional parameters
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width?.trim() !== '';
  const hasValidPosition = position && typeof position === 'string' && position?.trim() !== '';

  // Build optional Tailwind classes
  const optionalClasses = [
    hasValidWidth ? (layout_width === 'flex-1' ? 'flex-1' : layout_width === 'auto' ? 'w-auto' : `w-[${layout_width}]`) : 'w-auto',
  ]?.filter(Boolean)?.join(' ');

  const containerStyles = {
    ...(hasValidPosition && { position }),
  };

  const handleClick = (index) => {
    if (readOnly) return;
    const newRating = index + 1;
    setCurrentRating(newRating);
    if (typeof onChange === 'function') {
      onChange(newRating);
    }
  };

  const handleMouseEnter = (index) => {
    if (readOnly) return;
    setHoverRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || currentRating;

  return (
    <div
      role="img"
      aria-label={`Rating: ${currentRating} out of ${maxRating} stars`}
      style={containerStyles}
      className={twMerge(
        'inline-flex items-center gap-1',
        optionalClasses,
        className
      )}
      {...props}
    >
      {[...Array(maxRating)]?.map((_, index) => {
        const isFilled = index < displayRating;
        
        return (
          <svg
            key={index}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={isFilled ? activeColor : inactiveColor}
            className={twMerge(
              'transition-all duration-200',
              !readOnly && 'cursor-pointer hover:scale-110'
            )}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      })}
    </div>
  );
};

export default RatingBar;