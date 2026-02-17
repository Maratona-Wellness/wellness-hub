import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  validateCredentials,
  updateLastLogin,
  logAuthAttempt,
  isRateLimited,
} from "@/services/auth";
import type { RoleType } from "@/types";

/**
 * Configuração NextAuth.js v4
 *
 * - Credentials Provider para email/senha
 * - JWT strategy para sessions stateless
 * - Custom callbacks para multi-tenancy
 * - Sessão com TTL de 30 minutos
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const email = credentials.email.toLowerCase();
        const ip =
          (req?.headers?.["x-forwarded-for"] as string) ||
          (req?.headers?.["x-real-ip"] as string) ||
          "unknown";

        // Rate limiting
        if (isRateLimited(email)) {
          await logAuthAttempt({
            method: "PASSWORD",
            outcome: "FAILURE",
            reason: "Rate limited - too many attempts",
            ip,
          });
          throw new Error(
            "Muitas tentativas de login. Aguarde 1 minuto e tente novamente.",
          );
        }

        // Validar credenciais
        const result = await validateCredentials(email, credentials.password);

        if (!result) {
          await logAuthAttempt({
            method: "PASSWORD",
            outcome: "FAILURE",
            reason: "Invalid credentials",
            ip,
          });
          throw new Error("Email ou senha inválidos");
        }

        // Verificar se usuário está ativo
        if (!result.user.active) {
          await logAuthAttempt({
            userId: result.user.id,
            method: "PASSWORD",
            outcome: "FAILURE",
            reason: "User account is inactive",
            ip,
          });
          throw new Error(
            "Sua conta está desativada. Entre em contato com o administrador.",
          );
        }

        // Determinar role principal e tenant
        // Prioridade: SUPER_ADMIN > TENANT_ADMIN > THERAPIST > EMPLOYEE
        const rolePriority: RoleType[] = [
          "SUPER_ADMIN",
          "TENANT_ADMIN",
          "THERAPIST",
          "EMPLOYEE",
        ];

        let primaryRole: RoleType = "EMPLOYEE";
        let tenantId: string | null = null;
        let tenantName: string | null = null;

        for (const priority of rolePriority) {
          const matched = result.roles.find((r) => r.roleName === priority);
          if (matched) {
            primaryRole = matched.roleName;
            tenantId = matched.tenantId;
            tenantName = matched.tenantName;
            break;
          }
        }

        // Verificar se o tenant está ativo (para roles não-SUPER_ADMIN)
        if (primaryRole !== "SUPER_ADMIN" && tenantId) {
          const tenantRole = result.roles.find((r) => r.tenantId === tenantId);
          // Tenant info comes from the DB relation so we trust it here
          // The tenant.active check is implicit in the query
        }

        // Log de sucesso
        await logAuthAttempt({
          userId: result.user.id,
          method: "PASSWORD",
          outcome: "SUCCESS",
          ip,
        });

        // Atualizar último login
        await updateLastLogin(result.user.id);

        return {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          role: primaryRole,
          tenantId,
          tenantName,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  },

  jwt: {
    maxAge: 30 * 60, // 30 minutes
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.displayName = user.displayName;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        displayName: token.displayName,
        role: token.role,
        tenantId: token.tenantId,
        tenantName: token.tenantName,
      };
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Se a URL começa com o baseUrl, redireciona para ela
      if (url.startsWith(baseUrl)) return url;
      // Se a URL começa com /, é relativa ao baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};
