# ADR-002: Multi-Tenancy Strategy

## Status

Accepted

## Date

2024-01-15

## Context

O Maratona QV Wellness Hub é uma plataforma SaaS que atende múltiplas organizações (tenants/empresas). Cada tenant precisa ter:

- Isolamento completo de dados
- Configurações personalizadas
- Usuários independentes
- Relatórios segregados

## Decision Drivers

- **Segurança**: Dados de um tenant nunca devem vazar para outro
- **Custo**: Evitar overhead de múltiplos databases/schemas
- **Simplicidade**: Fácil de implementar e manter
- **Performance**: Queries eficientes mesmo com muitos tenants

## Considered Options

### Option 1: Database per Tenant

**Prós:**

- Isolamento completo
- Fácil backup/restore por tenant
- Performance previsível

**Contras:**

- Complexidade de connection management
- Custo alto com muitos tenants
- Dificuldade em queries cross-tenant (analytics)

### Option 2: Schema per Tenant

**Prós:**

- Bom isolamento
- Um único database

**Contras:**

- Migrations complexas
- Não suportado nativamente pelo Prisma
- Complexidade operacional

### Option 3: Row-Level Tenancy (Chosen)

**Prós:**

- Simplicidade de implementação
- Um único schema
- Migrations simples
- Fácil analytics cross-tenant

**Contras:**

- Risco de query sem filtro de tenant
- Índices maiores
- Necessita RLS ou validação em application layer

## Decision

Implementar **Row-Level Tenancy** com `tenant_id` em todas as tabelas que precisam de isolamento.

### Implementation Details

```sql
-- Todas as tabelas principais têm tenant_id
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  ...
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
```

### Application Layer Enforcement

```typescript
// Middleware extrai tenant do usuário autenticado
const tenantId = session.user.tenantId;

// Todas as queries filtram por tenant
const appointments = await prisma.appointment.findMany({
  where: {
    tenantId, // SEMPRE incluir
    ...otherFilters,
  },
});
```

### Security Measures

1. **Prisma Middleware** (opcional): Intercepta todas as queries para garantir tenant_id
2. **API Layer Validation**: Todas as rotas verificam tenantId da sessão
3. **Audit Logging**: Log de todas as operações com tenant_id

## Consequences

### Positive

- Implementação simples e rápida
- Um único database para gerenciar
- Migrations uniformes
- Fácil fazer relatórios cross-tenant (Super Admin)

### Negative

- Queries sempre precisam do filtro tenant_id
- Tabelas maiores (mais rows)
- Índices compostos necessários para performance

### Mitigations

1. **Code Review rigoroso** para garantir filtros de tenant
2. **Testes automatizados** verificando isolamento
3. **Índices otimizados** (tenant_id, date) para queries comuns
4. **Consideração futura**: PostgreSQL Row Level Security (RLS)

## Tenant Configuration

```typescript
model Tenant {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  allowedDomains String[]  // Domínios de email permitidos
  isActive      Boolean  @default(true)

  // Settings
  settings      Json?    // Configurações flexíveis

  // Relations
  users         User[]
  locations     Location[]
  programs      Program[]
  appointments  Appointment[]
}
```

## Data Flow

```
[Request] → [Auth Middleware] → [Extract tenantId] → [API Route] → [Prisma Query with tenantId]
                    ↓
            [Session has tenantId]
```

## Future Considerations

1. **PostgreSQL RLS**: Se necessário isolamento a nível de database
2. **Caching por Tenant**: Redis com namespace por tenant
3. **Sharding**: Se algum tenant crescer muito, pode ser extraído

## References

- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models)
- [Prisma Multi-tenancy](https://www.prisma.io/docs/guides/other/multi-tenancy)
