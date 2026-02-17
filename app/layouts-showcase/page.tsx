"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layouts";
import { type RoleType } from "@/lib/config/menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Tabs } from "@/components/molecules/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb, useBreadcrumbs } from "@/components/layouts/Breadcrumb";

const roles: { value: RoleType; label: string; description: string }[] = [
  {
    value: "EMPLOYEE",
    label: "Funcionário",
    description: "Usuário padrão que agenda sessões",
  },
  {
    value: "THERAPIST",
    label: "Terapeuta",
    description: "Profissional que atende sessões",
  },
  {
    value: "TENANT_ADMIN",
    label: "Admin da Empresa",
    description: "Administrador de tenant",
  },
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Administrador global",
  },
];

export default function LayoutsShowcasePage() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("EMPLOYEE");
  const breadcrumbs = useBreadcrumbs();

  const currentRoleInfo = roles.find((r) => r.value === selectedRole)!;

  return (
    <DashboardLayout
      user={{
        name: "Demo User",
        email: "demo@wellness.com",
        role: selectedRole,
      }}
      notificationCount={3}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Text variant="h1" className="mb-2">
            Layouts Showcase
          </Text>
          <Text variant="p" className="text-gray-600 mb-4">
            Demonstração dos layouts com diferentes perfis de usuário
          </Text>
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Role Selector */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Selecione um Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedRole === role.value
                      ? "border-(--color-accent) bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Text variant="h4" className="text-base">
                      {role.label}
                    </Text>
                    {selectedRole === role.value && (
                      <Badge variant="success">Ativo</Badge>
                    )}
                  </div>
                  <Text variant="span" className="text-sm text-gray-600">
                    {role.description}
                  </Text>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Role Info */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil Atual: {currentRoleInfo.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Text variant="span" className="font-medium">
                  Descrição:
                </Text>
                <Text variant="p" className="text-gray-600">
                  {currentRoleInfo.description}
                </Text>
              </div>
              <div>
                <Text variant="span" className="font-medium mb-2 block">
                  Menu visível no sidebar:
                </Text>
                <Text variant="span" className="text-sm text-gray-600">
                  Confira o menu lateral para ver as opções disponíveis para
                  este perfil. O menu é filtrado automaticamente baseado na role
                  do usuário.
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades do Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              tabs={[
                {
                  id: "responsive",
                  label: "Responsivo",
                  content: (
                    <div className="space-y-2">
                      <Text variant="p">
                        • Sidebar colapsável em mobile com overlay
                      </Text>
                      <Text variant="p">
                        • Navbar adaptável para diferentes tamanhos de tela
                      </Text>
                      <Text variant="p">• Grid responsivo para conteúdo</Text>
                    </div>
                  ),
                },
                {
                  id: "navigation",
                  label: "Navegação",
                  content: (
                    <div className="space-y-2">
                      <Text variant="p">
                        • Menus dinâmicos baseados em role
                      </Text>
                      <Text variant="p">• Breadcrumbs automáticos</Text>
                      <Text variant="p">• Highlight de item ativo no menu</Text>
                      <Text variant="p">• Suporte a sub-menus expansíveis</Text>
                    </div>
                  ),
                },
                {
                  id: "user",
                  label: "Usuário",
                  content: (
                    <div className="space-y-2">
                      <Text variant="p">
                        • Avatar com fallback para iniciais
                      </Text>
                      <Text variant="p">
                        • Dropdown com perfil, configurações e logout
                      </Text>
                      <Text variant="p">
                        • Sistema de notificações com badge
                      </Text>
                    </div>
                  ),
                },
                {
                  id: "pages",
                  label: "Páginas Globais",
                  content: (
                    <div className="space-y-2">
                      <Text variant="p">
                        • Loading: Página de carregamento global
                      </Text>
                      <Text variant="p">• Error: Error boundary com retry</Text>
                      <Text variant="p">
                        • Not Found: Página 404 personalizada
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Páginas de Exemplo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full"
              >
                Dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/login")}
                className="w-full"
              >
                Login (AuthLayout)
              </Button>
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/appointments")}
                className="w-full"
              >
                Agendamentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
