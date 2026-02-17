import { z } from "zod/v4";

/**
 * Schema de validação para criação de tenant
 */
export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres"),
  domain: z
    .string()
    .min(3, "O domínio deve ter pelo menos 3 caracteres")
    .max(100, "O domínio deve ter no máximo 100 caracteres")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/,
      "Formato de domínio inválido (ex: empresa.com.br)",
    ),
  logoUrl: z.string().url("URL do logo inválida").optional().or(z.literal("")),
  active: z.boolean().optional().default(true),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

/**
 * Schema de validação para atualização de tenant
 */
export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres")
    .optional(),
  logoUrl: z.string().url("URL do logo inválida").optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

/**
 * Schema de validação para criação de location
 */
export const createLocationSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres"),
  address: z
    .string()
    .min(5, "O endereço deve ter pelo menos 5 caracteres")
    .max(500, "O endereço deve ter no máximo 500 caracteres"),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

/**
 * Schema de validação para atualização de location
 */
export const updateLocationSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres")
    .optional(),
  address: z
    .string()
    .min(5, "O endereço deve ter pelo menos 5 caracteres")
    .max(500, "O endereço deve ter no máximo 500 caracteres")
    .optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

/**
 * Schema de validação para o wizard de criação de tenant (todos os steps)
 */
export const createTenantWizardSchema = z.object({
  // Step 1: Dados da empresa
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres"),
  domain: z
    .string()
    .min(3, "O domínio deve ter pelo menos 3 caracteres")
    .max(100, "O domínio deve ter no máximo 100 caracteres")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/,
      "Formato de domínio inválido (ex: empresa.com.br)",
    ),
  logoUrl: z.string().url("URL do logo inválida").optional().or(z.literal("")),

  // Step 2: Localizações
  locations: z
    .array(createLocationSchema)
    .min(1, "Pelo menos uma localização é necessária"),

  // Step 3: Admin do tenant
  adminName: z
    .string()
    .min(2, "O nome do admin deve ter pelo menos 2 caracteres")
    .max(100, "O nome do admin deve ter no máximo 100 caracteres"),
  adminEmail: z.email("Email do admin inválido"),
  adminPassword: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[0-9]/, "A senha deve conter pelo menos 1 número")
    .regex(
      /[^a-zA-Z0-9]/,
      "A senha deve conter pelo menos 1 caractere especial",
    ),
});

export type CreateTenantWizardInput = z.infer<typeof createTenantWizardSchema>;

/**
 * Schema para resolução de domínio
 */
export const resolveDomainSchema = z.object({
  domain: z.string().min(1, "O domínio é obrigatório"),
});

export type ResolveDomainInput = z.infer<typeof resolveDomainSchema>;

/**
 * Schema para listagem de tenants com filtros
 */
export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "all"]).optional().default("all"),
  sortBy: z
    .enum(["name", "domain", "createdAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;

/**
 * Schema para settings do tenant admin
 */
export const updateTenantSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(200, "O nome deve ter no máximo 200 caracteres")
    .optional(),
  logoUrl: z.string().url("URL do logo inválida").optional().or(z.literal("")),
});

export type UpdateTenantSettingsInput = z.infer<
  typeof updateTenantSettingsSchema
>;
