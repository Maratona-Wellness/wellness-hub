"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/Input";

export interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "Buscar...",
  disabled = false,
  className,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange(newValue);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue("");
    }
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        leftIcon={<Search className="h-5 w-5 text-gray-400" />}
        rightIcon={
          value && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              aria-label="Limpar busca"
            >
              <X className="h-5 w-5" />
            </button>
          )
        }
        className="pr-10"
      />
    </div>
  );
};

SearchBar.displayName = "SearchBar";
