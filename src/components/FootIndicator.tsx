import React from 'react';

interface FootIndicatorProps {
  foot?: 'Direito' | 'Esquerdo' | 'Ambidestro' | string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const FootIndicator: React.FC<FootIndicatorProps> = ({
  foot = 'Direito',
  className = '',
  size = 'sm',
  showLabel = false,
}) => {
  const isLeftActive = foot === 'Esquerdo' || foot === 'Ambidestro';
  const isRightActive = foot === 'Direito' || foot === 'Ambidestro';

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeClasses[size] || sizeClasses.sm;

  // Colors: Active = coral/red highlight (#ff535b), Inactive = subtle gray (#353436 / #52525b)
  const leftColor = isLeftActive
    ? 'text-[#ff535b] drop-shadow-[0_0_6px_rgba(255,83,91,0.4)]'
    : 'text-[#353436] opacity-60';

  const rightColor = isRightActive
    ? 'text-[#ff535b] drop-shadow-[0_0_6px_rgba(255,83,91,0.4)]'
    : 'text-[#353436] opacity-60';

  const tooltipText = `Pé Preferencial: ${foot || 'Desconhecido'}`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={tooltipText}
    >
      <div className="flex items-center gap-0.5 bg-[#0A0A0B]/60 p-1 rounded-lg border border-[#26262B]">
        {/* Left Foot Icon */}
        <svg
          viewBox="0 0 24 24"
          className={`${iconSize} ${leftColor} transition-all duration-200`}
          fill="currentColor"
        >
          {/* Sole */}
          <path d="M12 21.5c2.2 0 3.8-1.8 3.5-5.2-.3-3.2-2-6.8-3.8-9.8-.7-1.1-1.7-1.5-2.5-1.5-1.5 0-2.2 1.3-2 3.8.3 3.5 1.8 7.8 2.3 10.7.3 1.3 1.2 2 2.5 2z" />
          {/* Big toe */}
          <circle cx="12.8" cy="3" r="1.8" />
          {/* Toe 2 */}
          <circle cx="10" cy="3.5" r="1.3" />
          {/* Toe 3 */}
          <circle cx="7.8" cy="4.8" r="1.1" />
          {/* Toe 4 */}
          <circle cx="6.2" cy="6.5" r="0.9" />
          {/* Toe 5 */}
          <circle cx="5.2" cy="8.5" r="0.7" />
        </svg>

        {/* Right Foot Icon */}
        <svg
          viewBox="0 0 24 24"
          className={`${iconSize} ${rightColor} transition-all duration-200`}
          fill="currentColor"
        >
          {/* Sole */}
          <path d="M12 21.5c-2.2 0-3.8-1.8-3.5-5.2.3-3.2 2-6.8 3.8-9.8.7-1.1 1.7-1.5 2.5-1.5 1.5 0 2.2 1.3 2 3.8-.3 3.5-1.8 7.8-2.3 10.7-.3 1.3-1.2 2-2.5 2z" />
          {/* Big toe */}
          <circle cx="11.2" cy="3" r="1.8" />
          {/* Toe 2 */}
          <circle cx="14" cy="3.5" r="1.3" />
          {/* Toe 3 */}
          <circle cx="16.2" cy="4.8" r="1.1" />
          {/* Toe 4 */}
          <circle cx="17.8" cy="6.5" r="0.9" />
          {/* Toe 5 */}
          <circle cx="18.8" cy="8.5" r="0.7" />
        </svg>
      </div>

      {showLabel && (
        <span className="text-xs font-semibold text-[#e5e2e3]">
          {foot}
        </span>
      )}
    </div>
  );
};
