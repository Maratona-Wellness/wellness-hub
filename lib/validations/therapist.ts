import { z } from "zod/v4";

// ============================================================================
// VALIDAÇÃO DE CPF
// ============================================================================

/**
 * Valida dígitos verificadores de CPF
 */
function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

// ============================================================================
// SCHEMAS DE THERAPIST
// ============================================================================

/**
 * Schema para criação de terapeuta
 */
export const createTherapistSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres"),
  email: z.email("Email inválido"),
  cpf: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 11, "CPF deve ter 11 dígitos")
    .refine(isValidCPF, "CPF inválido"),
  specialties: z
    .string()
    .max(500, "Especialidades deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[0-9]/, "A senha deve conter pelo menos 1 número")
    .regex(
      /[^a-zA-Z0-9]/,
      "A senha deve conter pelo menos 1 caractere especial",
    ),
});

export type CreateTherapistInput = z.infer<typeof createTherapistSchema>;

/**
 * Schema para atualização de terapeuta (SUPER_ADMIN)
 */
export const updateTherapistSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres")
    .optional(),
  specialties: z
    .string()
    .max(500, "Especialidades deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type UpdateTherapistInput = z.infer<typeof updateTherapistSchema>;

/**
 * Schema para atualização do perfil pelo próprio terapeuta
 */
export const updateTherapistProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres")
    .optional(),
  specialties: z
    .string()
    .max(500, "Especialidades deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[0-9]/, "A senha deve conter pelo menos 1 número")
    .regex(
      /[^a-zA-Z0-9]/,
      "A senha deve conter pelo menos 1 caractere especial",
    )
    .optional(),
});

export type UpdateTherapistProfileInput = z.infer<
  typeof updateTherapistProfileSchema
>;

/**
 * Schema para listagem de terapeutas com filtros
 */
export const listTherapistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "all"]).optional().default("all"),
  tenantId: z.string().uuid().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type ListTherapistsQuery = z.infer<typeof listTherapistsQuerySchema>;

/**
 * Schema para criação de assignment (vinculação)
 */
export const createAssignmentSchema = z.object({
  tenantId: z.string().uuid("ID do tenant inválido"),
  locationIds: z
    .array(z.string().uuid("ID da localização inválido"))
    .min(1, "Selecione pelo menos uma localização"),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
