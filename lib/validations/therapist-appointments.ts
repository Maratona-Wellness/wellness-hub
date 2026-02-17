import { z } from "zod/v4";

// ============================================================================
// SCHEMAS DE THERAPIST APPOINTMENTS
// ============================================================================

/**
 * Schema para listagem de agendamentos do terapeuta (calendário)
 */
export const listTherapistAppointmentsSchema = z.object({
  view: z.enum(["day", "week", "month"]).default("week"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD")
    .optional(),
  tenantId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  programId: z.uuid().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", "all"])
    .default("all"),
});

export type ListTherapistAppointmentsQuery = z.infer<
  typeof listTherapistAppointmentsSchema
>;

/**
 * Schema para visualização diária do terapeuta
 */
export const therapistDailySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD")
    .optional(),
});

export type TherapistDailyQuery = z.infer<typeof therapistDailySchema>;

/**
 * Schema para check-in de presença
 */
export const checkInSchema = z.object({
  status: z.enum(["COMPLETED", "NO_SHOW"], {
    error: "Status deve ser COMPLETED ou NO_SHOW",
  }),
  notes: z
    .string()
    .max(500, "As observações devem ter no máximo 500 caracteres")
    .optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

/**
 * Schema para histórico de atendimentos
 */
export const therapistHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  tenantId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  programId: z.uuid().optional(),
  status: z.enum(["COMPLETED", "NO_SHOW", "CANCELLED", "all"]).default("all"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  sortBy: z.enum(["startAt", "status"]).default("startAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TherapistHistoryQuery = z.infer<typeof therapistHistorySchema>;
