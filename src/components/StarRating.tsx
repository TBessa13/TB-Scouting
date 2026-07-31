import React, { useState } from 'react';

interface StarRatingProps {
  value: number; // 1 to 5 scale (integer)
  onChange?: (newValue: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'single' | 'stars';
  readOnly?: boolean;
  className?: string;
  activeColor?: string;
  inactiveColor?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 'xs',
  variant,
  readOnly = !onChange,
  className = '',
  activeColor = 'text-[#ff535b]',
  inactiveColor = 'text-[#303036]',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // Strictly integer value from 1 to 5
  const rawNum = value <= 5 ? value : value / 4;
  const intVal = Math.min(5, Math.max(1, Math.round(rawNum)));

  const displayVal = hoverValue !== null ? hoverValue : intVal;

  const isSingleMode = variant ? variant === 'single' : readOnly;

  const starIconSizes = {
    xs: 'text-[13px]',
    sm: 'text-[15px]',
    md: 'text-[18px]',
    lg: 'text-[22px]',
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (isSingleMode) {
    return (
      <div className={`inline-flex items-center gap-1 shrink-0 font-mono-data font-bold select-none ${className}`}>
        <span
          className={`material-symbols-outlined ${starIconSizes[size]} ${activeColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
        <span className={`${textSizes[size]} text-[#e5e2e3] leading-none`}>
          {intVal}
        </span>
      </div>
    );
  }

  // Interactive / Multi-star mode (always 1-5 integer stars)
  return (
    <div
      className={`inline-flex items-center gap-1 shrink-0 select-none ${className}`}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = displayVal >= star;

        return (
          <span
            key={star}
            className={`material-symbols-outlined ${starIconSizes[size]} transition-all ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } ${isFilled ? activeColor : inactiveColor}`}
            style={{
              fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
            }}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onClick={() => {
              if (!readOnly && onChange) {
                onChange(star);
              }
            }}
            title={readOnly ? `${intVal} de 5` : `Avaliar ${star} estrelas`}
          >
            star
          </span>
        );
      })}
    </div>
  );
};

