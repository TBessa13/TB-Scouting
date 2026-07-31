import React from 'react';

/**
 * Extracts initials from first and last name.
 * Example: 'Mateo Kovac' -> 'MK', 'Lucas Silva' -> 'LS'
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string;
  className?: string; // e.g., "w-10 h-10 text-xs"
  variant?: 'primary' | 'subtle' | 'neutral';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  className = 'w-10 h-10 text-xs',
  variant = 'primary',
}) => {
  const initials = getInitials(name);

  let colorStyle = 'bg-[#ff535b]/20 text-[#ffb3b1] border border-[#ff535b]/30';
  if (variant === 'subtle') {
    colorStyle = 'bg-[#1C1C1F] text-[#e4bebc] border border-[#26262B]';
  } else if (variant === 'neutral') {
    colorStyle = 'bg-[#26262B] text-[#e5e2e3] border border-[#353436]';
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold tracking-wider shrink-0 select-none overflow-hidden ${colorStyle} ${className}`}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
};
