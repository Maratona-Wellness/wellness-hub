# ADR-003: Authentication & Authorization Strategy

## Status

Accepted

## Date

2024-01-15

## Context

O sistema precisa autenticar usuários de múltiplos tenants com diferentes níveis de acesso (roles). Requisitos:

- Login com email/senha
- Magic links para onboarding
- Sessões com timeout de 30 minutos
- Role-Based Access Control (RBAC)
- Multi-tenant aware

## Decision Drivers

- **Segurança**: OWASP compliant
- **UX**: Fluxo de cadastro amigável com verificação de email
- **Escalabilidade**: Stateless para permitir horizontal scaling
- **Simplicidade**: Evitar complexidade desnecessária

## Considered Options

### Option 1: Custom JWT Implementation

**Prós:**

- Controle total
- Leve

**Contras:**

- Precisa implementar refresh tokens
- Vulnerável a erros de implementação
- Manutenção contínua

### Option 2: NextAuth.js (Chosen)

**Prós:**

- Bem testado e mantido
- Integração nativa com Next.js
- Suporte a múltiplos providers
- JWT built-in
- Session management

**Contras:**

- Configuração inicial específica
- Dependência externa

### Option 3: External Auth (Auth0, Clerk)

**Prós:**

- Zero maintenance
- Features avançadas (MFA, etc)

**Contras:**

- Custo adicional
- Latência extra
- Lock-in

## Decision

Usar **NextAuth.js v4** com:

- **Credentials Provider** para email/senha
- **JWT Strategy** para sessions stateless
- **Custom callbacks** para multi-tenancy

## Authentication Flow

### Login Flow

```
[User] → [Login Page] → [POST /api/auth/callback/credentials]
            ↓
    [Validate email/password]
            ↓
    [Load user + tenant from DB]
            ↓
    [Generate JWT with user data + tenantId]
            ↓
    [Set HTTP-only cookie]
            ↓
    [Redirect to dashboard]
```

### Registration Flow (Magic Link)

```
[User] → [Signup Page] → [POST /api/auth/signup]
            ↓
    [Validate email domain against tenant allowedDomains]
            ↓
    [Generate magic token (24h expiry)]
            ↓
    [Send verification email]
            ↓
    [User clicks link] → [/signup/verify?token=xxx]
            ↓
    [Validate token]
            ↓
    [Redirect to complete registration form]
            ↓
    [POST /api/auth/complete-signup]
            ↓
    [Create user, auto-login]
```

## Session Configuration

```typescript
// JWT expires in 30 minutes of inactivity
export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  },
  jwt: {
    maxAge: 30 * 60,
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      session.user.tenantName = token.tenantName;
      return session;
    },
  },
};
```

## Role-Based Access Control (RBAC)

### Roles

| Role         | Description         | Access                                              |
| ------------ | ------------------- | --------------------------------------------------- |
| EMPLOYEE     | Colaborador comum   | Agendar, ver próprios agendamentos                  |
| THERAPIST    | Terapeuta           | Ver agenda, confirmar check-ins                     |
| TENANT_ADMIN | Admin da empresa    | Gerenciar usuários, programas, relatórios do tenant |
| SUPER_ADMIN  | Admin da plataforma | Gerenciar todos os tenants                          |

### Middleware Protection

```typescript
// middleware.ts
export default withAuth(function middleware(req) {
  const { role } = req.nextauth.token;
  const pathname = req.nextUrl.pathname;

  // Route protection
  if (pathname.startsWith("/super") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect("/dashboard");
  }
  if (
    pathname.startsWith("/admin") &&
    !["TENANT_ADMIN", "SUPER_ADMIN"].includes(role)
  ) {
    return NextResponse.redirect("/dashboard");
  }
  // ...
});
```

## Security Measures

1. **Password Hashing**: bcrypt with salt rounds = 12
2. **HTTP-Only Cookies**: JWT não acessível via JavaScript
3. **CSRF Protection**: Built-in no NextAuth
4. **Rate Limiting**: (Futuro) Para prevenir brute force
5. **Secure Headers**: Configurado no next.config.js

## Token Types

| Type           | Purpose                      | Expiry     | Table        |
| -------------- | ---------------------------- | ---------- | ------------ |
| VERIFICATION   | Email verification on signup | 24 hours   | magic_tokens |
| PASSWORD_RESET | Password recovery            | 1 hour     | magic_tokens |
| JWT Session    | User authentication          | 30 minutes | (cookie)     |

## Consequences

### Positive

- Autenticação robusta e testada
- Stateless sessions = fácil scaling
- Multi-tenancy integrado nas sessions
- RBAC simples e efetivo

### Negative

- Dependência do NextAuth.js
- Sessões curtas (30min) podem ser inconvenientes

### Mitigations

1. **Activity refresh**: Estender sessão em cada request ativo
2. **Remember me**: (Futuro) Opção para sessões mais longas
3. **Refresh tokens**: (Futuro) Para mobile apps

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://auth0.com/blog/jwt-security-best-practices/)
