"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  error,
  minDate,
  maxDate,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
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

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleDateString("pt-BR");
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    if (minDate && selectedDate < minDate) return;
    if (maxDate && selectedDate > maxDate) return;

    onChange(selectedDate);
    setIsOpen(false);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (day: number) => {
    if (!value) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        type="text"
        value={formatDate(value)}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        readOnly
        onClick={() => !disabled && setIsOpen(!isOpen)}
        rightIcon={<Calendar className="h-5 w-5" />}
        className="cursor-pointer"
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
          {/* Header with month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="font-semibold text-(--color-secondary)">
              {monthNames[month]} {year}
            </div>
            <button
              onClick={() => navigateMonth("next")}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const disabled = isDateDisabled(day);
              const selected = isDateSelected(day);

              return (
                <button
                  key={day}
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={cn(
                    "h-9 w-9 text-sm rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-(--color-accent)",
                    disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "hover:bg-gray-100 cursor-pointer",
                    selected &&
                      "bg-(--color-accent) text-white hover:bg-(--color-accent)",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

DatePicker.displayName = "DatePicker";
