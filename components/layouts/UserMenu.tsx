"use client";

import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, type DropdownOption } from "@/components/molecules/Dropdown";
import { User, Settings, LogOut, HelpCircle } from "lucide-react";

export interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
  onLogoutClick?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onLogoutClick,
}) => {
  const options: DropdownOption[] = [
    {
      label: "Perfil",
      value: "profile",
      icon: <User className="h-4 w-4" />,
    },
    {
      label: "Configurações",
      value: "settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      label: "Ajuda",
      value: "help",
      icon: <HelpCircle className="h-4 w-4" />,
    },
    { divider: true, label: "", value: "divider" },
    {
      label: "Sair",
      value: "logout",
      icon: <LogOut className="h-4 w-4" />,
    },
  ];

  const handleSelect = (value: string) => {
    switch (value) {
      case "profile":
        onProfileClick?.();
        break;
      case "settings":
        onSettingsClick?.();
        break;
      case "help":
        onHelpClick?.();
        break;
      case "logout":
        onLogoutClick?.();
        break;
    }
  };

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors">
          <Avatar name={user.name} src={user.avatar} size="sm" />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-(--color-secondary)">
              {user.name}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </button>
      }
      options={options}
      onSelect={handleSelect}
      align="right"
    />
  );
};

UserMenu.displayName = "UserMenu";
