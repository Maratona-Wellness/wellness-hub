"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import { useAuth } from "@/lib/hooks";
import {
  User,
  Mail,
  Building2,
  Lock,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeProfile {
  user: {
    id: string;
    email: string;
    displayName: string;
    active: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
  employee: {
    id: string;
    name: string;
    email: string;
    tenantName: string;
  };
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit form
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ========================================================================
  // FETCH PROFILE
  // ========================================================================

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/employee/profile");
        const json = await res.json();

        if (json.success) {
          setProfile(json.data);
          setName(json.data.employee.name);
        } else {
          setError(json.error || "Erro ao carregar perfil");
        }
      } catch {
        setError("Erro de conexão");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // ========================================================================
  // UPDATE PROFILE
  // ========================================================================

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("O nome é obrigatório");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();

      if (json.success) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                employee: { ...prev.employee, name: name.trim() },
                user: { ...prev.user, displayName: name.trim() },
              }
            : prev,
        );
        setSuccess("Perfil atualizado com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(json.error || "Erro ao atualizar perfil");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  // ========================================================================
  // CHANGE PASSWORD
  // ========================================================================

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/employee/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();

      if (json.success) {
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("Senha alterada com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setPasswordError(json.error || "Erro ao alterar senha");
      }
    } catch {
      setPasswordError("Erro de conexão");
    } finally {
      setChangingPassword(false);
    }
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Text variant="h1" className="mb-6">
          Meu Perfil
        </Text>

        {/* Success */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Profile Form */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4" />
                  Nome Completo
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input value={profile?.user?.email || ""} disabled />
                <p className="text-xs text-gray-400 mt-1">
                  O email não pode ser alterado
                </p>
              </div>

              {/* Tenant (read-only) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="h-4 w-4" />
                  Empresa
                </label>
                <Input value={profile?.employee?.tenantName || ""} disabled />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-(--color-secondary)">Senha</p>
                <p className="text-sm text-gray-500">
                  Altere sua senha de acesso
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowPasswordModal(true)}
                leftIcon={<Lock className="h-4 w-4" />}
              >
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError(null);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
        title="Alterar Senha"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha Atual
            </label>
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <Input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <Input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="rounded"
            />
            Mostrar senhas
          </label>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPasswordModal(false)}
              disabled={changingPassword}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={changingPassword}
            >
              Alterar Senha
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
