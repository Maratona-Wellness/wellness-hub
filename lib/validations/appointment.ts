import { z } from "zod/v4";

// ============================================================================
// SCHEMAS DE APPOINTMENT — EMPLOYEE
// ============================================================================

/**
 * Schema para criação de agendamento pelo funcionário
 */
export const createAppointmentSchema = z.object({
  programId: z.uuid("ID do programa inválido"),
  locationId: z.uuid("ID da localização inválido"),
  slotId: z.uuid("ID do slot inválido"),
  therapistId: z.uuid("ID do terapeuta inválido"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD"),
  startTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Formato de hora inválido. Use HH:MM",
    ),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/**
 * Schema para listagem de agendamentos do funcionário
 */
export const listEmployeeAppointmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["upcoming", "completed", "cancelled", "all"]).default("all"),
  programId: z.uuid().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
});

export type ListEmployeeAppointmentsQuery = z.infer<
  typeof listEmployeeAppointmentsSchema
>;

/**
 * Schema para cancelamento de agendamento
 */
export const cancelAppointmentSchema = z.object({
  reason: z
    .string()
    .max(500, "O motivo deve ter no máximo 500 caracteres")
    .optional(),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

/**
 * Schema para atualização de perfil do funcionário
 */
export const updateEmployeeProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .optional(),
  displayName: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .optional(),
});

export type UpdateEmployeeProfileInput = z.infer<
  typeof updateEmployeeProfileSchema
>;

/**
 * Schema para alteração de senha pelo funcionário
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres")
      .regex(/[0-9]/, "A nova senha deve conter pelo menos 1 número")
      .regex(
        /[^a-zA-Z0-9]/,
        "A nova senha deve conter pelo menos 1 caractere especial",
      ),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Schema para consulta de datas disponíveis
 */
export const availableDatesQuerySchema = z.object({
  programId: z.uuid("ID do programa inválido"),
  locationId: z.uuid("ID da localização inválido"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido")
    .optional(),
});

export type AvailableDatesQuery = z.infer<typeof availableDatesQuerySchema>;

/**
 * Schema para consulta de slots de uma data
 */
export const availableSlotsQuerySchema = z.object({
  programId: z.uuid("ID do programa inválido"),
  locationId: z.uuid("ID da localização inválido"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD"),
});

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
