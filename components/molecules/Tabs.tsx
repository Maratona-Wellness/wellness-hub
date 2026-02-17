"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = "default",
  className,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id,
  );

  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  const variantStyles = {
    default: {
      list: "border-b border-gray-200",
      button: "pb-3 border-b-2 border-transparent",
      active: "border-(--color-accent) text-(--color-accent)",
      inactive:
        "text-gray-600 hover:text-(--color-secondary) hover:border-gray-300",
    },
    pills: {
      list: "",
      button: "rounded-lg px-4 py-2",
      active: "bg-(--color-accent) text-white",
      inactive: "text-gray-600 hover:bg-gray-100",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn("w-full", className)}>
      {/* Tab List */}
      <div className={cn("flex gap-1", styles.list)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 font-medium text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2",
              styles.button,
              activeTab === tab.id ? styles.active : styles.inactive,
              tab.disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panel */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="mt-4"
      >
        {activeTabContent}
      </div>
    </div>
  );
};

Tabs.displayName = "Tabs";
