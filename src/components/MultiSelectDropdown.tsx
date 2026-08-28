import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption<T extends string = string> {
  value: T;
  label: string;
  shortLabel?: string;
  badge?: string;
  badgeColor?: string;
  dotColor?: string;
}

interface MultiSelectDropdownProps<T extends string = string> {
  label: string;
  placeholder: string;
  options: MultiSelectOption<T>[];
  selectedValues: T[];
  onChange: (newValues: T[]) => void;
  className?: string;
  icon?: string;
}

export function MultiSelectDropdown<T extends string = string>({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  className = '',
  icon,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleOption = (value: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(options.map((opt) => opt.value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Label representation
  const renderTriggerLabel = () => {
    if (selectedValues.length === 0) {
      return <span className="text-[#e4bebc] font-bold truncate">{placeholder}</span>;
    }
    if (selectedValues.length === 1) {
      const match = options.find((opt) => opt.value === selectedValues[0]);
      return (
        <span className="text-[#e5e2e3] font-bold truncate flex items-center gap-1.5">
          {match?.dotColor && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: match.dotColor }}
            />
          )}
          <span>{match ? (match.shortLabel || match.label) : selectedValues[0]}</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[#e5e2e3] font-bold truncate">{label}</span>
        <span className="bg-[#ff535b] text-white text-[10px] font-mono-data font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
          {selectedValues.length}
        </span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-[#0e0e0f] border ${
          isOpen || selectedValues.length > 0
            ? 'border-[#ff535b] ring-1 ring-[#ff535b]/30'
            : 'border-[#353436] hover:border-[#ff535b]/60'
        } rounded-xl px-3 py-2.5 text-xs text-[#e5e2e3] flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
          {icon && (
            <span className="material-symbols-outlined text-[16px] text-[#ff535b] shrink-0">
              {icon}
            </span>
          )}
          {renderTriggerLabel()}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedValues.length > 0 && (
            <span
              onClick={handleClearAll}
              title="Limpar seleção"
              className="p-0.5 hover:bg-[#353436] text-[#e4bebc] hover:text-[#ff535b] rounded-full transition-colors cursor-pointer mr-0.5 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </span>
          )}
          <span
            className={`material-symbols-outlined text-[16px] text-[#e4bebc] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#ff535b]' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[260px] bg-[#141416] border border-[#353436] rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1.5 animate-fade-in">
          {/* Action Header */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-[#26262B] text-[11px] text-[#e4bebc]">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[#e4bebc]/70">
              {label} ({selectedValues.length}/{options.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#ffb3b1] hover:text-[#ff535b] font-bold text-[10px] uppercase hover:underline cursor-pointer"
              >
                Todos
              </button>
              <span className="text-[#353436]">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[#e4bebc] hover:text-[#ff535b] font-bold text-[10px] uppercase hover:underline cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-1 scrollbar-thin">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={(e) => handleToggleOption(option.value, e)}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#ff535b]/15 text-white font-bold border border-[#ff535b]/40'
                      : 'text-[#e5e2e3] hover:bg-[#201f20] border border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Custom Checkbox */}
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#ff535b] text-white'
                          : 'border border-[#555358] bg-[#0e0e0f]'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px] font-extrabold">
                          check
                        </span>
                      )}
                    </div>

                    {/* Dot color indicator if any */}
                    {option.dotColor && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: option.dotColor }}
                      />
                    )}

                    {/* Label */}
                    <span className="truncate">{option.label}</span>
                  </div>

                  {/* Badge if any */}
                  {option.badge && (
                    <span
                      className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        option.badgeColor || 'bg-[#26262B] text-[#e4bebc]'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
