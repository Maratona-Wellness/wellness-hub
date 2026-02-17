import { type LucideIcon } from "lucide-react";
import {
  Home,
  Calendar,
  Users,
  Building2,
  UserCog,
  Clock,
  BarChart3,
  Settings,
  Package,
  FileText,
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: MenuItem[];
}

export type RoleType =
  | "EMPLOYEE"
  | "THERAPIST"
  | "TENANT_ADMIN"
  | "SUPER_ADMIN";

// Configuração de menus por role
export const menuConfig: Record<RoleType, MenuItem[]> = {
  // Menu para funcionários (agendamento de sessões)
  EMPLOYEE: [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Meus Agendamentos",
      href: "/appointments",
      icon: Calendar,
    },
    {
      label: "Novo Agendamento",
      href: "/appointments/new",
      icon: Clock,
    },
    {
      label: "Meu Perfil",
      href: "/profile",
      icon: UserCog,
    },
  ],

  // Menu para terapeutas (gestão de agenda e atendimentos)
  THERAPIST: [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Calendário",
      href: "/therapist/calendar",
      icon: Calendar,
    },
    {
      label: "Agenda do Dia",
      href: "/therapist/daily",
      icon: Clock,
    },
    {
      label: "Disponibilidade",
      href: "/therapist/availability",
      icon: Clock,
    },
    {
      label: "Histórico",
      href: "/therapist/history",
      icon: FileText,
    },
    {
      label: "Meu Perfil",
      href: "/therapist/profile",
      icon: UserCog,
    },
  ],

  // Menu para admin do tenant (gestão da empresa)
  TENANT_ADMIN: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Agendamentos",
      href: "/admin/appointments",
      icon: Calendar,
    },
    {
      label: "Funcionários",
      href: "/admin/employees",
      icon: Users,
    },
    {
      label: "Programas",
      href: "/admin/programs",
      icon: Package,
    },
    {
      label: "Disponibilidade",
      href: "/admin/availability",
      icon: Clock,
    },
    {
      label: "Relatórios",
      href: "/admin/reports",
      icon: BarChart3,
    },
    {
      label: "Configurações",
      href: "/admin/settings",
      icon: Settings,
    },
  ],

  // Menu para super admin (gestão global)
  SUPER_ADMIN: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Empresas",
      href: "/superadmin/tenants",
      icon: Building2,
    },
    {
      label: "Usuários",
      href: "/superadmin/users",
      icon: Users,
    },
    {
      label: "Terapeutas",
      href: "/superadmin/therapists",
      icon: UserCog,
    },
    {
      label: "Programas",
      href: "/superadmin/programs",
      icon: Package,
    },
    {
      label: "Disponibilidade",
      href: "/superadmin/availability",
      icon: Clock,
    },
    {
      label: "Agendamentos",
      href: "/superadmin/appointments",
      icon: Calendar,
    },
    {
      label: "Relatórios",
      href: "/superadmin/reports",
      icon: BarChart3,
    },
    {
      label: "Logs de Acesso",
      href: "/superadmin/logs",
      icon: FileText,
    },
    {
      label: "Configurações",
      href: "/superadmin/settings",
      icon: Settings,
    },
  ],
};

// Helper para obter menu baseado na role
export const getMenuForRole = (role: RoleType): MenuItem[] => {
  return menuConfig[role] || menuConfig.EMPLOYEE;
};
