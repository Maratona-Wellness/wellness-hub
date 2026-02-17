# ADR-004: Database Design

## Status

Accepted

## Date

2024-01-15

## Context

O sistema precisa de um modelo de dados que suporte:

- Multi-tenancy com isolamento
- Agendamentos de serviços de bem-estar
- Disponibilidade de terapeutas por local
- Histórico e auditoria
- Performance para consultas frequentes

## Decision Drivers

- **Integridade**: ACID compliance
- **Performance**: Queries otimizadas para casos de uso principais
- **Flexibilidade**: Suportar diferentes configurações por tenant
- **Auditabilidade**: Rastrear todas as operações importantes

## Decision

Usar **PostgreSQL** com modelo relacional normalizado + campos JSON para configurações flexíveis.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐
│   Tenant    │───────│    User     │
└─────────────┘       └─────────────┘
      │                     │
      │   ┌─────────────────┼─────────────────┐
      │   │                 │                 │
      ▼   ▼                 ▼                 ▼
┌─────────────┐       ┌─────────────┐   ┌─────────────┐
│  Location   │       │   Program   │   │ Appointment │
└─────────────┘       └─────────────┘   └─────────────┘
      │                                       │
      │  ┌────────────────────────────────────┘
      ▼  ▼
┌──────────────────────┐
│ TherapistLocationLink│
└──────────────────────┘
      │
      ▼
┌─────────────────┐
│ AvailabilitySlot│
└─────────────────┘
```

## Core Entities

### Tenant

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  allowed_domains TEXT[] NOT NULL, -- Ex: ['empresa.com.br']
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB, -- Configurações flexíveis
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'EMPLOYEE',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('EMPLOYEE', 'THERAPIST', 'TENANT_ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
```

### Location

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

### Program

```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  min_advance_hours INTEGER DEFAULT 2,
  max_advance_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

### Appointment

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(20) UNIQUE NOT NULL, -- Ex: APT-A1B2C3
  user_id UUID NOT NULL REFERENCES users(id),
  therapist_id UUID NOT NULL REFERENCES users(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status DEFAULT 'SCHEDULED',
  check_in_status check_in_status,
  check_in_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE appointment_status AS ENUM (
  'SCHEDULED', 'CHECKED_IN', 'COMPLETED',
  'CANCELLED_BY_USER', 'CANCELLED_BY_THERAPIST', 'NO_SHOW'
);
CREATE TYPE check_in_status AS ENUM ('PENDING', 'CONFIRMED');
```

### AvailabilitySlot

```sql
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  therapist_id UUID NOT NULL REFERENCES users(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE(therapist_id, location_id, day_of_week, start_time)
);
```

## Indexes Strategy

```sql
-- High-frequency queries
CREATE INDEX idx_appointments_user ON appointments(user_id, date);
CREATE INDEX idx_appointments_therapist ON appointments(therapist_id, date);
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, date, status);
CREATE INDEX idx_availability_therapist ON availability_slots(therapist_id, day_of_week);
CREATE INDEX idx_users_tenant ON users(tenant_id, role, status);
CREATE INDEX idx_users_email ON users(email);
```

## Query Patterns

### Find available slots

```sql
SELECT DISTINCT
  t.start_time,
  t.end_time
FROM availability_slots t
WHERE t.therapist_id = $1
  AND t.location_id = $2
  AND t.day_of_week = EXTRACT(DOW FROM $3::date)
  AND NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.therapist_id = t.therapist_id
      AND a.date = $3
      AND a.status NOT IN ('CANCELLED_BY_USER', 'CANCELLED_BY_THERAPIST')
      AND (
        (a.start_time < t.end_time AND a.end_time > t.start_time)
      )
  );
```

### Dashboard metrics

```sql
SELECT
  COUNT(*) FILTER (WHERE date = CURRENT_DATE) as today,
  COUNT(*) FILTER (WHERE date >= date_trunc('week', CURRENT_DATE)) as this_week,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
FROM appointments
WHERE tenant_id = $1
  AND date >= date_trunc('month', CURRENT_DATE);
```

## Audit Trail

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

## Consequences

### Positive

- Modelo normalizado evita duplicação
- Índices otimizados para queries frequentes
- Enum types garantem consistência
- JSONB para flexibilidade onde necessário
- Audit trail completo

### Negative

- Joins necessários para algumas queries
- Enums requerem migration para alteração

### Future Considerations

1. **Partitioning**: Se appointments crescer muito, particionar por date
2. **Read Replicas**: Para queries de relatórios
3. **Archiving**: Mover dados antigos para storage frio

## References

- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Index Design Patterns](https://use-the-index-luke.com/)
