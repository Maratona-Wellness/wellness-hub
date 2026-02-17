# Plano de Implementação - Maratona QV Wellness Hub

> **Versão:** 1.0.0
> **Data:** 5 de fevereiro de 2026
> **Status:** Planejado

---

## Visão Geral

Este documento detalha o plano de implementação completo do **Maratona QV Wellness Hub**, uma plataforma multi-tenant de agendamentos de sessões de bem-estar (massagens) para empresas clientes.

### Escopo Total

- **9 PARTES** organizadas por bounded context
- **47 ETAPAS** incrementais e funcionais
- **Stack**: Next.js 14+ (App Router), Prisma, PostgreSQL, Tailwind CSS
- **Estimativa total**: 13-15 semanas de desenvolvimento

### Perfis de Usuário

| Perfil                 | Descrição                                    |
| ---------------------- | ---------------------------------------------- |
| **EMPLOYEE**     | Funcionário de empresa cliente (agendamentos) |
| **TENANT_ADMIN** | Administrador de empresa cliente (gestão)     |
| **THERAPIST**    | Terapeuta credenciado (agenda e atendimentos)  |
| **SUPER_ADMIN**  | Administrador da Maratona (gestão global)     |

---

## Mapa de Dependências

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDEM DE IMPLEMENTAÇÃO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PARTE 1: Fundação          ──┐                                              │
│  (Setup, DB, UI Base)         │                                              │
│                               ▼                                              │
│  PARTE 2: Autenticação     ──┐                                              │
│  (Login, Magic Link, RBAC)    │                                              │
│                               ▼                                              │
│  ┌────────────────────────────┴────────────────────────────┐                │
│  │                                                          │                │
│  ▼                                                          ▼                │
│  PARTE 3: Tenant & Locations              PARTE 4: Therapists               │
│  (Gestão de empresas)                     (Gestão de terapeutas)            │
│  │                                                          │                │
│  └────────────────────────────┬────────────────────────────┘                │
│                               ▼                                              │
│  PARTE 5: Programs & Availability                                           │
│  (Programas e slots de disponibilidade)                                     │
│                               │                                              │
│                               ▼                                              │
│  PARTE 6: Appointments (EMPLOYEE)                                           │
│  (Fluxo crítico de agendamentos)                                            │
│                               │                                              │
│                               ▼                                              │
│  PARTE 7: Therapist Experience                                              │
│  (Calendário, presença, histórico)                                         │
│                               │                                              │
│                               ▼                                              │
│  PARTE 8: Admin Dashboards                                                  │
│  (TENANT_ADMIN e SUPER_ADMIN)                                               │
│                               │                                              │
│                               ▼                                              │
│  PARTE 9: Refinamento & Deploy                                              │
│  (Otimizações, testes, produção)                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PARTE 1: Fundação e Infraestrutura

**Objetivo**: Estabelecer a base técnica do projeto com configurações, schema de banco de dados, componentes UI reutilizáveis e infraestrutura de multi-tenancy.

**Perfis impactados**: Todos (infraestrutura base)
**Dependências**: Nenhuma (primeira parte)
**Estimativa**: 1.5 semanas

---

### Etapa 1.1: Setup do Projeto e Configurações Base

**Descrição**: Inicializar o projeto Next.js com todas as dependências necessárias, configurar TypeScript, ESLint, Prettier e estrutura de pastas seguindo padrões de clean architecture.

**Backend**:

- [ ] Criar projeto Next.js 14+ com App Router
- [ ] Configurar TypeScript com strict mode
- [ ] Instalar e configurar Prisma ORM
- [ ] Configurar PostgreSQL (docker-compose para dev)
- [ ] Configurar variáveis de ambiente (.env.local, .env.example)
- [ ] Estruturar pastas: `/app`, `/lib`, `/components`, `/services`, `/types`

**Frontend**:

- [ ] Configurar Tailwind CSS com design tokens do PRD
- [ ] Configurar fonte Varela Round
- [ ] Criar arquivo de variáveis CSS (cores, espaçamentos, shadows)
- [ ] Configurar path aliases no tsconfig

**Critérios de Aceitação**:

- Projeto inicia sem erros com `npm run dev`
- Conexão com PostgreSQL validada
- Tailwind aplicando estilos corretamente
- ESLint e TypeScript sem warnings

**Dependências**: Nenhuma

---

### Etapa 1.2: Schema do Banco de Dados e Models Prisma

**Descrição**: Implementar o schema completo do Prisma com todas as entidades definidas no entity-specs, incluindo relacionamentos, índices e enums.

**Backend**:

- [ ] Criar enum `UserRole` (EMPLOYEE, THERAPIST, TENANT_ADMIN, SUPER_ADMIN)
- [ ] Criar enum `AppointmentStatus` (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
- [ ] Criar model `Tenant` (id, name, domain, logo_url, active, timestamps)
- [ ] Criar model `Location` (id, tenant_id, name, address, timestamps)
- [ ] Criar model `Program` (id, tenant_id, name, duration, day_start/end, capacity, active)
- [ ] Criar model `UserAccount` (id, email, password_hash, display_name, active, timestamps)
- [ ] Criar model `Role` e `UserRole` (many-to-many com tenant scope)
- [ ] Criar model `Employee` (id, tenant_id, user_id, email, name, active)
- [ ] Criar model `Therapist` (id, user_id, email, name, cpf, specialties, active)
- [ ] Criar model `TherapistAssignment` (therapist_id, tenant_id, location_id, active)
- [ ] Criar model `AvailabilitySlot` (tenant_id, location_id, therapist_id, program_id, date, times, capacity)
- [ ] Criar model `Appointment` (todos os campos conforme entity-specs)
- [ ] Criar model `MagicToken` (email, token_hash, expires_at, used, tenant_id)
- [ ] Criar model `AuthLog` (user_id, method, outcome, reason, ip, timestamp)
- [ ] Criar índices para queries frequentes (tenant_id, email, date ranges)
- [ ] Executar migration inicial: `npx prisma migrate dev`

**Frontend**:

- [ ] Gerar tipos TypeScript do Prisma: `npx prisma generate`
- [ ] Criar tipos auxiliares em `/types` para DTOs

**Critérios de Aceitação**:

- Migration executa sem erros
- Prisma Studio abre e exibe todas as tabelas
- Relacionamentos funcionando (cascade, referential integrity)
- Índices criados conforme planejado

**Dependências**: Etapa 1.1

---

### Etapa 1.3: Middleware de Multi-Tenancy

**Descrição**: Implementar o sistema de isolamento de dados por tenant, incluindo extração de tenant do contexto, filtros automáticos e validações de acesso.

**Backend**:

- [ ] Criar utility `getTenantFromDomain(email)` - extrai domínio e busca tenant
- [ ] Criar middleware Next.js para injetar tenantId no contexto da request
- [ ] Criar helper `withTenantScope(prisma, tenantId)` para queries filtradas
- [ ] Criar decorator/wrapper para API routes que exige tenant válido
- [ ] Implementar validação de cross-tenant access em queries
- [ ] Criar helper `assertTenantAccess(userId, tenantId)` para validações

**Frontend**:

- [ ] Criar React Context `TenantContext` com provider
- [ ] Criar hook `useTenant()` para acessar dados do tenant atual
- [ ] Criar componente `TenantGuard` para proteção de rotas

**Critérios de Aceitação**:

- Queries retornam apenas dados do tenant do usuário logado
- Tentativa de acesso cross-tenant retorna 403 Forbidden
- Logs registram tentativas de violação
- SUPER_ADMIN pode acessar todos os tenants

**Dependências**: Etapa 1.2

---

### Etapa 1.4: Componentes UI Base (Design System - Atoms)

**Descrição**: Criar os componentes atômicos reutilizáveis seguindo o design system definido no PRD (paleta 70-20-10, tipografia, espaçamentos).

**Frontend**:

- [ ] Criar componente `Button` (variants: primary, secondary, danger, ghost; sizes: sm, md, lg; states: loading, disabled)
- [ ] Criar componente `Input` (types: text, email, password, tel; states: error, disabled)
- [ ] Criar componente `Select` (options, placeholder, error state)
- [ ] Criar componente `Checkbox` (checked, label, disabled)
- [ ] Criar componente `Radio` (checked, label, name, disabled)
- [ ] Criar componente `Switch` (checked, label)
- [ ] Criar componente `Badge` (variants: success, warning, error, info)
- [ ] Criar componente `Avatar` (src, name fallback, sizes: sm, md, lg)
- [ ] Criar componente `Spinner` (sizes: sm, md, lg)
- [ ] Criar componente `Icon` (wrapper para Lucide icons)
- [ ] Criar componente `Text` (variants: h1-h6, p, span, label)

**Critérios de Aceitação**:

- Todos os componentes seguem o design system (cores, fontes, espaçamentos)
- Componentes são acessíveis (ARIA labels, keyboard navigation)
- Props são tipadas com TypeScript
- Componentes funcionam em dark mode (preparação futura)

**Dependências**: Etapa 1.1

---

### Etapa 1.5: Componentes UI Base (Design System - Molecules)

**Descrição**: Criar componentes compostos que combinam atoms para formar elementos de UI mais complexos.

**Frontend**:

- [ ] Criar componente `FormField` (Label + Input + ErrorMessage + HelpText)
- [ ] Criar componente `Card` (container com shadow, padding, variants)
- [ ] Criar componente `Modal` (overlay, content, close button, sizes)
- [ ] Criar componente `Dropdown` (trigger, menu, items, keyboard nav)
- [ ] Criar componente `DatePicker` (input + calendar popup)
- [ ] Criar componente `TimePicker` (input + time selector)
- [ ] Criar componente `SearchBar` (input + icon + clear button)
- [ ] Criar componente `Pagination` (prev/next, page numbers, info)
- [ ] Criar componente `EmptyState` (icon, title, description, action)
- [ ] Criar componente `Toast` (icon, message, variants, auto-dismiss)
- [ ] Criar componente `Tabs` (tab list, panels, controlled/uncontrolled)
- [ ] Criar componente `Alert` (variants: info, success, warning, error)

**Critérios de Aceitação**:

- Molecules compõem corretamente os Atoms
- Estados de loading, error e success funcionam
- Componentes são responsivos
- Keyboard navigation funciona em todos os componentes interativos

**Dependências**: Etapa 1.4

---

### Etapa 1.6: Layouts e Estrutura de Navegação

**Descrição**: Criar os layouts principais da aplicação e estrutura de navegação base para cada perfil de usuário.

**Frontend**:

- [ ] Criar `AuthLayout` (páginas de login/signup - centralizado, sem navbar)
- [ ] Criar `DashboardLayout` (navbar + sidebar + content area)
- [ ] Criar componente `Navbar` (logo, user menu, notifications)
- [ ] Criar componente `Sidebar` (menu dinâmico por role)
- [ ] Criar componente `UserMenu` (avatar, dropdown com opções)
- [ ] Criar configuração de menu por role (EMPLOYEE, THERAPIST, TENANT_ADMIN, SUPER_ADMIN)
- [ ] Criar componente `Breadcrumb` para navegação contextual
- [ ] Criar página de loading global (Suspense boundary)
- [ ] Criar página de erro global (error.tsx)
- [ ] Criar página 404 (not-found.tsx)

**Critérios de Aceitação**:

- Layouts renderizam corretamente em todas as resoluções
- Sidebar colapsa em mobile (drawer)
- Menu de navegação mostra apenas itens permitidos para a role
- Transições de página são suaves

**Dependências**: Etapa 1.5

---

## PARTE 2: Autenticação e Autorização

**Objetivo**: Implementar o sistema completo de autenticação com suporte a login por senha (terapeutas/admins) e magic link (funcionários), incluindo RBAC e controle de sessão.

**Perfis impactados**: Todos
**Dependências**: PARTE 1 (Fundação)
**Estimativa**: 1.5 semanas

---

### Etapa 2.1: API de Autenticação - Login com Senha

**Descrição**: Implementar o endpoint de login tradicional com email/senha para terapeutas e administradores, incluindo validação de credenciais e geração de JWT.

**Backend**:

- [ ] Instalar e configurar NextAuth.js v4 com Credentials Provider
- [ ] Criar API route `POST /api/auth/login`
- [ ] Implementar validação de email e senha
- [ ] Implementar hash verification com bcrypt
- [ ] Criar função de geração de JWT com claims (id, role, tenantId)
- [ ] Configurar sessão JWT com TTL de 30 minutos
- [ ] Implementar rate limiting (5 tentativas/minuto)
- [ ] Registrar tentativa em AuthLog (sucesso/falha)
- [ ] Validar se usuário está ativo

**Frontend**:

- [ ] Criar página `/login` com AuthLayout
- [ ] Criar formulário de login (email, senha)
- [ ] Implementar estados: idle, loading, error, success
- [ ] Exibir mensagens de erro apropriadas
- [ ] Implementar redirecionamento por role após login

**Critérios de Aceitação**:

- Login com credenciais válidas gera token JWT
- Login com credenciais inválidas retorna 401 com mensagem clara
- Usuário inativo não consegue fazer login (403)
- Rate limiting bloqueia após 5 tentativas
- Redirecionamento correto por role (conforme PRD)

**Dependências**: Etapa 1.3, Etapa 1.6

---

### Etapa 2.2: Magic Link - Solicitação de Token

**Descrição**: Implementar o fluxo de primeiro acesso para funcionários, onde o usuário informa o email corporativo e recebe um token por email.

**Backend**:

- [ ] Criar API route `POST /api/auth/magic-link/request`
- [ ] Implementar validação de domínio do email contra tenants ativos
- [ ] Gerar token único criptograficamente seguro
- [ ] Armazenar token com hash (bcrypt) e TTL de 15 minutos
- [ ] Implementar limite de reenvios (3 tentativas em 15 minutos)
- [ ] Integrar com serviço de email (Resend/SendGrid)
- [ ] Criar template de email com token e link
- [ ] Registrar solicitação em AuthLog

**Frontend**:

- [ ] Criar página `/signup` (step 1 do wizard)
- [ ] Criar formulário com campo de email
- [ ] Validar formato de email no frontend
- [ ] Exibir mensagem de sucesso com instruções
- [ ] Implementar botão de reenvio com countdown
- [ ] Link para login existente

**Critérios de Aceitação**:

- Email de domínio não cadastrado retorna 400 com mensagem clara
- Token é enviado por email em menos de 30 segundos
- Email contém link clicável e token visível
- Limite de reenvios é respeitado
- Token anterior é invalidado ao gerar novo

**Dependências**: Etapa 2.1

---

### Etapa 2.3: Magic Link - Verificação de Token

**Descrição**: Implementar a página e API de verificação do token recebido por email, validando TTL e uso único.

**Backend**:

- [ ] Criar API route `POST /api/auth/magic-link/verify`
- [ ] Validar token contra hash armazenado
- [ ] Verificar se token não expirou (TTL)
- [ ] Verificar se token não foi usado
- [ ] Retornar dados do tenant e email para próximo step
- [ ] Não consumir token ainda (será consumido no complete-signup)

**Frontend**:

- [ ] Criar página `/signup/verify` (step 2 do wizard)
- [ ] Ler token da query string se presente
- [ ] Criar campo para input manual do token
- [ ] Exibir timer de expiração decrescente
- [ ] Botão "Reenviar token" (volta para step 1)
- [ ] Feedback visual de validação

**Critérios de Aceitação**:

- Token válido avança para step 3
- Token expirado mostra mensagem e opção de reenvio
- Token já usado mostra mensagem de erro
- Token inválido mostra mensagem genérica de segurança
- Timer de expiração é preciso

**Dependências**: Etapa 2.2

---

### Etapa 2.4: Magic Link - Completar Cadastro

**Descrição**: Implementar a página final do cadastro onde o funcionário define seus dados e senha, criando a conta no sistema.

**Backend**:

- [ ] Criar API route `POST /api/auth/complete-signup`
- [ ] Revalidar token (ainda válido e não usado)
- [ ] Consumir token (marcar como usado)
- [ ] Criar UserAccount com password hash
- [ ] Criar Employee vinculado ao tenant do token
- [ ] Criar UserRole com role EMPLOYEE
- [ ] Enviar email de boas-vindas
- [ ] Retornar sucesso (não fazer auto-login)

**Frontend**:

- [ ] Criar página `/signup/complete` (step 3 do wizard)
- [ ] Exibir nome da empresa (tenant) do token
- [ ] Formulário: nome completo, telefone, senha, confirmação
- [ ] Indicador de força da senha
- [ ] Checkbox de aceite de termos
- [ ] Validações em tempo real
- [ ] Redirect para `/login` com toast de sucesso

**Critérios de Aceitação**:

- Cadastro cria todas as entidades corretamente (UserAccount, Employee, UserRole)
- Senha é armazenada com bcrypt cost 12
- Email de boas-vindas é enviado
- Validações de senha são aplicadas (mín 8 chars, 1 número, 1 especial)
- Token só pode ser usado uma vez

**Dependências**: Etapa 2.3

---

### Etapa 2.5: Recuperação de Senha

**Descrição**: Implementar o fluxo completo de "esqueci minha senha" com envio de link e redefinição.

**Backend**:

- [ ] Criar API route `POST /api/auth/forgot-password`
- [ ] Verificar se email existe no sistema
- [ ] Gerar token de reset (TTL 1 hora)
- [ ] Enviar email com link de reset
- [ ] Criar API route `POST /api/auth/reset-password`
- [ ] Validar token de reset
- [ ] Atualizar senha do usuário
- [ ] Invalidar todas as sessões ativas
- [ ] Consumir token

**Frontend**:

- [ ] Criar página `/forgot-password`
- [ ] Formulário com campo de email
- [ ] Mensagem de sucesso (não revelar se email existe)
- [ ] Criar página `/reset-password`
- [ ] Formulário: nova senha, confirmação
- [ ] Redirect para login após sucesso

**Critérios de Aceitação**:

- Email não existente não retorna erro (segurança)
- Link de reset funciona e expira após 1 hora
- Nova senha substitui a anterior
- Sessões antigas são invalidadas
- Usuário consegue fazer login com nova senha

**Dependências**: Etapa 2.1

---

### Etapa 2.6: Controle de Sessão e Logout

**Descrição**: Implementar gerenciamento de sessão, refresh de token, e funcionalidade de logout.

**Backend**:

- [ ] Criar API route `POST /api/auth/logout`
- [ ] Invalidar sessão atual
- [ ] Criar API route `POST /api/auth/refresh` (opcional, para refresh token)
- [ ] Criar API route `GET /api/auth/me` - retorna perfil do usuário logado
- [ ] Implementar middleware de verificação de sessão ativa
- [ ] Implementar timeout de inatividade (30 minutos)

**Frontend**:

- [ ] Criar hook `useAuth()` com estado de autenticação
- [ ] Criar componente `AuthGuard` para proteção de rotas
- [ ] Implementar logout no UserMenu
- [ ] Implementar detecção de sessão expirada
- [ ] Redirect automático para login quando sessão expira
- [ ] Manter última URL para redirect após re-login

**Critérios de Aceitação**:

- Logout limpa sessão e redireciona para login
- Sessão expira após 30 minutos de inatividade
- Acesso a rota protegida sem sessão redireciona para login
- `/api/auth/me` retorna dados do usuário logado
- Refresh token (se implementado) estende sessão

**Dependências**: Etapa 2.1

---

### Etapa 2.7: Middleware de Autorização (RBAC)

**Descrição**: Implementar sistema de autorização baseado em roles para proteger rotas e ações específicas.

**Backend**:

- [ ] Criar helper `requireRole(allowedRoles[])` para API routes
- [ ] Criar helper `requireTenantAccess(tenantId)` para validação de tenant
- [ ] Criar helper `requireOwnership(resourceUserId)` para recursos próprios
- [ ] Implementar middleware que injeta user com roles no contexto
- [ ] Criar mapeamento de permissões por role
- [ ] Implementar logging de tentativas de acesso não autorizado

**Frontend**:

- [ ] Criar componente `RoleGuard` para renderização condicional
- [ ] Criar hook `usePermissions()` para verificar permissões
- [ ] Atualizar Sidebar para mostrar apenas itens permitidos
- [ ] Implementar redirecionamento se role não tem acesso à página

**Critérios de Aceitação**:

- EMPLOYEE só acessa rotas `/employee/*`
- THERAPIST só acessa rotas `/therapist/*`
- TENANT_ADMIN acessa rotas `/tenant-admin/*` do próprio tenant
- SUPER_ADMIN acessa todas as rotas `/admin/*`
- Tentativa de acesso não autorizado retorna 403
- UI não mostra elementos que usuário não pode acessar

**Dependências**: Etapa 2.6

---

## PARTE 3: Gestão de Tenants e Locations

**Objetivo**: Implementar o CRUD completo de empresas clientes (tenants) e suas localizações/sedes, permitindo que SUPER_ADMIN gerencie a base de clientes.

**Perfis impactados**: SUPER_ADMIN, TENANT_ADMIN
**Dependências**: PARTE 2 (Autenticação)
**Estimativa**: 1 semana

---

### Etapa 3.1: API de Tenants - Listagem e Detalhes

**Descrição**: Implementar endpoints para listar e visualizar detalhes de tenants (empresas clientes).

**Backend**:

- [ ] Criar API route `GET /api/admin/tenants` (listagem paginada)
- [ ] Implementar filtros: status (active/inactive), search (nome/domínio)
- [ ] Criar API route `GET /api/admin/tenants/[id]` (detalhes)
- [ ] Incluir contadores: total_employees, total_appointments, utilization_rate
- [ ] Criar API route `POST /api/tenants/resolve-domain` (público, para signup)

**Frontend**:

- [ ] Criar página `/admin/tenants` com DataTable
- [ ] Implementar SearchBar e filtros
- [ ] Criar RowActions (ver, editar, ativar/desativar)
- [ ] Criar página `/admin/tenants/[id]` com tabs (visão geral, locations, etc)

**Critérios de Aceitação**:

- Lista carrega com paginação funcional
- Filtros aplicam corretamente
- Detalhes mostram todas as informações do tenant
- Resolve-domain retorna tenant ou 404 para domínio inválido

**Dependências**: Etapa 2.7

---

### Etapa 3.2: API de Tenants - Criação (Wizard)

**Descrição**: Implementar o wizard de criação de novo tenant com todas as informações necessárias.

**Backend**:

- [ ] Criar API route `POST /api/admin/tenants` (transação atômica)
- [ ] Validar unicidade de domínios
- [ ] Criar Tenant com dados da empresa
- [ ] Criar Location(s) iniciais
- [ ] Criar UserAccount + UserRole para primeiro TENANT_ADMIN
- [ ] Enviar email de boas-vindas para admin do tenant
- [ ] Implementar rollback se qualquer etapa falhar

**Frontend**:

- [ ] Criar página `/admin/tenants/new` com wizard multi-step
- [ ] Step 1: Dados da empresa (nome, CNPJ, endereço)
- [ ] Step 2: Domínios de email autorizados
- [ ] Step 3: Localizações/sedes
- [ ] Step 4: Dados do administrador do tenant
- [ ] Step 5: Revisão e confirmação
- [ ] Feedback de progresso e validações por step

**Critérios de Aceitação**:

- Wizard permite navegação entre steps
- Validações ocorrem em cada step
- Tenant é criado atomicamente (tudo ou nada)
- Admin do tenant recebe email com credenciais
- Domínios duplicados são rejeitados

**Dependências**: Etapa 3.1

---

### Etapa 3.3: API de Tenants - Edição e Status

**Descrição**: Implementar endpoints para editar dados do tenant e alterar status (ativar/desativar).

**Backend**:

- [ ] Criar API route `PATCH /api/admin/tenants/[id]`
- [ ] Validar unicidade de domínios alterados
- [ ] Criar API route `PATCH /api/admin/tenants/[id]/toggle-status`
- [ ] Ao desativar: bloquear novos logins, manter dados
- [ ] Registrar alterações em log de auditoria

**Frontend**:

- [ ] Criar modal/página de edição de tenant
- [ ] Implementar toggle de status com confirmação
- [ ] Mostrar alerta ao desativar (impacto em funcionários)

**Critérios de Aceitação**:

- Edição atualiza dados corretamente
- Desativar tenant impede novos logins de funcionários
- Reativar tenant restaura acesso
- Histórico de alterações é registrado

**Dependências**: Etapa 3.2

---

### Etapa 3.4: API de Locations - CRUD Completo

**Descrição**: Implementar gerenciamento de localizações (sedes) de um tenant.

**Backend**:

- [ ] Criar API route `GET /api/admin/tenants/[tenantId]/locations`
- [ ] Criar API route `POST /api/admin/tenants/[tenantId]/locations`
- [ ] Criar API route `PATCH /api/locations/[id]`
- [ ] Criar API route `DELETE /api/locations/[id]` (soft delete)
- [ ] Validar que location pertence ao tenant
- [ ] Verificar agendamentos futuros antes de desativar

**Frontend**:

- [ ] Adicionar tab "Localizações" na página de detalhes do tenant
- [ ] Criar modal de criação/edição de location
- [ ] Implementar lista com ações (editar, desativar)
- [ ] Mostrar alerta se houver agendamentos futuros

**Critérios de Aceitação**:

- CRUD de locations funciona corretamente
- Location só pode ser criada para tenant existente
- Desativar location com agendamentos futuros requer confirmação
- TENANT_ADMIN também pode gerenciar suas locations (próprio tenant)

**Dependências**: Etapa 3.1

---

### Etapa 3.5: Visualização de Tenant para TENANT_ADMIN

**Descrição**: Implementar tela de configurações do tenant para o administrador da empresa cliente.

**Backend**:

- [ ] Criar API route `GET /api/tenant-admin/settings`
- [ ] Criar API route `PATCH /api/tenant-admin/settings`
- [ ] Retornar apenas dados do próprio tenant
- [ ] Permitir editar: nome, logo, notificações, políticas

**Frontend**:

- [ ] Criar página `/tenant-admin/settings`
- [ ] Seção: Dados da Empresa (nome, logo)
- [ ] Seção: Localizações (somente visualização, link para editar)
- [ ] Seção: Notificações (preferências de email)
- [ ] Seção: Políticas (antecedência mínima, limite de no-shows)

**Critérios de Aceitação**:

- TENANT_ADMIN vê apenas dados do próprio tenant
- Alterações são salvas corretamente
- Políticas afetam regras de agendamento

**Dependências**: Etapa 3.4

---

## PARTE 4: Gestão de Terapeutas

**Objetivo**: Implementar o CRUD completo de terapeutas e suas vinculações com tenants/locations, permitindo que SUPER_ADMIN gerencie os profissionais.

**Perfis impactados**: SUPER_ADMIN, THERAPIST
**Dependências**: PARTE 3 (Tenants e Locations)
**Estimativa**: 1 semana

---

### Etapa 4.1: API de Therapists - Listagem e Detalhes

**Descrição**: Implementar endpoints para listar e visualizar detalhes de terapeutas.

**Backend**:

- [ ] Criar API route `GET /api/admin/therapists` (listagem paginada)
- [ ] Implementar filtros: status, specialty, tenant vinculado
- [ ] Criar API route `GET /api/admin/therapists/[id]` (detalhes com assignments)
- [ ] Incluir: dados pessoais, especialidades, lista de vinculações

**Frontend**:

- [ ] Criar página `/admin/therapists` com DataTable
- [ ] Implementar SearchBar e filtros
- [ ] Criar RowActions (ver, editar, ativar/desativar)
- [ ] Criar página `/admin/therapists/[id]` com tabs

**Critérios de Aceitação**:

- Lista carrega com paginação funcional
- Filtro por tenant mostra apenas terapeutas vinculados
- Detalhes mostram todas as vinculações ativas

**Dependências**: Etapa 3.4

---

### Etapa 4.2: API de Therapists - Cadastro

**Descrição**: Implementar endpoint para cadastrar novo terapeuta.

**Backend**:

- [ ] Criar API route `POST /api/admin/therapists`
- [ ] Validar unicidade de email e CPF
- [ ] Criar Therapist com dados pessoais
- [ ] Criar UserAccount com senha temporária ou enviada por email
- [ ] Criar UserRole com role THERAPIST
- [ ] Enviar email de boas-vindas com credenciais

**Frontend**:

- [ ] Criar página `/admin/therapists/new`
- [ ] Formulário: nome, email, telefone, CPF, especialidades
- [ ] Validação de CPF (formato e dígitos)
- [ ] Seletor múltiplo de especialidades
- [ ] Checkbox "Enviar email de boas-vindas"

**Critérios de Aceitação**:

- Cadastro cria Therapist e UserAccount
- Email e CPF duplicados são rejeitados
- Terapeuta recebe email com credenciais
- Especialidades são salvas corretamente

**Dependências**: Etapa 4.1

---

### Etapa 4.3: API de Therapists - Edição e Status

**Descrição**: Implementar endpoints para editar dados e alterar status de terapeutas.

**Backend**:

- [ ] Criar API route `PATCH /api/admin/therapists/[id]`
- [ ] Validar unicidade em alterações de email/CPF
- [ ] Criar API route `PATCH /api/admin/therapists/[id]/toggle-status`
- [ ] Ao desativar: bloquear novos agendamentos, manter histórico
- [ ] Verificar agendamentos futuros antes de desativar

**Frontend**:

- [ ] Criar modal/página de edição de terapeuta
- [ ] Implementar toggle de status com confirmação
- [ ] Mostrar alerta com lista de agendamentos futuros (se houver)

**Critérios de Aceitação**:

- Edição atualiza dados corretamente
- Desativar com agendamentos futuros requer confirmação
- Terapeuta desativado não aparece em buscas de disponibilidade

**Dependências**: Etapa 4.2

---

### Etapa 4.4: Gerenciamento de Vinculações (Assignments)

**Descrição**: Implementar sistema de vinculação de terapeutas com tenants e locations.

**Backend**:

- [ ] Criar API route `GET /api/admin/therapists/[id]/assignments`
- [ ] Criar API route `POST /api/admin/therapists/[id]/assignments`
- [ ] Aceitar: tenantId, locationIds[] (múltiplas locations por vez)
- [ ] Criar API route `DELETE /api/admin/therapists/[id]/assignments/[assignmentId]`
- [ ] Soft delete da vinculação
- [ ] Verificar agendamentos futuros antes de remover

**Frontend**:

- [ ] Adicionar tab "Vinculações" na página do terapeuta
- [ ] Lista de vinculações atuais (tenant + location)
- [ ] Modal "Adicionar Vinculação": select tenant → select locations
- [ ] Botão remover com confirmação (mostra agendamentos futuros)

**Critérios de Aceitação**:

- Vinculação permite terapeuta atender em tenant/location
- Múltiplas locations podem ser vinculadas de uma vez
- Remover vinculação com agendamentos futuros requer confirmação
- Terapeuta só aparece em disponibilidade de tenants/locations vinculados

**Dependências**: Etapa 4.3

---

### Etapa 4.5: Perfil do Terapeuta (Self-Service)

**Descrição**: Implementar tela de perfil para o terapeuta visualizar e editar seus próprios dados.

**Backend**:

- [ ] Criar API route `GET /api/therapist/profile`
- [ ] Criar API route `PATCH /api/therapist/profile`
- [ ] Permitir editar: nome, telefone, foto, especialidades
- [ ] Não permitir editar: email, CPF, vinculações

**Frontend**:

- [ ] Criar página `/therapist/profile`
- [ ] Seção: Dados Pessoais (editáveis)
- [ ] Seção: Especialidades (editáveis)
- [ ] Seção: Vinculações (somente visualização)
- [ ] Seção: Segurança (alterar senha)

**Critérios de Aceitação**:

- Terapeuta vê apenas seus próprios dados
- Pode editar campos permitidos
- Vinculações são exibidas mas não editáveis
- Alteração de senha funciona

**Dependências**: Etapa 4.4

---

## PARTE 5: Programas e Disponibilidade

**Objetivo**: Implementar gestão de programas (modalidades de massagem) e sistema de disponibilidade de horários (slots) que conecta programas, locations e terapeutas.

**Perfis impactados**: SUPER_ADMIN, TENANT_ADMIN, THERAPIST
**Dependências**: PARTE 4 (Terapeutas)
**Estimativa**: 1.5 semanas

---

### Etapa 5.1: API de Programs - CRUD para SUPER_ADMIN

**Descrição**: Implementar gerenciamento de programas/modalidades globais que podem ser contratados por tenants.

**Backend**:

- [ ] Criar API route `GET /api/admin/programs` (listagem)
- [ ] Criar API route `POST /api/admin/programs`
- [ ] Validar: nome, duração, day_start/end, capacity
- [ ] Criar API route `PATCH /api/admin/programs/[id]`
- [ ] Criar API route `PATCH /api/admin/programs/[id]/toggle-status`

**Frontend**:

- [ ] Criar página `/admin/programs` com DataTable
- [ ] Criar modal de criação/edição de programa
- [ ] Campos: nome, descrição, duração (minutos), horário início/fim, capacidade
- [ ] Toggle de status (ativo/inativo)

**Critérios de Aceitação**:

- Programas são criados com validações corretas
- Duração e horários são validados (início < fim)
- Programa inativo não aparece para novos agendamentos

**Dependências**: Etapa 3.4

---

### Etapa 5.2: Vinculação de Programs a Tenants

**Descrição**: Implementar sistema que permite associar programas disponíveis a cada tenant.

**Backend**:

- [ ] Criar tabela `TenantProgram` (tenant_id, program_id, active, custom_settings)
- [ ] Criar API route `GET /api/admin/tenants/[id]/programs`
- [ ] Criar API route `POST /api/admin/tenants/[id]/programs` (vincular programa)
- [ ] Criar API route `DELETE /api/admin/tenants/[id]/programs/[programId]`
- [ ] Permitir customizações por tenant (ex: capacidade diferente)

**Frontend**:

- [ ] Adicionar tab "Programas" na página de detalhes do tenant
- [ ] Lista de programas vinculados com status
- [ ] Modal para vincular novo programa (select de programas disponíveis)
- [ ] Opção de customizar parâmetros para o tenant

**Critérios de Aceitação**:

- Tenant só pode usar programas vinculados
- Customizações por tenant sobrescrevem padrão global
- Desvincular programa impede novos agendamentos

**Dependências**: Etapa 5.1

---

### Etapa 5.3: API de Availability - Listagem de Slots

**Descrição**: Implementar endpoints para consultar slots de disponibilidade.

**Backend**:

- [ ] Criar API route `GET /api/availability` (público para usuários autenticados)
- [ ] Filtros: date, programId, locationId, therapistId
- [ ] Retornar slots com: horário, capacidade total, reservados, terapeutas disponíveis
- [ ] Criar API route `GET /api/employee/availability/dates` (datas com slots disponíveis)
- [ ] Criar API route `GET /api/employee/availability/slots` (slots de uma data)

**Frontend**:

- [ ] (Será usado no wizard de agendamento - PARTE 6)

**Critérios de Aceitação**:

- Query retorna apenas slots do tenant do usuário
- Slots lotados (reserved >= capacity) são marcados como indisponíveis
- Filtros funcionam corretamente
- Performance adequada para consultas frequentes

**Dependências**: Etapa 5.2

---

### Etapa 5.4: API de Availability - Geração de Slots

**Descrição**: Implementar endpoint para TENANT_ADMIN gerar slots de disponibilidade em lote.

**Backend**:

- [ ] Criar API route `POST /api/availability/generate`
- [ ] Aceitar: programId, locationId, therapistIds[], dateRange (start/end)
- [ ] Gerar slots baseado em: horário do programa, duração, dias da semana
- [ ] Validar conflitos com slots existentes
- [ ] Validar que terapeutas estão vinculados ao location
- [ ] Implementar geração em lote com transação

**Frontend**:

- [ ] Criar página `/tenant-admin/availability/generate`
- [ ] Select de programa e location
- [ ] Date range picker (período de geração)
- [ ] Checkboxes de dias da semana
- [ ] Select múltiplo de terapeutas disponíveis
- [ ] Preview dos slots a serem gerados
- [ ] Botão confirmar geração

**Critérios de Aceitação**:

- Slots são gerados corretamente para o período
- Conflitos são detectados e reportados
- Apenas terapeutas vinculados podem ser selecionados
- Geração é atômica (tudo ou nada)

**Dependências**: Etapa 5.3, Etapa 4.4

---

### Etapa 5.5: Configuração de Disponibilidade pelo Terapeuta

**Descrição**: Implementar interface para terapeuta gerenciar sua disponibilidade semanal e exceções.

**Backend**:

- [ ] Criar API route `GET /api/therapist/availability`
- [ ] Filtros: tenantId, locationId
- [ ] Criar API route `PUT /api/therapist/availability`
- [ ] Aceitar: weekly_schedule (por dia da semana), exceptions (datas específicas)
- [ ] Validar conflitos com agendamentos existentes

**Frontend**:

- [ ] Criar página `/therapist/availability`
- [ ] Seletor de tenant e location (se múltiplos)
- [ ] Grade semanal com horários (drag to select)
- [ ] Lista de exceções (férias, folgas)
- [ ] Modal para adicionar exceção (data, motivo)
- [ ] Alerta de conflitos com agendamentos

**Critérios de Aceitação**:

- Terapeuta pode definir horários por dia da semana
- Exceções bloqueiam agendamentos nas datas específicas
- Alterações que conflitam com agendamentos mostram alerta
- Disponibilidade afeta geração de slots

**Dependências**: Etapa 5.4

---

### Etapa 5.6: Visualização de Disponibilidade para TENANT_ADMIN

**Descrição**: Dashboard para TENANT_ADMIN visualizar ocupação e disponibilidade geral.

**Backend**:

- [ ] Criar API route `GET /api/tenant-admin/availability/overview`
- [ ] Retornar: ocupação por location, por programa, por terapeuta
- [ ] Incluir: slots totais, reservados, taxa de ocupação

**Frontend**:

- [ ] Criar página `/tenant-admin/availability`
- [ ] Visão geral em cards (ocupação por location)
- [ ] Gráfico de barras (ocupação por programa)
- [ ] Calendário de ocupação (heatmap)
- [ ] Filtros por período, location, programa

**Critérios de Aceitação**:

- Dashboard mostra métricas de ocupação
- Filtros atualizam visualização em tempo real
- Dados são do tenant do admin logado

**Dependências**: Etapa 5.4

---

## PARTE 6: Fluxo de Agendamentos (Employee)

**Objetivo**: Implementar o fluxo crítico de agendamentos para funcionários, incluindo wizard de novo agendamento, visualização, e cancelamento.

**Perfis impactados**: EMPLOYEE
**Dependências**: PARTE 5 (Programas e Disponibilidade)
**Estimativa**: 1.5 semanas

---

### Etapa 6.1: Dashboard do Funcionário

**Descrição**: Implementar a página inicial do funcionário com resumo e ações rápidas.

**Backend**:

- [ ] Criar API route `GET /api/employee/dashboard`
- [ ] Retornar: próximo agendamento, lista de futuros (top 5), estatísticas, notificações
- [ ] Incluir: total de sessões, última sessão, taxa de comparecimento

**Frontend**:

- [ ] Criar página `/employee/dashboard`
- [ ] Card de boas-vindas personalizado
- [ ] Card destacado: Próximo Agendamento (se houver)
- [ ] Lista: Agendamentos Futuros
- [ ] Stats cards: total sessões, última sessão
- [ ] Botão CTA: "Agendar Nova Sessão"
- [ ] Lista de notificações/alertas

**Critérios de Aceitação**:

- Dashboard carrega dados do funcionário logado
- Próximo agendamento é destacado visualmente
- Botão de agendamento leva ao wizard
- Empty state quando não há agendamentos

**Dependências**: Etapa 5.3

---

### Etapa 6.2: Wizard de Agendamento - Step 1 (Escolher Programa)

**Descrição**: Primeira etapa do wizard onde funcionário escolhe a modalidade de massagem.

**Backend**:

- [ ] Criar API route `GET /api/employee/programs/available`
- [ ] Retornar apenas programas ativos vinculados ao tenant do funcionário
- [ ] Incluir: nome, descrição, duração, categoria

**Frontend**:

- [ ] Criar página `/employee/appointments/new`
- [ ] Grid de ProgramCards (foto, nome, descrição, duração)
- [ ] Filter por categoria (se houver)
- [ ] Seleção visual do programa
- [ ] Botão "Continuar" → próximo step

**Critérios de Aceitação**:

- Apenas programas do tenant são exibidos
- Seleção destaca o card escolhido
- Continuar leva para step 2 com programId na URL

**Dependências**: Etapa 6.1

---

### Etapa 6.3: Wizard de Agendamento - Step 2 (Escolher Data e Local)

**Descrição**: Segunda etapa onde funcionário escolhe localização e data.

**Backend**:

- [ ] Criar API route `GET /api/employee/locations`
- [ ] Retornar locations do tenant com disponibilidade
- [ ] API `GET /api/employee/availability/dates?program_id&location_id`
- [ ] Retornar datas com slots disponíveis para o próximo período

**Frontend**:

- [ ] Criar página `/employee/appointments/new/select-date`
- [ ] Select de localização
- [ ] Componente Calendar com:
  - Dias disponíveis destacados
  - Dias indisponíveis desabilitados
  - Dias passados desabilitados
- [ ] Legenda de status dos dias
- [ ] Botão "Continuar" → próximo step

**Critérios de Aceitação**:

- Locations mostram apenas as do tenant
- Calendário atualiza ao trocar location
- Apenas dias com disponibilidade são selecionáveis
- Navegação de mês funciona

**Dependências**: Etapa 6.2

---

### Etapa 6.4: Wizard de Agendamento - Step 3 (Escolher Horário e Terapeuta)

**Descrição**: Terceira etapa onde funcionário escolhe horário e opcionalmente o terapeuta.

**Backend**:

- [ ] API `GET /api/employee/availability/slots?program_id&location_id&date`
- [ ] Retornar slots com: horário, vagas disponíveis, lista de terapeutas
- [ ] Para cada terapeuta: nome, foto, especialidades, rating (se houver)

**Frontend**:

- [ ] Criar página `/employee/appointments/new/select-time`
- [ ] Lista de TimeSlots disponíveis
- [ ] Para cada slot:
  - Horário de início/fim
  - Badge de vagas disponíveis
  - Lista/Grid de terapeutas
- [ ] TherapistCard: foto, nome, especialidades
- [ ] Opção "Sem preferência de terapeuta"
- [ ] Seleção de slot + terapeuta
- [ ] Botão "Continuar" → confirmação

**Critérios de Aceitação**:

- Slots lotados aparecem desabilitados
- Terapeutas mostram informações relevantes
- "Sem preferência" é opção válida
- Seleção visual clara

**Dependências**: Etapa 6.3

---

### Etapa 6.5: Wizard de Agendamento - Step 4 (Confirmação)

**Descrição**: Etapa final de revisão e confirmação do agendamento.

**Backend**:

- [ ] Criar API route `POST /api/employee/appointments`
- [ ] Validar: vaga disponível (lock otimista), sem agendamento no dia, antecedência mínima
- [ ] Criar Appointment com status CONFIRMED
- [ ] Gerar código único (MQV-2026-XXXXX)
- [ ] Decrementar capacidade do slot
- [ ] Registrar log de auditoria
- [ ] Enviar email de confirmação ao funcionário
- [ ] Notificar terapeuta

**Frontend**:

- [ ] Criar página `/employee/appointments/new/confirm`
- [ ] Card de resumo: programa, data, horário, terapeuta, local
- [ ] Checkbox de confirmação (termos)
- [ ] Botão "Confirmar Agendamento"
- [ ] Loading state durante criação
- [ ] Redirect para detalhes com toast de sucesso

**Critérios de Aceitação**:

- Validações de negócio são aplicadas
- Race condition tratada (vaga pode ter sido ocupada)
- Email de confirmação é enviado
- Código único é gerado e exibido
- Sucesso redireciona para detalhes

**Dependências**: Etapa 6.4

---

### Etapa 6.6: Lista de Agendamentos do Funcionário

**Descrição**: Página para visualizar todos os agendamentos (futuros e histórico).

**Backend**:

- [ ] Criar API route `GET /api/employee/appointments`
- [ ] Filtros: status (upcoming, completed, cancelled), page, limit
- [ ] Retornar: lista paginada com detalhes de cada agendamento

**Frontend**:

- [ ] Criar página `/employee/appointments`
- [ ] Tabs: "Próximos" / "Histórico"
- [ ] Lista de AppointmentCards
- [ ] Filtros: data, programa, status
- [ ] Paginação
- [ ] Empty state por tab

**Critérios de Aceitação**:

- Tabs filtram corretamente
- Paginação funciona
- Cards mostram informações essenciais
- Click no card leva para detalhes

**Dependências**: Etapa 6.5

---

### Etapa 6.7: Detalhes do Agendamento e Cancelamento

**Descrição**: Página de detalhes do agendamento com opção de cancelar.

**Backend**:

- [ ] Criar API route `GET /api/employee/appointments/[id]`
- [ ] Validar que agendamento pertence ao funcionário
- [ ] Criar API route `DELETE /api/employee/appointments/[id]`
- [ ] Validar prazo de cancelamento (ex: 4h de antecedência)
- [ ] Atualizar status para CANCELLED
- [ ] Incrementar capacidade do slot
- [ ] Registrar histórico de cancelamento
- [ ] Enviar notificações (funcionário, terapeuta)

**Frontend**:

- [ ] Criar página `/employee/appointments/[id]`
- [ ] Badge de status (Confirmado, Cancelado, Concluído)
- [ ] Detalhes completos: código, data, horário, programa, terapeuta, local
- [ ] Botão "Adicionar ao Calendário" (download .ics)
- [ ] Botão "Cancelar" (condicional - dentro do prazo)
- [ ] Modal de confirmação de cancelamento
- [ ] Campo opcional de motivo

**Critérios de Aceitação**:

- Detalhes mostram todas as informações
- Cancelamento só aparece se dentro do prazo
- Modal de confirmação previne cancelamentos acidentais
- Vaga é liberada após cancelamento
- Notificações são enviadas

**Dependências**: Etapa 6.6

---

### Etapa 6.8: Perfil do Funcionário

**Descrição**: Página para funcionário visualizar e editar seus dados.

**Backend**:

- [ ] Criar API route `GET /api/employee/profile`
- [ ] Criar API route `PATCH /api/employee/profile`
- [ ] Criar API route `POST /api/employee/change-password`
- [ ] Validar senha atual antes de alterar

**Frontend**:

- [ ] Criar página `/employee/profile`
- [ ] Seção: Dados Pessoais (nome, telefone, foto)
- [ ] Seção: Segurança (alterar senha)
- [ ] Seção: Estatísticas (total sessões, comparecimento)
- [ ] Seção: Notificações (preferências)

**Critérios de Aceitação**:

- Funcionário pode editar seus dados
- Alteração de senha valida senha atual
- Estatísticas são calculadas corretamente

**Dependências**: Etapa 6.6

---

## PARTE 7: Experiência do Terapeuta

**Objetivo**: Implementar todas as funcionalidades para o terapeuta gerenciar seus atendimentos, incluindo calendário, registro de presença e histórico.

**Perfis impactados**: THERAPIST
**Dependências**: PARTE 6 (Agendamentos)
**Estimativa**: 1 semana

---

### Etapa 7.1: Calendário do Terapeuta

**Descrição**: Implementar visualização de calendário com todos os agendamentos do terapeuta.

**Backend**:

- [ ] Criar API route `GET /api/therapist/appointments`
- [ ] Filtros: view (day/week/month), date, tenantId, locationId, status
- [ ] Retornar: agendamentos com dados do funcionário, programa, local
- [ ] Incluir resumo: total, completados, pendentes, no-shows

**Frontend**:

- [ ] Criar página `/therapist/calendar`
- [ ] Componente Calendar com views: dia, semana, mês
- [ ] Filtros: tenant, location, programa, status
- [ ] Eventos coloridos por status
- [ ] Click no evento abre modal de detalhes
- [ ] Sidebar com resumo do período
- [ ] Navegação de datas

**Critérios de Aceitação**:

- Calendário mostra agendamentos de todos os tenants vinculados
- Filtros atualizam visualização
- Cores indicam status claramente
- Modal mostra detalhes e ações

**Dependências**: Etapa 6.5

---

### Etapa 7.2: Lista do Dia (Daily View)

**Descrição**: Visualização focada nos agendamentos do dia atual.

**Backend**:

- [ ] Criar API route `GET /api/therapist/daily?date=YYYY-MM-DD`
- [ ] Retornar agendamentos do dia ordenados por horário
- [ ] Incluir: próximo agendamento destacado, tempo até próximo

**Frontend**:

- [ ] Criar página `/therapist/daily`
- [ ] Seletor de data
- [ ] Timeline vertical com agendamentos
- [ ] Destaque visual para próximo agendamento
- [ ] Quick actions inline (marcar presença)
- [ ] Card de resumo no topo (total, feitos, pendentes)

**Critérios de Aceitação**:

- Lista mostra todos os agendamentos do dia
- Próximo agendamento é destacado
- Ações rápidas funcionam sem navegar

**Dependências**: Etapa 7.1

---

### Etapa 7.3: Registro de Presença (Check-in)

**Descrição**: Implementar funcionalidade para terapeuta registrar presença ou ausência do funcionário.

**Backend**:

- [ ] Criar API route `PATCH /api/therapist/appointments/[id]/check-in`
- [ ] Aceitar: status (PRESENT, NO_SHOW, LATE), notes, delay_minutes
- [ ] Validar: agendamento do terapeuta, horário permitido (após início + tolerância)
- [ ] Atualizar Appointment com check_in_status e check_in_at
- [ ] Para NO_SHOW:
  - Incrementar contador de no-shows do funcionário
  - Se >= 3: bloquear funcionário (15 dias)
  - Notificar funcionário e TENANT_ADMIN
- [ ] Registrar em log de auditoria

**Frontend**:

- [ ] Criar modal/página de check-in
- [ ] Opções visuais: ✅ Presente, ❌ Ausente (No-show), ⏰ Atrasado
- [ ] Campo de tempo de atraso (se LATE)
- [ ] Campo de observações
- [ ] Confirmação antes de marcar no-show

**Critérios de Aceitação**:

- Só pode marcar presença após horário do agendamento
- No-show só disponível após tolerância (15 min)
- Notificações são enviadas
- Bloqueio por no-shows funciona

**Dependências**: Etapa 7.2

---

### Etapa 7.4: Detalhes do Agendamento (Terapeuta)

**Descrição**: Página de detalhes do agendamento com todas as informações para o terapeuta.

**Backend**:

- [ ] Criar API route `GET /api/therapist/appointments/[id]`
- [ ] Validar que agendamento é do terapeuta logado
- [ ] Retornar: todos os dados + histórico de interações

**Frontend**:

- [ ] Criar página `/therapist/appointments/[id]`
- [ ] Dados do funcionário: nome, empresa, email
- [ ] Dados do agendamento: data, horário, programa, local
- [ ] Status atual com histórico
- [ ] Ações: Marcar Presença (se pendente), Adicionar Notas
- [ ] Histórico de alterações

**Critérios de Aceitação**:

- Terapeuta vê apenas agendamentos próprios
- Ações são condicionais ao status
- Histórico mostra todas as interações

**Dependências**: Etapa 7.3

---

### Etapa 7.5: Histórico de Atendimentos

**Descrição**: Página para terapeuta visualizar histórico completo de atendimentos com métricas.

**Backend**:

- [ ] Criar API route `GET /api/therapist/history`
- [ ] Filtros: período, tenant, location, programa, status
- [ ] Retornar: lista paginada + estatísticas (total, no-show rate, etc)

**Frontend**:

- [ ] Criar página `/therapist/history`
- [ ] Filtros avançados (período, tenant, status)
- [ ] DataTable com atendimentos
- [ ] Stats cards: total, taxa de comparecimento
- [ ] Gráfico de atendimentos por mês
- [ ] Botão de exportar (CSV)

**Critérios de Aceitação**:

- Histórico é filtrado corretamente
- Estatísticas são calculadas
- Exportação funciona
- Paginação funciona

**Dependências**: Etapa 7.4

---

## PARTE 8: Dashboards Administrativos

**Objetivo**: Implementar dashboards e funcionalidades de gestão para TENANT_ADMIN e SUPER_ADMIN.

**Perfis impactados**: TENANT_ADMIN, SUPER_ADMIN
**Dependências**: PARTE 7 (Experiência do Terapeuta)
**Estimativa**: 1.5 semanas

---

### Etapa 8.1: Dashboard do TENANT_ADMIN

**Descrição**: Dashboard com métricas e visão executiva do tenant.

**Backend**:

- [ ] Criar API route `GET /api/tenant-admin/dashboard`
- [ ] Retornar KPIs: total funcionários, agendamentos do mês, utilização, no-show rate
- [ ] Retornar dados para gráficos: timeline, por programa, por location
- [ ] Incluir: top users, atividade recente

**Frontend**:

- [ ] Criar página `/tenant-admin/dashboard`
- [ ] Grid de StatsCards (KPIs principais)
- [ ] LineChart: agendamentos por período
- [ ] PieChart: agendamentos por programa
- [ ] BarChart: utilização por location
- [ ] Lista: Top usuários
- [ ] Lista: Atividade recente
- [ ] Quick actions: Gerenciar Funcionários, Ver Relatórios

**Critérios de Aceitação**:

- Dashboard carrega dados do tenant do admin
- Gráficos são interativos
- Período pode ser alterado
- KPIs são precisos

**Dependências**: Etapa 7.5

---

### Etapa 8.2: Gestão de Funcionários (TENANT_ADMIN)

**Descrição**: CRUD completo de funcionários do tenant.

**Backend**:

- [ ] Criar API route `GET /api/tenant-admin/employees`
- [ ] Criar API route `POST /api/tenant-admin/employees`
- [ ] Validar domínio do email
- [ ] Criar API route `PATCH /api/tenant-admin/employees/[id]/toggle-status`
- [ ] Criar API route `POST /api/tenant-admin/employees/[id]/reset-password`

**Frontend**:

- [ ] Criar página `/tenant-admin/employees`
- [ ] DataTable com busca e filtros
- [ ] Modal de cadastro de funcionário
- [ ] Ações: ver detalhes, ativar/desativar, resetar senha
- [ ] Exportar lista (CSV)

**Critérios de Aceitação**:

- Apenas funcionários do próprio tenant são exibidos
- Cadastro valida domínio do email
- Reset de senha envia novo link
- Desativar bloqueia acesso

**Dependências**: Etapa 8.1

---

### Etapa 8.3: Relatórios do TENANT_ADMIN

**Descrição**: Geração de relatórios de utilização do tenant.

**Backend**:

- [ ] Criar API route `GET /api/tenant-admin/reports/monthly?month=YYYY-MM`
- [ ] Retornar dados agregados por período
- [ ] Criar API route `POST /api/tenant-admin/reports/generate-pdf`
- [ ] Gerar PDF com dados do relatório

**Frontend**:

- [ ] Criar página `/tenant-admin/reports`
- [ ] Seletor de tipo de relatório
- [ ] Filtros: período, location
- [ ] Visualização de dados em tabelas e gráficos
- [ ] Botão "Gerar PDF"
- [ ] Botão "Enviar por Email"

**Critérios de Aceitação**:

- Relatórios mostram dados corretos do tenant
- PDF é gerado e baixado
- Email é enviado com anexo

**Dependências**: Etapa 8.2

---

### Etapa 8.4: Dashboard Global (SUPER_ADMIN)

**Descrição**: Dashboard com visão consolidada de toda a plataforma.

**Backend**:

- [ ] Criar API route `GET /api/admin/dashboard`
- [ ] Retornar: total tenants, employees, therapists, appointments
- [ ] Retornar dados para gráficos: crescimento, por tenant, distribuição
- [ ] Incluir: alertas do sistema, tenants recentes

**Frontend**:

- [ ] Criar página `/admin/dashboard`
- [ ] Grid de GlobalStatsCards
- [ ] LineChart: crescimento de usuários
- [ ] BarChart: agendamentos por tenant
- [ ] Lista: Tenants recentes
- [ ] Lista: Alertas do sistema
- [ ] Quick actions: Criar Tenant, Cadastrar Terapeuta

**Critérios de Aceitação**:

- Dashboard mostra dados consolidados
- Gráficos comparam tenants
- Alertas são exibidos

**Dependências**: Etapa 8.3

---

### Etapa 8.5: Logs e Auditoria (SUPER_ADMIN)

**Descrição**: Visualização de logs de auditoria do sistema.

**Backend**:

- [ ] Criar API route `GET /api/admin/logs`
- [ ] Filtros: action type, user, period, resource
- [ ] Retornar logs paginados

**Frontend**:

- [ ] Criar página `/admin/logs`
- [ ] Filtros avançados
- [ ] DataTable com logs
- [ ] Detalhes expandíveis
- [ ] Exportar logs

**Critérios de Aceitação**:

- Logs são filtrados corretamente
- Detalhes mostram informações completas
- Performance adequada com muitos logs

**Dependências**: Etapa 8.4

---

### Etapa 8.6: Configurações Globais (SUPER_ADMIN)

**Descrição**: Gerenciamento de configurações globais da plataforma.

**Backend**:

- [ ] Criar API route `GET /api/admin/settings`
- [ ] Criar API route `PATCH /api/admin/settings`
- [ ] Configurações: políticas padrão, limites, integrações

**Frontend**:

- [ ] Criar página `/admin/settings`
- [ ] Seção: Políticas Padrão (antecedência, no-shows)
- [ ] Seção: Email Templates (visualização)
- [ ] Seção: Integrações (webhooks)
- [ ] Seção: Segurança (regras de senha, rate limits)

**Critérios de Aceitação**:

- Configurações são salvas corretamente
- Mudanças afetam comportamento global
- Valores padrão são sensatos

**Dependências**: Etapa 8.5

---

## PARTE 9: Refinamento e Deploy

**Objetivo**: Finalizar o projeto com otimizações, testes, documentação e deploy para produção.

**Perfis impactados**: Todos
**Dependências**: PARTES 1-8
**Estimativa**: 1-2 semanas

---

### Etapa 9.1: Testes Automatizados

**Descrição**: Implementar suite de testes para garantir qualidade.

**Backend**:

- [ ] Configurar Jest para testes unitários
- [ ] Criar testes para services de autenticação
- [ ] Criar testes para regras de agendamento
- [ ] Criar testes para validações de multi-tenancy
- [ ] Configurar testes de integração com banco de testes

**Frontend**:

- [ ] Configurar Testing Library
- [ ] Criar testes para componentes críticos
- [ ] Criar testes para hooks de autenticação
- [ ] Criar testes E2E com Playwright (fluxos principais)

**Critérios de Aceitação**:

- Cobertura mínima de 70% em services críticos
- Testes E2E cobrem fluxos principais (login, agendamento, cancelamento)
- CI executa testes automaticamente

**Dependências**: Todas as etapas anteriores

---

### Etapa 9.2: Performance e Otimizações

**Descrição**: Otimizar performance da aplicação.

**Backend**:

- [ ] Implementar caching de queries frequentes (Redis opcional)
- [ ] Otimizar queries N+1 com includes
- [ ] Implementar paginação eficiente com cursors
- [ ] Configurar índices adicionais se necessário

**Frontend**:

- [ ] Implementar lazy loading de rotas
- [ ] Otimizar bundle size (code splitting)
- [ ] Implementar skeleton loaders
- [ ] Configurar image optimization

**Critérios de Aceitação**:

- LCP < 3s em conexões 3G
- FID < 100ms
- Queries principais < 100ms
- Bundle inicial < 300KB

**Dependências**: Etapa 9.1

---

### Etapa 9.3: Acessibilidade e UX

**Descrição**: Garantir acessibilidade e melhorar experiência do usuário.

**Frontend**:

- [ ] Auditar com Lighthouse e axe-core
- [ ] Corrigir issues de acessibilidade (ARIA, contraste, foco)
- [ ] Testar navegação por teclado
- [ ] Implementar skip links
- [ ] Testar com leitor de tela
- [ ] Responsividade em todas as páginas

**Critérios de Aceitação**:

- Score de acessibilidade > 90 no Lighthouse
- Navegação por teclado funciona em todos os formulários
- Contraste atende WCAG 2.1 AA
- Mobile-friendly em todos os breakpoints

**Dependências**: Etapa 9.2

---

### Etapa 9.4: Documentação e API Docs

**Descrição**: Documentar o sistema e gerar documentação de API.

**Backend**:

- [ ] Configurar Swagger/OpenAPI
- [ ] Documentar todos os endpoints
- [ ] Incluir exemplos de request/response
- [ ] Documentar códigos de erro

**Frontend**:

- [ ] Criar README com instruções de setup
- [ ] Documentar variáveis de ambiente
- [ ] Criar CONTRIBUTING.md

**Critérios de Aceitação**:

- Swagger UI acessível em /api-docs
- Todos os endpoints documentados
- README permite setup do zero

**Dependências**: Etapa 9.3

---

### Etapa 9.5: CI/CD e Deploy

**Descrição**: Configurar pipeline de CI/CD e realizar deploy em produção.

**DevOps**:

- [ ] Configurar GitHub Actions para CI
- [ ] Pipeline: lint, type-check, tests, build
- [ ] Configurar Vercel/Railway para deploy
- [ ] Configurar banco de produção (Neon/Supabase)
- [ ] Configurar variáveis de ambiente de produção
- [ ] Configurar domínio customizado
- [ ] Configurar SSL/HTTPS

**Critérios de Aceitação**:

- Push para main dispara deploy
- PRs executam testes automaticamente
- Ambiente de produção funcional
- HTTPS configurado

**Dependências**: Etapa 9.4

---

### Etapa 9.6: Monitoramento e Observabilidade

**Descrição**: Configurar ferramentas de monitoramento para produção.

**DevOps**:

- [ ] Configurar Sentry para error tracking
- [ ] Configurar Vercel Analytics (ou similar)
- [ ] Configurar alertas de erro
- [ ] Configurar backup automático do banco
- [ ] Documentar runbook de operações

**Critérios de Aceitação**:

- Erros são capturados e notificados
- Métricas de performance são coletadas
- Backups são executados diariamente
- Runbook documenta procedimentos de emergência

**Dependências**: Etapa 9.5

---

## Resumo de Dependências entre PARTES

| PARTE | Nome                             | Depende de  |
| ----- | -------------------------------- | ----------- |
| 1     | Fundação e Infraestrutura      | -           |
| 2     | Autenticação e Autorização   | PARTE 1     |
| 3     | Gestão de Tenants e Locations   | PARTE 2     |
| 4     | Gestão de Terapeutas            | PARTE 3     |
| 5     | Programas e Disponibilidade      | PARTES 3, 4 |
| 6     | Fluxo de Agendamentos (Employee) | PARTE 5     |
| 7     | Experiência do Terapeuta        | PARTE 6     |
| 8     | Dashboards Administrativos       | PARTE 7     |
| 9     | Refinamento e Deploy             | PARTES 1-8  |

---

## Cronograma Estimado

| PARTE           | Duração               | Semanas |
| --------------- | ----------------------- | ------- |
| PARTE 1         | 1.5 semanas             | S1-S2   |
| PARTE 2         | 1.5 semanas             | S2-S3   |
| PARTE 3         | 1 semana                | S4      |
| PARTE 4         | 1 semana                | S5      |
| PARTE 5         | 1.5 semanas             | S6-S7   |
| PARTE 6         | 1.5 semanas             | S7-S8   |
| PARTE 7         | 1 semana                | S9      |
| PARTE 8         | 1.5 semanas             | S10-S11 |
| PARTE 9         | 1-2 semanas             | S12-S13 |
| **TOTAL** | **13-15 semanas** |         |

---

## Métricas de Sucesso

| Métrica                             | Target  |
| ------------------------------------ | ------- |
| Performance (LCP)                    | < 3s    |
| Interatividade (FID)                 | < 100ms |
| Disponibilidade                      | > 99.5% |
| Taxa de conclusão de agendamento    | > 85%   |
| Incidentes de vazamento cross-tenant | Zero    |
| Cobertura de testes                  | > 70%   |
| Score de acessibilidade              | > 90    |

---

> **Nota**: Este plano é um guia e pode ser ajustado conforme o andamento do projeto, feedback de stakeholders, ou descobertas técnicas durante a implementação.
