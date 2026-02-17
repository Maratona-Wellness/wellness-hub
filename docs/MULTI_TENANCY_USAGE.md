# Multi-Tenancy System - Usage Examples

Este documento demonstra como usar o sistema de multi-tenancy implementado.

## Backend - API Routes

### Exemplo 1: API Route com validação de tenant

```typescript
// app/api/tenants/[tenantId]/employees/route.ts
import { NextRequest } from "next/server";
import { requireTenant } from "@/lib/utils/api-helpers";
import { withTenantScope } from "@/lib/utils/tenant-access";
import { prisma } from "@/lib/db/prisma";

export const GET = requireTenant(async (request, { tenantId, userId }) => {
  // tenantId e userId já estão validados

  const employees = await prisma.employee.findMany({
    where: {
      ...withTenantScope(tenantId),
      active: true,
    },
  });

  return Response.json({ employees });
});
```

### Exemplo 2: API Route apenas para SUPER_ADMIN

```typescript
// app/api/admin/tenants/route.ts
import { requireSuperAdmin } from "@/lib/utils/api-helpers";
import { prisma } from "@/lib/db/prisma";

export const GET = requireSuperAdmin(async (request, { userId }) => {
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
  });

  return Response.json({ tenants });
});
```

### Exemplo 3: Validação manual de acesso

```typescript
import { assertTenantAccess, hasRoleInTenant } from "@/lib/utils/tenant-access";

async function someFunction(userId: string, tenantId: string) {
  // Validar acesso ao tenant (lança TenantAccessError se não tiver acesso)
  await assertTenantAccess(userId, tenantId);

  // Verificar role específica
  const isTenantAdmin = await hasRoleInTenant(userId, tenantId, "TENANT_ADMIN");

  if (isTenantAdmin) {
    // Lógica específica para admins
  }
}
```

## Frontend - React Components

### Exemplo 1: Usar TenantProvider no layout

```typescript
// app/layout.tsx
import { TenantProvider } from '@/lib/contexts/TenantContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
```

### Exemplo 2: Acessar tenant em um componente

```typescript
'use client';

import { useTenant } from '@/lib/contexts/TenantContext';

export function TenantInfo() {
  const { tenant, isLoading, error } = useTenant();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!tenant) return <div>No tenant selected</div>;

  return (
    <div>
      <h2>{tenant.name}</h2>
      <p>Domain: {tenant.domain}</p>
    </div>
  );
}
```

### Exemplo 3: Proteger uma página com TenantGuard

```typescript
'use client';

import { TenantGuard } from '@/components/TenantGuard';

export default function ProtectedPage() {
  return (
    <TenantGuard>
      <div>
        <h1>Protected Content</h1>
        <p>This content only shows when a tenant is available</p>
      </div>
    </TenantGuard>
  );
}
```

### Exemplo 4: Usar HOC withTenantGuard

```typescript
'use client';

import { withTenantGuard } from '@/components/TenantGuard';
import { useRequiredTenant } from '@/lib/contexts/TenantContext';

function MyComponent() {
  const { tenant } = useRequiredTenant(); // tenant garantido não-null

  return <div>Welcome to {tenant.name}</div>;
}

// Exportar componente protegido
export default withTenantGuard(MyComponent);
```

## Utilities

### Exemplo 1: Buscar tenant por email

```typescript
import { getTenantFromDomain } from "@/lib/utils/tenant";

const tenant = await getTenantFromDomain("user@company.com");
// Retorna tenant com domain='company.com'
```

### Exemplo 2: Listar todos os tenants de um usuário

```typescript
import { getUserTenants } from "@/lib/utils/tenant-access";

const tenantIds = await getUserTenants(userId);
// Para SUPER_ADMIN: retorna todos os tenants
// Para outros: retorna apenas tenants onde o usuário tem roles
```

### Exemplo 3: Verificar se é SUPER_ADMIN

```typescript
import { isSuperAdmin } from "@/lib/utils/tenant-access";

if (await isSuperAdmin(userId)) {
  // Permitir acesso administrativo
}
```

## Segurança

### Cross-Tenant Access Prevention

O sistema automaticamente:

1. **Valida acesso ao tenant**: `assertTenantAccess()` verifica se o usuário tem permissão
2. **Loga violações**: Tentativas de acesso não autorizado são registradas em `auth_logs`
3. **Retorna 403**: API routes protegidas retornam Forbidden para acessos inválidos

### Best Practices

1. **Sempre use `withTenantScope()`** em queries do Prisma:

   ```typescript
   // ✅ BOM
   await prisma.employee.findMany({
     where: { ...withTenantScope(tenantId) },
   });

   // ❌ RUIM - pode vazar dados de outros tenants
   await prisma.employee.findMany();
   ```

2. **Use `requireTenant()` ou `requireSuperAdmin()`** em API routes
3. **Use `TenantGuard`** em páginas que precisam de tenant
4. **Sempre valide tenantId** antes de operações sensíveis

## Testando

Para testar manualmente (enquanto não há autenticação completa):

```bash
# Criar um tenant de teste
docker exec wellness-hub-db psql -U wellness -d wellness_hub -c "
  INSERT INTO tenants (id, name, domain, active)
  VALUES ('123e4567-e89b-12d3-a456-426614174000', 'Test Company', 'test.com', true)
"

# Fazer request com headers de teste
curl -H "x-user-id: user-id-here" \
     -H "x-tenant-id: 123e4567-e89b-12d3-a456-426614174000" \
     http://localhost:3000/api/tenants/123e4567-e89b-12d3-a456-426614174000/employees
```
