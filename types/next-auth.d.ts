import type { RoleType } from "@/types";

/**
 * Extensão dos tipos do NextAuth para incluir
 * campos customizados no JWT e na sessão
 */
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    displayName: string;
    role: RoleType;
    tenantId: string | null;
    tenantName: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      displayName: string;
      role: RoleType;
      tenantId: string | null;
      tenantName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    displayName: string;
    role: RoleType;
    tenantId: string | null;
    tenantName: string | null;
  }
}
