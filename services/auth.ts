import { prisma } from "@/lib/db/prisma";
import { compare, hash } from "bcryptjs";
import { nanoid } from "nanoid";
import type { AuthMethod, AuthOutcome, RoleType } from "@/types";

const BCRYPT_SALT_ROUNDS = 12;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAGIC_LINK_MAX_RESENDS = 3;
const MAGIC_LINK_RESEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory rate limiter (simple per-process approach)
const loginAttempts = new Map<
  string,
  { count: number; firstAttempt: number }
>();

/**
 * Verifica rate limiting para login por email
 * @returns true se bloqueado, false se permitido
 */
export function isRateLimited(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = loginAttempts.get(key);

  if (!entry) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }

  // Reset window se expirou
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }

  // Incrementar contador
  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }

  return false;
}

/**
 * Registra tentativa de autenticação no AuthLog
 */
export async function logAuthAttempt(params: {
  userId?: string;
  method: AuthMethod;
  outcome: AuthOutcome;
  reason?: string;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.authLog.create({
      data: {
        userId: params.userId || null,
        method: params.method,
        outcome: params.outcome,
        reason: params.reason || null,
        ip: params.ip || null,
      },
    });
  } catch (error) {
    console.error("Failed to log auth attempt:", error);
  }
}

/**
 * Valida credenciais de login (email + senha)
 * Retorna dados do usuário se válido, ou null se inválido
 */
export async function validateCredentials(
  email: string,
  password: string,
): Promise<{
  user: {
    id: string;
    email: string;
    displayName: string;
    active: boolean;
  };
  roles: Array<{
    roleName: RoleType;
    tenantId: string | null;
    tenantName: string | null;
  }>;
} | null> {
  const user = await prisma.userAccount.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      userRoles: {
        include: {
          role: true,
          tenant: {
            select: {
              id: true,
              name: true,
              active: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      active: user.active,
    },
    roles: user.userRoles.map((ur) => ({
      roleName: ur.role.roleName,
      tenantId: ur.tenant?.id || null,
      tenantName: ur.tenant?.name || null,
    })),
  };
}

/**
 * Atualiza o lastLoginAt do usuário
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.userAccount.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

/**
 * Hash de senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Gera um token único criptograficamente seguro
 */
export function generateToken(): string {
  return nanoid(32);
}

/**
 * Hash de token para armazenamento seguro
 */
export async function hashToken(token: string): Promise<string> {
  return hash(token, 10);
}

/**
 * Verifica se um token corresponde ao hash armazenado
 */
export async function verifyToken(
  token: string,
  tokenHash: string,
): Promise<boolean> {
  return compare(token, tokenHash);
}

/**
 * Verifica se já existe uma conta cadastrada para o email informado
 * Retorna informações sobre o status da conta
 */
export async function checkExistingAccount(email: string): Promise<{
  exists: boolean;
  active?: boolean;
}> {
  const user = await prisma.userAccount.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, active: true },
  });

  if (!user) {
    return { exists: false };
  }

  return { exists: true, active: user.active };
}

/**
 * Cria um magic token para signup de funcionário
 */
export async function createMagicToken(
  email: string,
  tenantId: string,
): Promise<{ token: string; expiresAt: Date } | { error: string }> {
  // Verificar limite de reenvios nos últimos 15 minutos
  const recentTokens = await prisma.magicToken.count({
    where: {
      email: email.toLowerCase(),
      createdAt: {
        gte: new Date(Date.now() - MAGIC_LINK_RESEND_WINDOW_MS),
      },
    },
  });

  if (recentTokens >= MAGIC_LINK_MAX_RESENDS) {
    return {
      error:
        "Limite de reenvios atingido. Aguarde 15 minutos antes de solicitar novamente.",
    };
  }

  // Invalidar tokens anteriores não usados do mesmo email
  await prisma.magicToken.updateMany({
    where: {
      email: email.toLowerCase(),
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Gerar novo token
  const token = generateToken();
  const tokenHashValue = await hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_TOKEN_TTL_MS);

  await prisma.magicToken.create({
    data: {
      email: email.toLowerCase(),
      tenantId,
      tokenHash: tokenHashValue,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Valida um magic token sem consumi-lo
 */
export async function validateMagicToken(
  email: string,
  token: string,
): Promise<
  | { valid: true; tenantId: string; tenantName: string }
  | { valid: false; error: string }
> {
  const tokens = await prisma.magicToken.findMany({
    where: {
      email: email.toLowerCase(),
      used: false,
      expiresAt: { gte: new Date() },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          active: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (tokens.length === 0) {
    return { valid: false, error: "Token inválido ou expirado" };
  }

  // Verificar hash do token contra cada registro
  for (const record of tokens) {
    const isMatch = await verifyToken(token, record.tokenHash);
    if (isMatch) {
      if (!record.tenant || !record.tenant.active) {
        return { valid: false, error: "Empresa não encontrada ou inativa" };
      }
      return {
        valid: true,
        tenantId: record.tenant.id,
        tenantName: record.tenant.name,
      };
    }
  }

  return { valid: false, error: "Token inválido" };
}

/**
 * Consome um magic token (marca como usado)
 */
export async function consumeMagicToken(
  email: string,
  token: string,
): Promise<
  { success: true; tenantId: string } | { success: false; error: string }
> {
  const tokens = await prisma.magicToken.findMany({
    where: {
      email: email.toLowerCase(),
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  for (const record of tokens) {
    const isMatch = await verifyToken(token, record.tokenHash);
    if (isMatch) {
      await prisma.magicToken.update({
        where: { id: record.id },
        data: { used: true },
      });
      return {
        success: true,
        tenantId: record.tenantId || "",
      };
    }
  }

  return { success: false, error: "Token inválido ou expirado" };
}

/**
 * Cria um token de reset de senha
 */
export async function createPasswordResetToken(
  email: string,
): Promise<{ token: string; expiresAt: Date } | null> {
  const user = await prisma.userAccount.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return null; // Não revelar se email existe
  }

  // Invalidar tokens de reset anteriores
  await prisma.magicToken.updateMany({
    where: {
      email: email.toLowerCase(),
      used: false,
    },
    data: { used: true },
  });

  const token = generateToken();
  const tokenHashValue = await hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.magicToken.create({
    data: {
      email: email.toLowerCase(),
      tokenHash: tokenHashValue,
      expiresAt,
      tenantId: null, // Reset tokens não precisam de tenantId
    },
  });

  return { token, expiresAt };
}

/**
 * Redefine a senha do usuário após validar o token de reset
 */
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  // Buscar tokens válidos
  const tokens = await prisma.magicToken.findMany({
    where: {
      email: email.toLowerCase(),
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let validTokenId: string | null = null;

  for (const record of tokens) {
    const isMatch = await verifyToken(token, record.tokenHash);
    if (isMatch) {
      validTokenId = record.id;
      break;
    }
  }

  if (!validTokenId) {
    return { success: false, error: "Token inválido ou expirado" };
  }

  const passwordHash = await hashPassword(newPassword);

  // Transação: atualizar senha e consumir token
  await prisma.$transaction([
    prisma.userAccount.update({
      where: { email: email.toLowerCase() },
      data: { passwordHash },
    }),
    prisma.magicToken.update({
      where: { id: validTokenId },
      data: { used: true },
    }),
  ]);

  return { success: true };
}

/**
 * Completa o cadastro de um novo funcionário via magic link
 */
export async function completeSignup(params: {
  email: string;
  token: string;
  name: string;
  password: string;
}): Promise<
  { success: true; userId: string } | { success: false; error: string }
> {
  // Consumir o token
  const tokenResult = await consumeMagicToken(params.email, params.token);
  if (!tokenResult.success) {
    return { success: false, error: tokenResult.error };
  }

  const tenantId = tokenResult.tenantId;

  // Verificar se já existe conta com esse email
  const existingUser = await prisma.userAccount.findUnique({
    where: { email: params.email.toLowerCase() },
  });

  if (existingUser) {
    return { success: false, error: "Já existe uma conta com este email" };
  }

  // Buscar a role EMPLOYEE
  const employeeRole = await prisma.role.findUnique({
    where: { roleName: "EMPLOYEE" },
  });

  if (!employeeRole) {
    return { success: false, error: "Configuração de perfil não encontrada" };
  }

  const passwordHash = await hashPassword(params.password);

  // Transação: criar UserAccount + Employee + UserRole
  const result = await prisma.$transaction(async (tx) => {
    const userAccount = await tx.userAccount.create({
      data: {
        email: params.email.toLowerCase(),
        passwordHash,
        displayName: params.name,
        active: true,
      },
    });

    await tx.employee.create({
      data: {
        tenantId,
        userId: userAccount.id,
        email: params.email.toLowerCase(),
        name: params.name,
        active: true,
      },
    });

    await tx.userRole.create({
      data: {
        userId: userAccount.id,
        roleId: employeeRole.id,
        tenantId,
      },
    });

    return userAccount;
  });

  // TODO: Enviar email de boas-vindas (integrar com Resend/SendGrid)
  console.log(
    `[EMAIL] Boas-vindas enviada para ${params.email} (tenant: ${tenantId})`,
  );

  return { success: true, userId: result.id };
}

/**
 * Busca dados do perfil do usuário logado
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true,
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
              logoUrl: true,
              active: true,
            },
          },
        },
      },
      employee: {
        select: {
          id: true,
          tenantId: true,
          name: true,
          active: true,
        },
      },
      therapist: {
        select: {
          id: true,
          name: true,
          specialties: true,
          active: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    active: user.active,
    lastLoginAt: user.lastLoginAt,
    roles: user.userRoles.map((ur) => ({
      role: ur.role.roleName,
      tenantId: ur.tenant?.id || null,
      tenantName: ur.tenant?.name || null,
    })),
    employee: user.employee,
    therapist: user.therapist,
  };
}

/**
 * Envia email simulado (TODO: integrar com Resend/SendGrid)
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  // TODO: Integrar com serviço de email real (Resend/SendGrid)
  console.log(`[EMAIL] To: ${params.to}`);
  console.log(`[EMAIL] Subject: ${params.subject}`);
  console.log(`[EMAIL] Body: ${params.body}`);
}
