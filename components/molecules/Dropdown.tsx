"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  align?: "left" | "right";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  options,
  onSelect,
  align = "left",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const enabledOptions = options.filter(
      (opt) => !opt.disabled && !opt.divider,
    );

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev < enabledOptions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : enabledOptions.length - 1,
        );
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (focusedIndex >= 0 && enabledOptions[focusedIndex]) {
          handleSelect(enabledOptions[focusedIndex].value);
        }
        break;
    }
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const enabledOptions = options.filter((opt) => !opt.disabled && !opt.divider);

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 py-1",
            align === "right" ? "right-0" : "left-0",
          )}
          role="menu"
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => {
            if (option.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1 border-t border-gray-200"
                  role="separator"
                />
              );
            }

            const enabledIndex = enabledOptions.findIndex(
              (opt) => opt.value === option.value,
            );
            const isFocused = enabledIndex === focusedIndex;

            return (
              <button
                key={option.value}
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors",
                  "focus:outline-none",
                  option.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-(--color-secondary) hover:bg-gray-100 cursor-pointer",
                  isFocused && !option.disabled && "bg-gray-100",
                )}
                role="menuitem"
                tabIndex={-1}
              >
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = "Dropdown";
