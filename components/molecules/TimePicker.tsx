"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/Input";

export interface TimePickerProps {
  value?: string; // formato "HH:MM"
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  minTime?: string;
  maxTime?: string;
  interval?: number; // minutos entre opções (padrão: 30)
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = "Selecione um horário",
  disabled = false,
  error,
  minTime = "00:00",
  maxTime = "23:59",
  interval = 30,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const generateTimeOptions = () => {
    const options: string[] = [];
    const [minHours, minMinutes] = minTime.split(":").map(Number);
    const [maxHours, maxMinutes] = maxTime.split(":").map(Number);

    for (let hours = 0; hours < 24; hours++) {
      for (let minutes = 0; minutes < 60; minutes += interval) {
        const timeValue = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        const currentTimeMinutes = hours * 60 + minutes;
        const minTimeMinutes = minHours * 60 + minMinutes;
        const maxTimeMinutes = maxHours * 60 + maxMinutes;

        if (
          currentTimeMinutes >= minTimeMinutes &&
          currentTimeMinutes <= maxTimeMinutes
        ) {
          options.push(timeValue);
        }
      }
    }

    return options;
  };

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  const timeOptions = generateTimeOptions();

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        readOnly
        onClick={() => !disabled && setIsOpen(!isOpen)}
        rightIcon={<Clock className="h-5 w-5" />}
        className="cursor-pointer"
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto">
          {timeOptions.map((time) => (
            <button
              key={time}
              onClick={() => handleTimeSelect(time)}
              className={cn(
                "w-full px-4 py-2 text-left text-sm transition-colors",
                "hover:bg-gray-100 focus:outline-none focus:bg-gray-100",
                value === time &&
                  "bg-(--color-accent) text-white hover:bg-(--color-accent)",
              )}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

TimePicker.displayName = "TimePicker";
