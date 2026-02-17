/**
 * Tipos auxiliares para DTOs e tipos exportados do Prisma
 */

import type { AppointmentStatus, Location } from "@prisma/client";

// Re-export dos tipos Prisma
export type {
  Tenant,
  Location,
  Program,
  UserAccount,
  Role,
  UserRole,
  Employee,
  Therapist,
  TherapistAssignment,
  AvailabilitySlot,
  Appointment,
  MagicToken,
  AuthLog,
} from "@prisma/client";

// Re-export dos enums
export {
  RoleType,
  AppointmentStatus,
  AuthMethod,
  AuthOutcome,
} from "@prisma/client";

// Tipos de criação (sem campos gerados automaticamente)
export type CreateTenantDTO = {
  name: string;
  domain: string;
  logoUrl?: string;
  active?: boolean;
};

export type CreateLocationDTO = {
  tenantId: string;
  name: string;
  address: string;
};

export type CreateProgramDTO = {
  tenantId: string;
  name: string;
  sessionDurationMinutes: number;
  dayStart: string;
  dayEnd: string;
  dailyCapacityPerLocation: number;
  active?: boolean;
};

export type CreateEmployeeDTO = {
  tenantId: string;
  email: string;
  name: string;
  userId?: string;
  active?: boolean;
};

export type CreateTherapistDTO = {
  email: string;
  name: string;
  cpf: string;
  specialties?: string;
  userId?: string;
  active?: boolean;
};

export type CreateAppointmentDTO = {
  tenantId: string;
  employeeId: string;
  therapistId: string;
  locationId: string;
  programId: string;
  slotId: string;
  startAt: Date;
  endAt: Date;
  code: string;
};

export type CreateAvailabilitySlotDTO = {
  tenantId: string;
  locationId: string;
  therapistId: string;
  programId: string;
  slotDate: Date;
  startTime: string;
  endTime: string;
  capacity?: number;
};

// Tipos de atualização
export type UpdateTenantDTO = Partial<Omit<CreateTenantDTO, "domain">>;
export type UpdateLocationDTO = Partial<Omit<CreateLocationDTO, "tenantId">>;
export type UpdateProgramDTO = Partial<Omit<CreateProgramDTO, "tenantId">>;
export type UpdateEmployeeDTO = Partial<
  Omit<CreateEmployeeDTO, "tenantId" | "email">
>;
export type UpdateTherapistDTO = Partial<
  Omit<CreateTherapistDTO, "email" | "cpf">
>;

// Tipos de resposta com relacionamentos
export type TenantWithLocations = {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  locations: Location[];
};

export type AppointmentWithDetails = {
  id: string;
  tenantId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  code: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
  therapist: {
    id: string;
    name: string;
    specialties: string | null;
  };
  location: {
    id: string;
    name: string;
    address: string;
  };
  program: {
    id: string;
    name: string;
    sessionDurationMinutes: number;
  };
};

// Tipos utilitários
export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
