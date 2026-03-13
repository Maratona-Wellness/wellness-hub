import { z } from "zod/v4";

// ============================================================================
// HELPER: Validação de formato HH:MM
// ============================================================================

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isValidTimeFormat(value: string): boolean {
  return timeFormatRegex.test(value);
}

/**
 * Converte string HH:MM para minutos desde meia-noite
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// ============================================================================
// SCHEMAS DE PROGRAM
// ============================================================================

/**
 * Schema para criação de programa
 */
export const createProgramSchema = z
  .object({
    name: z
      .string()
      .min(2, "O nome deve ter pelo menos 2 caracteres")
      .max(200, "O nome deve ter no máximo 200 caracteres"),
    tenantId: z.uuid("ID do tenant inválido").optional(),
    sessionDurationMinutes: z
      .number()
      .int("A duração deve ser um número inteiro")
      .min(10, "A duração mínima é de 10 minutos")
      .max(480, "A duração máxima é de 480 minutos (8 horas)"),
    dayStart: z
      .string()
      .refine(isValidTimeFormat, "Formato inválido. Use HH:MM (ex: 08:00)"),
    dayEnd: z
      .string()
      .refine(isValidTimeFormat, "Formato inválido. Use HH:MM (ex: 18:00)"),
    dailyCapacityPerLocation: z
      .number()
      .int("A capacidade deve ser um número inteiro")
      .min(1, "A capacidade mínima é 1")
      .max(100, "A capacidade máxima é 100"),
    active: z.boolean().optional().default(true),
    tenantIds: z.array(z.uuid("ID do tenant inválido")).optional(),
  })
  .refine((data) => timeToMinutes(data.dayEnd) > timeToMinutes(data.dayStart), {
    message: "O horário de término deve ser posterior ao horário de início",
    path: ["dayEnd"],
  });

export type CreateProgramInput = z.infer<typeof createProgramSchema>;

/**
 * Schema para atualização de programa
 */
export const updateProgramSchema = z
  .object({
    name: z
      .string()
      .min(2, "O nome deve ter pelo menos 2 caracteres")
      .max(200, "O nome deve ter no máximo 200 caracteres")
      .optional(),
    sessionDurationMinutes: z
      .number()
      .int("A duração deve ser um número inteiro")
      .min(10, "A duração mínima é de 10 minutos")
      .max(480, "A duração máxima é de 480 minutos (8 horas)")
      .optional(),
    dayStart: z
      .string()
      .refine(isValidTimeFormat, "Formato inválido. Use HH:MM (ex: 08:00)")
      .optional(),
    dayEnd: z
      .string()
      .refine(isValidTimeFormat, "Formato inválido. Use HH:MM (ex: 18:00)")
      .optional(),
    dailyCapacityPerLocation: z
      .number()
      .int("A capacidade deve ser um número inteiro")
      .min(1, "A capacidade mínima é 1")
      .max(100, "A capacidade máxima é 100")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.dayStart && data.dayEnd) {
        return timeToMinutes(data.dayEnd) > timeToMinutes(data.dayStart);
      }
      return true;
    },
    {
      message: "O horário de término deve ser posterior ao horário de início",
      path: ["dayEnd"],
    },
  );

export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;

/**
 * Schema de query para listagem de programas
 */
export const listProgramsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "all"]).default("all"),
  tenantId: z.uuid("ID do tenant inválido").optional(),
  sortBy: z
    .enum(["name", "createdAt", "sessionDurationMinutes"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListProgramsQuery = z.infer<typeof listProgramsQuerySchema>;

// ============================================================================
// SCHEMAS DE AVAILABILITY
// ============================================================================

/**
 * Schema para geração de slots de disponibilidade em lote
 */
export const generateSlotsSchema = z
  .object({
    programId: z.uuid("ID do programa inválido"),
    locationId: z.uuid("ID da localização inválido"),
    therapistIds: z
      .array(z.uuid("ID do terapeuta inválido"))
      .min(1, "Selecione pelo menos um terapeuta"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD"),
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Selecione pelo menos um dia da semana"),
    breakStart: z
      .string()
      .refine(isValidTimeFormat, "Formato inválido. Use HH:MM (ex: 12:00)")
      .optional(),
    breakEnd: z
      .string()
      .refine(isValidTimeFormat, "Formato inválido. Use HH:MM (ex: 13:00)")
      .optional(),
    breakBetweenSlotsMinutes: z
      .number()
      .int("O intervalo deve ser um número inteiro")
      .min(0, "O intervalo mínimo é 0 minutos")
      .max(120, "O intervalo máximo é 120 minutos")
      .optional()
      .default(0),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "A data final deve ser posterior ou igual à data inicial",
    path: ["endDate"],
  })
  .refine(
    (data) =>
      new Date(data.startDate) >=
      new Date(new Date().toISOString().split("T")[0]),
    {
      message: "A data inicial deve ser hoje ou no futuro",
      path: ["startDate"],
    },
  )
  .refine(
    (data) => {
      if (data.breakStart && data.breakEnd) {
        return timeToMinutes(data.breakEnd) > timeToMinutes(data.breakStart);
      }
      if (data.breakStart && !data.breakEnd) return false;
      if (!data.breakStart && data.breakEnd) return false;
      return true;
    },
    {
      message:
        "Informe início e fim do intervalo, e o fim deve ser posterior ao início",
      path: ["breakEnd"],
    },
  );

export type GenerateSlotsInput = z.infer<typeof generateSlotsSchema>;

/**
 * Schema para consulta de availability slots
 */
export const listAvailabilitySlotsSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD")
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  programId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  therapistId: z.uuid().optional(),
  tenantId: z.uuid().optional(),
  onlyAvailable: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export type ListAvailabilitySlotsQuery = z.infer<
  typeof listAvailabilitySlotsSchema
>;

/**
 * Schema para listagem paginada de slots (SUPER_ADMIN)
 */
export const listSlotsPaginatedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tenantId: z.uuid().optional(),
  programId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  therapistId: z.uuid().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  status: z.enum(["all", "available", "full"]).default("all"),
  sortBy: z.enum(["slotDate", "startTime", "createdAt"]).default("slotDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListSlotsPaginatedQuery = z.infer<typeof listSlotsPaginatedSchema>;

/**
 * Schema para overview de disponibilidade (TENANT_ADMIN)
 */
export const availabilityOverviewSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  locationId: z.uuid().optional(),
  programId: z.uuid().optional(),
});

export type AvailabilityOverviewQuery = z.infer<
  typeof availabilityOverviewSchema
>;
