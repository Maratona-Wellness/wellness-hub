# Status de Implementação - Wellness Hub

> **Última Atualização:** 13 de março de 2026  
> **Parte Atual:** CHANGES PARTE 6 - Reestruturação dos Dashboards (Concluída)  
> **Etapa Atual:** Changes 6.4 - Dashboard Tenant Admin Charts (Concluída)

---

## Resumo Executivo

| Métrica               | Status                                       |
| --------------------- | -------------------------------------------- |
| **Parte Atual**       | PARTE 8 / 9 + CHANGES 6 / 6                  |
| **Etapas Concluídas** | 48 / 53 + 23 / 23 changes                    |
| **Progresso Geral**   | 90.6% (base) + Changes PARTEs 1-6 concluídas |
| **Status**            | ✅ Changes completas                         |

---

## CHANGES PARTE 6: Reestruturação dos Dashboards ✅

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026  
**Estimativa:** 1 semana  
**Perfis impactados:** SUPER_ADMIN, TENANT_ADMIN

### ✅ Changes Etapa 6.1: Dashboard Super Admin — Big Numbers

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Reescrita completa de `getSuperAdminDashboard(days)` com parâmetro de período configurável (7/15/30 dias)
- ✅ 4 big numbers implementados: Empresas Ativas, Total de Funcionários, Total de Acessos (AuthLog SUCCESS), Total de Agendamentos
- ✅ API route `GET /api/admin/dashboard` atualizada para aceitar query param `?days=`
- ✅ Grid de 4 colunas responsivo (1 col mobile, 2 col sm, 4 col lg)
- ✅ Cada card com ícone colorido, número grande em destaque e label descritivo

### ✅ Changes Etapa 6.2: Dashboard Super Admin — Charts

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Recharts (v3.8.0) instalado e configurado como dependência
- ✅ Chart 1: Gráfico de barras empilhado — Agendamentos por dia (verde=concluídos, vermelho=cancelados, azul=agendados)
- ✅ Chart 2: Gráfico de barras — Acessos diários da plataforma (roxo)
- ✅ Chart 3: Gráfico de barras horizontal — Funcionários por empresa (laranja)
- ✅ Todos os charts com tooltips interativos, legendas e responsividade via ResponsiveContainer
- ✅ Filtro de período (7/15/30 dias) funcional com recarregamento de dados
- ✅ Layout: chart 1 ocupa largura total, charts 2 e 3 lado a lado em desktop

### ✅ Changes Etapa 6.3: Dashboard Tenant Admin — Big Numbers

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Reescrita completa de `getTenantAdminDashboard(tenantId, days)` com parâmetro de período
- ✅ 4 big numbers: Total de Funcionários, Total de Acessos (tenant), Total de Agendamentos (tenant), Taxa de Conversão (%)
- ✅ Cálculo de acessos por tenant via junção Employee.userId + UserRole(TENANT_ADMIN) → AuthLog
- ✅ Taxa de conversão = (agendamentos / acessos) \* 100
- ✅ API route `GET /api/tenant-admin/dashboard` atualizada para aceitar query param `?days=`
- ✅ Grid de 4 colunas responsivo com ícones coloridos e valores em destaque

### ✅ Changes Etapa 6.4: Dashboard Tenant Admin — Charts

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Chart 1: Gráfico de barras empilhado — Agendamentos por dia (verde=concluídos, vermelho=cancelados, azul=agendados)
- ✅ Chart 2: Gráfico de barras — Acessos diários dos funcionários (roxo)
- ✅ Chart 3: Gráfico de linha — Taxa de conversão diária (laranja)
- ✅ Todos os charts com tooltips, legendas e responsividade
- ✅ Filtro de período (7/15/30 dias) funcional
- ✅ Dados filtrados corretamente por tenantId

**Arquivos Criados/Modificados (PARTE 6):**

- `services/admin-dashboard.ts` — Reescrita de `getSuperAdminDashboard()` e `getTenantAdminDashboard()`, adição de helpers `buildDailyDateMap()` e `dateToKey()`
- `app/api/admin/dashboard/route.ts` — Suporte a query param `?days=`
- `app/api/tenant-admin/dashboard/route.ts` — Suporte a query param `?days=`
- `app/superadmin/dashboard/page.tsx` — Reescrita completa com 4 big numbers + 3 charts Recharts
- `app/admin/dashboard/page.tsx` — Reescrita completa com 4 big numbers + 3 charts Recharts
- `package.json` — Adição de `recharts` como dependência

**Decisões Técnicas:**

- Recharts escolhido por ser a biblioteca mais popular para React, com boa tipagem TS e suporte a SSR
- Dados diários (ao invés de mensais) para os charts, permitindo granularidade maior e filtro por período
- Funções helper `buildDailyDateMap` e `dateToKey` centralizadas para evitar duplicação
- Acessos do tenant calculados via junção Employee.userId + UserRole(TENANT_ADMIN) → AuthLog, pois AuthLog não possui tenantId diretamente
- Chart 3 do Tenant Admin usa LineChart (ao invés de BarChart) para melhor visualização da taxa de conversão ao longo do tempo

---

## CHANGES PARTE 5: Correções do Super Admin ✅

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026  
**Estimativa:** 1 semana  
**Perfis impactados:** SUPER_ADMIN, TENANT_ADMIN

### ✅ Changes Etapa 5.1: Programas Globais (Sem Tenant Obrigatório)

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Criado model `TenantProgram` no Prisma Schema (muitos-para-muitos entre Tenant e Program)
- ✅ Campo `Program.tenantId` tornado opcional (`String?`), relação `onDelete: SetNull`
- ✅ Criado arquivo de migração SQL `prisma/migrations/20260313_add_tenant_programs/migration.sql`
- ✅ `prisma generate` executado com sucesso (tipos atualizados no PrismaClient)
- ✅ Criado endpoint `GET/POST/DELETE /api/admin/programs/[id]/tenants` para gerenciar vínculos program↔tenant
- ✅ `createProgram` agora lida com `tenantId` opcional e cria `TenantProgram` entries via `tenantIds`
- ✅ `listPrograms` inclui `tenantPrograms` na query
- ✅ `listProgramsByTenant` agora usa `tenantPrograms: { some: { tenantId } }`
- ✅ Schema de validação atualizado — `tenantId` opcional, adicionado `tenantIds` array
- ✅ Página de programas do super admin atualizada — coluna "Empresa" mostra tenants vinculados com badge de contagem
- ✅ Select de tenant mostra "Programa global (sem vínculo)" como padrão

**Arquivos Modificados:**

- `prisma/schema.prisma` — model TenantProgram, Program.tenantId optional
- `prisma/migrations/20260313_add_tenant_programs/migration.sql` — NOVO
- `app/api/admin/programs/[id]/tenants/route.ts` — NOVO
- `services/program.ts` — createProgram, listPrograms, listProgramsByTenant
- `lib/validations/program.ts` — tenantId optional, tenantIds array
- `app/superadmin/programs/page.tsx` — interface, columns, labels, form

### ✅ Changes Etapa 5.2: Capacidade por Sessão (Label)

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Label da coluna alterado para "Capacidade Máxima por Sessão (pessoas simultâneas)"
- ✅ Help text atualizado no formulário de criação

**Arquivos Modificados:**

- `app/superadmin/programs/page.tsx` — labels e help text (implementado junto com Etapa 5.1)

### ✅ Changes Etapa 5.3: Remover Logs de Acesso

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Item "Logs de Acesso" removido do menu SUPER_ADMIN em `lib/config/menu.ts`
- ✅ Página de logs substituída por redirecionamento para `/dashboard`

**Arquivos Modificados:**

- `lib/config/menu.ts` — removido item Logs de Acesso
- `app/superadmin/logs/page.tsx` — substituído por redirect

### ✅ Changes Etapa 5.4: Administradores no Detalhe do Tenant

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ `getTenantById` agora busca usuários com role TENANT_ADMIN via UserRole→UserAccount join
- ✅ Retorna array `admins` com id, name, email, active, createdAt
- ✅ Nova aba "Administradores" na página de detalhe do tenant
- ✅ Exibe lista com nome, email, badge de status (ativo/inativo), data de criação

**Arquivos Modificados:**

- `services/tenant.ts` — getTenantById com query de admins
- `app/superadmin/tenants/[id]/page.tsx` — AdminItem interface, aba Administradores

### ✅ Changes Etapa 5.5: Remover Campo Logo URL

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Removido campo `logoUrl` do wizard de criação de tenant (step 1 e step 4 review)
- ✅ Removido `logoUrl` da página de edição de tenant (state, fetch, validação, payload, FormField)
- ✅ Removido `logoUrl` da página de configurações do admin (state, fetchSettings, useEffect, validação, PATCH body, FormField)

**Arquivos Modificados:**

- `app/superadmin/tenants/new/page.tsx` — removido logoUrl do formulário e review
- `app/superadmin/tenants/[id]/edit/page.tsx` — removido logoUrl completo
- `app/admin/settings/page.tsx` — removido logoUrl completo

### ✅ Changes Etapa 5.6: Visualização de Programas para Tenant Admin (Read-Only)

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Criado endpoint `GET /api/tenant-admin/programs` com `requireRole(["TENANT_ADMIN"])`
- ✅ Endpoint usa `listProgramsByTenant(user.tenantId)` para retornar apenas programas vinculados
- ✅ Criada página `/admin/programs` com visualização em cards (read-only)
- ✅ Cards exibem: nome, duração, período, capacidade, status, contadores de slots e agendamentos
- ✅ Busca por nome disponível, badges de contagem total e ativos
- ✅ Sem botões de criação, edição ou exclusão (apenas visualização)
- ✅ Item "Programas" adicionado ao menu TENANT_ADMIN apontando para `/admin/programs`

**Arquivos Criados:**

- `app/api/tenant-admin/programs/route.ts` — NOVO
- `app/admin/programs/page.tsx` — NOVO

**Arquivos Modificados:**

- `lib/config/menu.ts` — adicionado item Programas ao menu TENANT_ADMIN

---

## CHANGES PARTE 4: Correções do Therapist ✅

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026  
**Estimativa:** 1 semana  
**Perfis impactados:** THERAPIST

### ✅ Changes Etapa 4.1: Correção da Visualização de Disponibilidade

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Cards de slots agora têm padding e font-size maiores em desktop (`lg:p-2.5`, `lg:text-sm`)
- ✅ Texto do programa e local não truncam em telas grandes (`lg:whitespace-normal`)
- ✅ Font-size do cabeçalho dos dias aumentado em desktop (`lg:text-sm`)
- ✅ Implementada detecção de largura de tela via `window.innerWidth` com resize listener
- ✅ Em telas >= 1700px sem slots no sábado/domingo: grid exibe apenas 5 colunas (seg-sex)
- ✅ Em telas >= 1700px com slots no fim de semana: mantém 7 colunas
- ✅ Grid responsivo dinâmico (`lg:grid-cols-5` ou `lg:grid-cols-7`)

**Arquivos Modificados:**

- `app/therapist/availability/page.tsx` — lógica de detecção de largura, grid dinâmico, melhorias CSS

### ✅ Changes Etapa 4.2: Remover Dashboard do Therapist — Home = Calendário

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ `getRedirectByRole()` alterada — THERAPIST agora retorna `/therapist/calendar`
- ✅ Middleware `proxy.ts` atualizado — THERAPIST acessando `/dashboard` é redirecionado para `/therapist/calendar`
- ✅ Item "Home" removido do menu THERAPIST em `lib/config/menu.ts`
- ✅ "Calendário" é agora o primeiro item do menu THERAPIST

**Arquivos Modificados:**

- `lib/hooks/useAuth.ts` — `getRedirectByRole()` retorna `/therapist/calendar` para THERAPIST
- `proxy.ts` — redirect de `/dashboard` para `/therapist/calendar` quando role é THERAPIST
- `lib/config/menu.ts` — removido item "Home" do menu THERAPIST

### ✅ Changes Etapa 4.3: Responsividade do Seletor de Visualização no Calendário

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Barra de navegação do calendário usa `flex-col xl:flex-row` — quebra de linha abaixo de 1280px
- ✅ Toggle de visualização (Dia/Semana/Mês) centralizado quando em coluna
- ✅ Gap adequado (`gap-4`) entre navegação e toggle
- ✅ Toggle com `shrink-0` para não comprimir botões

**Arquivos Modificados:**

- `app/therapist/calendar/page.tsx` — layout responsivo da barra de navegação + correções de classes Tailwind

### ✅ Changes Etapa 4.4: Responsividade do Histórico de Agendamentos

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Botões do header empilham em mobile com `flex-wrap` e `flex-1 sm:flex-none`
- ✅ Stats cards adaptam grid: `grid-cols-1 xs:grid-cols-2 sm:grid-cols-4`
- ✅ Gráfico de barras envolvido com `overflow-x-auto` e `min-w-75` para scroll horizontal em mobile
- ✅ Barras individuais com `min-w-10` para garantir legibilidade
- ✅ Gap dos filtros ajustado: `gap-3 sm:gap-4`

**Arquivos Modificados:**

- `app/therapist/history/page.tsx` — responsividade do header, stats, gráfico e filtros

---

## CHANGES PARTE 3: Correções do Employee ✅

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026  
**Estimativa:** 0.5 semana  
**Perfis impactados:** EMPLOYEE

### ✅ Changes Etapa 3.1: Remover Home do Employee e Tornar Agendamentos a Página Inicial

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ `getRedirectByRole()` alterada — EMPLOYEE agora retorna `/appointments` ao invés de `/dashboard`
- ✅ Middleware `proxy.ts` atualizado — EMPLOYEE acessando `/dashboard` é redirecionado para `/appointments`
- ✅ Item "Home" removido do menu EMPLOYEE em `lib/config/menu.ts`
- ✅ "Meus Agendamentos" é agora o primeiro item do menu e fica ativo ao acessar

**Arquivos Modificados:**

- `lib/hooks/useAuth.ts` — `getRedirectByRole()` retorna `/appointments` para EMPLOYEE
- `proxy.ts` — redirect de `/dashboard` para `/appointments` quando role é EMPLOYEE
- `lib/config/menu.ts` — removido item "Home" do menu EMPLOYEE

### ✅ Changes Etapa 3.2: Correção do Perfil do Employee

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Removidos os 4 cards de estatísticas (Total, Realizados, Cancelados, Frequência) da página `/profile`
- ✅ Interface `EmployeeProfile` corrigida para refletir estrutura real da API (`user`, `employee`, `stats`)
- ✅ Campo "Email" corrigido — agora lê de `profile.user.email` (antes `profile.email` estava vazio)
- ✅ Campo "Empresa" corrigido — agora lê de `profile.employee.tenantName` (antes `profile.tenant.name` estava vazio)
- ✅ Inicialização do campo nome corrigida para usar `profile.employee.name`
- ✅ Atualização do estado após salvar corrigida para atualizar ambos `employee.name` e `user.displayName`
- ✅ Imports não utilizados removidos (`CalendarCheck`, `XCircle`, `TrendingUp`)

**Arquivos Modificados:**

- `app/profile/page.tsx` — removidos stats cards, corrigido mapeamento de dados da API

### ✅ Changes Etapa 3.3: Correção do Foco da Sidebar — Novo Agendamento

**Status:** Concluída (resolvida antecipadamente na Changes Etapa 1.4)  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Já corrigido na Changes Etapa 1.4 — `isActive()` usa `pathname === href` (match exato)
- ✅ `/appointments/new` não ativa `/appointments` simultaneamente
- ✅ Verificado: navegação entre itens destaca corretamente apenas o item atual

**Arquivos:** Nenhuma alteração necessária (já resolvido)

---

## CHANGES PARTE 2: Correções de Autenticação e Cadastro ✅

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026  
**Estimativa:** 0.5 semana  
**Perfis impactados:** EMPLOYEE (cadastro), Todos (reset de senha)

### ✅ Changes Etapa 2.1: Validação de Conta Existente no Envio de Email

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Criada função `checkExistingAccount()` no serviço de autenticação
- ✅ API `POST /api/auth/magic-link/request` verifica conta existente antes de gerar token
  - Retorna 409 com mensagem "Já existe uma conta cadastrada com esse email. Faça login." e `code: "ACCOUNT_EXISTS"`
- ✅ API `POST /api/auth/forgot-password` verifica se conta está inativa antes de gerar token de reset
  - Retorna 403 com mensagem "Sua conta está inativa. Entre em contato com o RH da sua empresa." e `code: "ACCOUNT_INACTIVE"`
  - Conta inexistente continua retornando sucesso genérico (segurança)
- ✅ Página `/signup` exibe Alert de erro com link "Ir para login →" quando `code === "ACCOUNT_EXISTS"`
- ✅ Página `/forgot-password` exibe Alert de warning com mensagem detalhada quando `code === "ACCOUNT_INACTIVE"`

**Arquivos Modificados:**

- `services/auth.ts` — adicionada função `checkExistingAccount()`
- `app/api/auth/magic-link/request/route.ts` — verificação de conta existente (409)
- `app/api/auth/forgot-password/route.ts` — verificação de conta inativa (403)
- `app/signup/page.tsx` — tratamento de `ACCOUNT_EXISTS` com link para login
- `app/forgot-password/page.tsx` — tratamento de `ACCOUNT_INACTIVE` com mensagem orientativa

### ✅ Changes Etapa 2.2: Correção do Checkbox de Termos de Uso

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Criado arquivo placeholder `public/assets/termos-de-uso.pdf`
- ✅ Texto do checkbox atualizado para incluir link clicável: "Li e aceito os [Termos de Uso] e política de privacidade"
- ✅ Link abre/baixa o PDF `termos-de-uso.pdf` em nova aba
- ✅ Componente `Checkbox` corrigido — div visual agora está envolvido em `<label htmlFor>`, garantindo que click no quadrado marca/desmarca
- ✅ Click no texto do label também marca/desmarca corretamente
- ✅ Tipo de `label` alterado para `string | React.ReactNode` no Checkbox e FormField
- ✅ Classes Tailwind atualizadas para syntax v4 moderna

**Arquivos Modificados:**

- `components/ui/Checkbox.tsx` — reestruturado com `<label>` envolvendo input visual
- `components/molecules/FormField.tsx` — tipo `label` aceita `ReactNode`
- `app/signup/complete/page.tsx` — label do checkbox com link para termos

**Arquivos Criados:**

- `public/assets/termos-de-uso.pdf` (placeholder)

---

## CHANGES PARTE 1: Correções Gerais de UI/UX ✅

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026  
**Estimativa:** 1 semana  
**Perfis impactados:** Todos

### ✅ Changes Etapa 1.1: Limpeza da Sidebar — Remover Itens Inválidos

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Menu EMPLOYEE auditado — todos os itens possuem páginas existentes
- ✅ Menu THERAPIST auditado — todos os itens possuem páginas existentes
- ✅ Menu TENANT_ADMIN auditado — removidos `/admin/appointments` e `/admin/programs` (páginas inexistentes)
- ✅ Menu SUPER_ADMIN auditado — removidos `/superadmin/users`, `/superadmin/appointments` e `/superadmin/reports` (páginas inexistentes)

**Arquivos Modificados:**

- `lib/config/menu.ts`

### ✅ Changes Etapa 1.2: Substituição da Logo — Usar Imagem Oficial

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Imagem de logo copiada de `/assets` para `/public/logo.jpeg`
- ✅ Componente Navbar atualizado com `<Image>` do Next.js
- ✅ Texto "Wellness Hub" mantido ao lado da imagem
- ✅ Link para `/dashboard` preservado
- ✅ Imagem otimizada pelo Next.js `<Image>` com `priority`

**Arquivos Modificados:**

- `components/layouts/Navbar.tsx`
- `public/logo.jpeg` (novo)

### ✅ Changes Etapa 1.3: Remover Notificações e User Menu do Header

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Botão de notificações (sino com badge) removido do Navbar
- ✅ Bloco de avatar + nome + email (UserMenu) removido do Navbar
- ✅ UserMenu removido do barrel export de layouts
- ✅ Props `user` e `notificationCount` removidas do NavbarProps e DashboardLayoutProps
- ✅ Layout do Navbar ajustado para não deixar espaço vazio
- ✅ Nenhuma referência quebrada no restante do código

**Arquivos Modificados:**

- `components/layouts/Navbar.tsx`
- `components/layouts/DashboardLayout.tsx`
- `components/layouts/index.ts`
- `app/layouts-showcase/page.tsx`

### ✅ Changes Etapa 1.4: Botão de Sair na Sidebar com Modal de Confirmação

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Botão "Sair" adicionado abaixo da nav, antes do footer, com ícone `LogOut` (vermelho)
- ✅ Modal de confirmação usando componente `Modal` existente
- ✅ Texto: "Tem certeza que deseja sair? Sua sessão será encerrada."
- ✅ Botões "Cancelar" (ghost) e "Sair" (danger)
- ✅ `signOut()` do NextAuth com `callbackUrl: '/login'`
- ✅ **Fix adicional:** `isActive()` corrigido para usar `pathname === href` (match exato) — resolve Etapa 3.3 do Changes antecipadamente

**Arquivos Modificados:**

- `components/layouts/Sidebar.tsx`

### ✅ Changes Etapa 1.5: Correção dos Inputs Select — Texto Visível

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Altura fixa `h-10` alterada para `min-h-10` — permite expansão do conteúdo
- ✅ Adicionado `truncate` para texto longo exibir ellipsis em vez de ocultar

**Arquivos Modificados:**

- `components/ui/Select.tsx`

### ✅ Changes Etapa 1.6: Componente de Tabela Padrão Reutilizável (DataTable)

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Componente `DataTable` genérico criado com TypeScript generics
- ✅ Props: `columns[]` (header, accessor, render, sortable, className, minWidth), `data[]`, `loading`, `emptyMessage`
- ✅ Renderização customizada de células via `render` function
- ✅ Ordenação por coluna (asc/desc/none) com ícones visuais
- ✅ Loading state com skeleton rows animados
- ✅ Empty state integrado com componente `EmptyState`
- ✅ Integração com `Pagination` existente (via prop `pagination`)
- ✅ Integração com `SearchBar` existente (via prop `search`)
- ✅ Responsividade via scroll horizontal (`overflow-x-auto`)
- ✅ Suporte a `onRowClick` para linhas clicáveis
- ✅ Exportado no barrel `components/molecules/index.ts`

**Arquivos Criados:**

- `components/molecules/DataTable.tsx`

**Arquivos Modificados:**

- `components/molecules/index.ts`

### ✅ Changes Etapa 1.7: Correção do Scroll — Sidebar e Header Fixos

**Status:** Concluída  
**Data de Conclusão:** 13 de março de 2026

**Realizado:**

- ✅ Navbar fixo no topo com `fixed top-0 left-0 right-0 z-40`
- ✅ Sidebar fixa na lateral com `fixed left-0 z-30`, abaixo do Navbar (`lg:top-16 lg:h-[calc(100vh-4rem)]`)
- ✅ Conteúdo principal com `pt-16` e `lg:ml-64` para compensar fixos
- ✅ Sidebar não sobrepõe o header (z-index hierárquico: navbar=40, sidebar=30)
- ✅ Overlay mobile da sidebar continua funcional (z-50 quando aberta)
- ✅ Testável em todos os breakpoints

**Arquivos Modificados:**

- `components/layouts/DashboardLayout.tsx`
- `components/layouts/Sidebar.tsx`

---

## PARTE 1: Fundação e Infraestrutura ✅

**Status:** Concluída  
**Estimativa:** 1.5 semanas  
**Tempo Real:** -

### ✅ Etapa 1.1: Setup do Projeto e Configurações Base

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ Projeto Next.js 16.1.6 criado com App Router
- ✅ TypeScript configurado com strict mode
- ✅ Prisma 7.3.0 instalado e configurado
- ✅ PostgreSQL 16 configurado via Docker (porta 5432)
- ✅ Variáveis de ambiente configuradas (.env.local, .env.example)
- ✅ Estrutura de pastas criada: `/app`, `/lib`, `/components`, `/services`, `/types`
- ✅ Tailwind CSS 4.0 configurado com design tokens
- ✅ Fonte Varela Round configurada via Google Fonts
- ✅ Variáveis CSS criadas (--color-primary, --color-secondary, --color-accent)
- ✅ Path aliases configurados no tsconfig

**Arquivos Criados:**

- `docker-compose.yml`
- `.env.local`, `.env.example`
- `lib/db/prisma.ts`
- `tailwind.config.ts`
- `app/globals.css`
- `app/layout.tsx`

---

### ✅ Etapa 1.2: Schema do Banco de Dados e Models Prisma

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ Enum `RoleType` criado (EMPLOYEE, THERAPIST, TENANT_ADMIN, SUPER_ADMIN)
- ✅ Enum `AppointmentStatus` criado (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)
- ✅ Enum `AuthMethod` criado (MAGIC_LINK, PASSWORD, SAML_SSO)
- ✅ Enum `AuthOutcome` criado (SUCCESS, FAILURE, EXPIRED_TOKEN, INVALID_CREDENTIALS)
- ✅ 13 Models criados:
  - Tenant
  - Location
  - Program
  - UserAccount
  - Role
  - UserRole
  - Employee
  - Therapist
  - TherapistAssignment
  - AvailabilitySlot
  - Appointment
  - MagicToken
  - AuthLog
- ✅ 68 índices criados para otimização de queries
- ✅ Migration inicial executada com sucesso
- ✅ Tipos TypeScript gerados via `prisma generate`

**Arquivos Criados:**

- `prisma/schema.prisma`
- `prisma/migrations/20260205_init/migration.sql`
- `types/index.ts`

---

### ✅ Etapa 1.3: Infraestrutura Multi-Tenancy

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ Utilitários de tenant criados:
  - `getTenantFromDomain()` - Identifica tenant por domínio
  - `getTenantById()` - Busca tenant por ID
  - `getAllActiveTenants()` - Lista tenants ativos
  - `validateEmailTenant()` - Valida email contra tenant
- ✅ Sistema de controle de acesso:
  - `withTenantScope()` - Wrapper para queries com tenant scope
  - `assertTenantAccess()` - Valida acesso do usuário ao tenant
  - `hasRoleInTenant()` - Verifica role do usuário em tenant
  - `isSuperAdmin()` - Verifica se usuário é super admin
  - `getUserTenants()` - Lista tenants do usuário
  - `logTenantAccessViolation()` - Registra violações
  - `TenantAccessError` - Classe de erro customizada
- ✅ Helpers para API:
  - `requireTenant()` - Middleware para validar tenant em APIs
  - `requireSuperAdmin()` - Middleware para validar super admin
  - `getTenantFromAuthEmail()` - Extrai tenant do email autenticado
- ✅ Middleware Next.js com security headers
- ✅ React Context para tenant state:
  - `TenantProvider` - Provider do contexto
  - `useTenant()` - Hook para acessar tenant
  - `useRequiredTenant()` - Hook que lança erro se tenant não existe
- ✅ Componente `TenantGuard`:
  - Versão component
  - HOC `withTenantGuard()`
- ✅ Documentação completa de uso

**Arquivos Criados:**

- `lib/utils/tenant.ts`
- `lib/utils/tenant-access.ts`
- `lib/utils/api-helpers.ts`
- `middleware.ts`
- `lib/contexts/TenantContext.tsx`
- `components/TenantGuard.tsx`
- `docs/MULTI_TENANCY_USAGE.md`

---

### ✅ Etapa 1.4: Componentes UI Base (Design System - Atoms)

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ Dependências instaladas:
  - `lucide-react` - Biblioteca de ícones
  - `clsx` - Utilitário para classes CSS
- ✅ 11 componentes atômicos criados:
  1. **Button** - Variants (primary, secondary, danger, ghost), sizes (sm, md, lg), loading state
  2. **Input** - Suporte para ícones esquerda/direita, error state
  3. **Select** - Placeholder, options array, error state
  4. **Checkbox** - Label, custom styling
  5. **Radio** - Label, custom styling
  6. **Switch** - Toggle com label
  7. **Badge** - Variants (success, warning, error, info)
  8. **Avatar** - Imagem com fallback para iniciais, sizes (sm, md, lg)
  9. **Spinner** - Loading indicator, sizes (sm, md, lg)
  10. **Icon** - Wrapper para Lucide icons
  11. **Text** - Typography polimórfico (h1-h6, p, span, label)
- ✅ Utilitário `cn()` criado para combinar classes CSS
- ✅ Arquivo de exportação centralizado (`components/ui/index.ts`)
- ✅ Página de showcase criada (`/components-showcase`)
- ✅ Documentação completa dos componentes

**Arquivos Criados:**

- `lib/utils/cn.ts`
- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `components/ui/Checkbox.tsx`
- `components/ui/Radio.tsx`
- `components/ui/Switch.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Avatar.tsx`
- `components/ui/Spinner.tsx`
- `components/ui/Icon.tsx`
- `components/ui/Text.tsx`
- `components/ui/index.ts`
- `app/components-showcase/page.tsx`
- `docs/UI_COMPONENTS.md`

---

### ✅ Etapa 1.5: Componentes UI Compostos (Molecules)

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ 12 componentes molecules criados:
  1. **FormField** - Wrapper para campos de formulário com label, error e help text
  2. **Card** - Container com variants (default, outlined, elevated), inclui CardHeader, CardTitle, CardDescription, CardContent, CardFooter
  3. **Modal** - Modal com overlay, tamanhos (sm, md, lg, full), controle via props
  4. **Dropdown** - Menu dropdown com keyboard navigation, ícones, dividers
  5. **DatePicker** - Seletor de data com calendário popup, navegação de meses, min/max date
  6. **TimePicker** - Seletor de horário com intervalo configurável
  7. **SearchBar** - Input de busca com ícone, botão clear, evento onSearch
  8. **Pagination** - Paginação com prev/next, números de página, info display
  9. **EmptyState** - Estado vazio com ícone, título, descrição, botão de ação
  10. **Toast** - Sistema de notificações com 4 variants, auto-dismiss, portal
  11. **Tabs** - Abas com variants (default, pills), controlled/uncontrolled
  12. **Alert** - Alertas com 4 variants, dismissible, ícones
- ✅ Hook `useToast()` para gerenciar notificações
- ✅ ToastContainer com portal do React
- ✅ Arquivo de exportação centralizado (`components/molecules/index.ts`)
- ✅ Página de showcase criada (`/molecules-showcase`)

**Arquivos Criados:**

- `components/molecules/FormField.tsx`
- `components/molecules/Card.tsx`
- `components/molecules/Modal.tsx`
- `components/molecules/Dropdown.tsx`
- `components/molecules/DatePicker.tsx`
- `components/molecules/TimePicker.tsx`
- `components/molecules/SearchBar.tsx`
- `components/molecules/Pagination.tsx`
- `components/molecules/EmptyState.tsx`
- `components/molecules/Toast.tsx`
- `components/molecules/Tabs.tsx`
- `components/molecules/Alert.tsx`
- `components/molecules/index.ts`
- `app/molecules-showcase/page.tsx`

---

### ✅ Etapa 1.6: Layouts e Estrutura de Navegação

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ **6 componentes de layout criados:**
  1. **AuthLayout** - Layout centralizado para login/signup sem navbar/sidebar
  2. **DashboardLayout** - Layout principal com navbar + sidebar + content
  3. **Navbar** - Barra superior com logo, user menu, notificações com badge
  4. **Sidebar** - Menu lateral colapsável com overlay em mobile
  5. **UserMenu** - Dropdown com avatar, perfil, configurações, ajuda, logout
  6. **Breadcrumb** - Navegação contextual com hook `useBreadcrumbs()`
- ✅ **Sistema de menus por role:**
  - EMPLOYEE: Home, Meus Agendamentos, Novo Agendamento, Perfil
  - THERAPIST: Home, Agenda, Atendimentos, Disponibilidade, Histórico, Perfil
  - TENANT_ADMIN: Dashboard, Agendamentos, Funcionários, Terapeutas, Locais, Programas, Relatórios, Configurações
  - SUPER_ADMIN: Dashboard, Empresas, Usuários, Terapeutas, Atribuições, Agendamentos, Relatórios, Logs, Configurações
- ✅ **3 páginas globais criadas:**
  1. `app/loading.tsx` - Loading global com Spinner
  2. `app/error.tsx` - Error boundary com retry e link para home
  3. `app/not-found.tsx` - Página 404 com EmptyState
- ✅ **3 páginas de exemplo:**
  1. `app/dashboard/page.tsx` - Dashboard com cards de métricas
  2. `app/login/page.tsx` - Login com AuthLayout
  3. `app/appointments/page.tsx` - Agendamentos com DashboardLayout
- ✅ Sidebar com highlight de item ativo na navegação
- ✅ Sidebar responsivo com collapse em mobile (< lg breakpoint)
- ✅ Sistema de notificações com badge animado no Navbar
- ✅ Arquivo de exportação centralizado (`components/layouts/index.ts`)
- ✅ Arquivo de configuração de menus (`lib/config/menu.ts`)
- ✅ Página de showcase criada (`/layouts-showcase`) com seletor de roles

**Arquivos Criados:**

- `components/layouts/AuthLayout.tsx`
- `components/layouts/DashboardLayout.tsx`
- `components/layouts/Navbar.tsx`
- `components/layouts/Sidebar.tsx`
- `components/layouts/UserMenu.tsx`
- `components/layouts/Breadcrumb.tsx`
- `components/layouts/index.ts`
- `lib/config/menu.ts`
- `app/loading.tsx`
- `app/error.tsx`
- `app/not-found.tsx`
- `app/dashboard/page.tsx`
- `app/login/page.tsx`
- `app/appointments/page.tsx`
- `app/layouts-showcase/page.tsx`

**Próximos Passos:**

- Etapa 1.7: Configuração de Ambiente e Variáveis

---

## PARTE 2: Autenticação e Controle de Acesso ✅

**Status:** Concluída  
**Estimativa:** 2 semanas  
**Tempo Real:** -

### ✅ Etapa 2.1: API de Login (Credenciais)

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ Schemas de validação Zod para todos os fluxos de auth
- ✅ Auth service completo com rate limiting (5 tentativas/min)
- ✅ Hash de senhas com bcryptjs (salt rounds = 12)
- ✅ Geração de tokens com nanoid (32 chars)
- ✅ NextAuth v4 configurado com Credentials Provider
- ✅ JWT callbacks com claims customizados (id, role, tenantId, tenantName)
- ✅ Session callbacks para expor dados do JWT
- ✅ Sessão com TTL de 30 minutos
- ✅ Página de login interativa com validação client-side
- ✅ SessionProvider configurado no root layout
- ✅ Tipo augmentation para NextAuth (Session, User, JWT)

**Arquivos Criados:**

- `lib/validations/auth.ts`
- `lib/validations/index.ts`
- `services/auth.ts`
- `types/next-auth.d.ts`
- `lib/auth/options.ts`
- `lib/auth/index.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `app/providers.tsx`

**Arquivos Modificados:**

- `app/login/page.tsx` (convertido para client component interativo)
- `app/layout.tsx` (adicionado Providers wrapper)

---

### ✅ Etapa 2.2: Magic Link - Solicitação

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ API POST `/api/auth/magic-link/request`
- ✅ Validação de domínio do email contra tenants ativos
- ✅ Geração de token com TTL de 15 minutos
- ✅ Rate limiting: máximo 3 reenvios a cada 15 minutos
- ✅ Envio de email simulado (console.log - TODO: integrar SMTP)
- ✅ Página de signup com formulário de email
- ✅ Estado "enviado" com countdown de 60 segundos
- ✅ Botão de reenvio com controle de timing

**Arquivos Criados:**

- `app/api/auth/magic-link/request/route.ts`
- `app/signup/page.tsx`

---

### ✅ Etapa 2.3: Magic Link - Verificação

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ API POST `/api/auth/magic-link/verify`
- ✅ Validação de token hash sem consumir (validação only)
- ✅ Verifica expiração (TTL) e status de uso
- ✅ Retorna tenantId e tenantName após validação
- ✅ Página de verificação com input de token
- ✅ Timer de 15 minutos com expiração visual
- ✅ Auto-verificação quando token presente na URL

**Arquivos Criados:**

- `app/api/auth/magic-link/verify/route.ts`
- `app/signup/verify/page.tsx`

---

### ✅ Etapa 2.4: Magic Link - Conclusão de Cadastro

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ API POST `/api/auth/complete-signup`
- ✅ Criação transacional de UserAccount + Employee + UserRole
- ✅ Consumo do magic token na conclusão
- ✅ Role padrão EMPLOYEE atribuída automaticamente
- ✅ Formulário completo de cadastro (nome, senha, confirmação, termos)
- ✅ Indicador de força de senha (Fraca/Razoável/Boa/Forte)
- ✅ Aceite obrigatório de termos de uso
- ✅ Redirect para `/login?signup=success` após cadastro

**Arquivos Criados:**

- `app/api/auth/complete-signup/route.ts`
- `app/signup/complete/page.tsx`

---

### ✅ Etapa 2.5: Recuperação de Senha

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ API POST `/api/auth/forgot-password` (sempre retorna sucesso por segurança)
- ✅ API POST `/api/auth/reset-password` com validação de token
- ✅ Token de reset com TTL de 1 hora
- ✅ Página de "esqueci senha" com formulário de email
- ✅ Página de reset com indicador de força de senha
- ✅ Registro de tentativas no AuthLog
- ✅ Envio de email simulado (console.log - TODO: integrar SMTP)

**Arquivos Criados:**

- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/forgot-password/page.tsx`
- `app/reset-password/page.tsx`

---

### ✅ Etapa 2.6: Sessão e Logout

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ API GET `/api/auth/me` retorna perfil completo do usuário
- ✅ Hook `useAuth()` com estado de sessão, logout, redirect por role
- ✅ Detecção de inatividade de 30 minutos (mousedown, keydown, scroll, touchstart)
- ✅ Logout automático por inatividade
- ✅ Helper `getRedirectByRole()` para redirecionamento pós-login
- ✅ Componente `AuthGuard` para proteção de rotas client-side
- ✅ Exibe Spinner durante carregamento de sessão
- ✅ Redirect para `/login` com `callbackUrl` quando não autenticado

**Arquivos Criados:**

- `app/api/auth/me/route.ts`
- `lib/hooks/useAuth.ts`
- `lib/hooks/index.ts`
- `components/AuthGuard.tsx`

---

### ✅ Etapa 2.7: RBAC Middleware

**Status:** Concluída  
**Data de Conclusão:** 5 de fevereiro de 2026

**Realizado:**

- ✅ Middleware server-side `requireAuth()` para API routes
- ✅ Middleware server-side `requireRole()` com array de roles permitidas
- ✅ Middleware server-side `requireTenantAccessMiddleware()` com validação via `assertTenantAccess`
- ✅ Middleware server-side `requireOwnership()` para verificar dono do recurso (admins bypass)
- ✅ Hook `usePermissions()` com mapeamento granular de permissões por role
- ✅ Permissões granulares: appointments:view-own, tenants:manage, users:manage, etc.
- ✅ Componente `RoleGuard` para renderização condicional por role
- ✅ Suporte a `renderFallback` mode no RoleGuard
- ✅ Middleware Next.js atualizado com:
  - Whitelist de rotas públicas (login, signup, forgot-password, etc.)
  - Mapa de roles por rota (superadmin, admin, therapist)
  - Verificação de JWT via `getToken()` do NextAuth
  - Redirect automático para `/login` ou `/dashboard`
- ✅ `requireTenant()` atualizado para usar sessão NextAuth (não mais headers)
- ✅ `requireSuperAdmin()` atualizado para usar sessão NextAuth
- ✅ `DashboardLayout` atualizado para usar role da sessão NextAuth

**Arquivos Criados:**

- `lib/auth/middleware.ts`
- `lib/hooks/usePermissions.ts`
- `components/RoleGuard.tsx`

**Arquivos Modificados:**

- `middleware.ts` (reescrito com proteção de rotas e RBAC)
- `lib/auth/index.ts` (adicionado exports de middleware)
- `lib/utils/api-helpers.ts` (requireTenant/requireSuperAdmin via sessão)
- `components/layouts/DashboardLayout.tsx` (integrado com useSession)

---

## PARTE 3: Gestão de Tenants e Locations ✅

**Status:** Concluída  
**Estimativa:** 1.5 semanas  
**Tempo Real:** -

### ✅ Etapa 3.1: API de Listagem e Detalhes de Tenants

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ Schemas de validação Zod para tenants e locations (lib/validations/tenant.ts)
- ✅ Tenant service completo com toda a lógica de negócio (services/tenant.ts)
- ✅ Classe de erro customizada `TenantServiceError` com códigos tipados
- ✅ API GET `/api/admin/tenants` — listagem paginada com filtros (search, status)
- ✅ API GET `/api/admin/tenants/[id]` — detalhes com estatísticas (utilization rate, contagens)
- ✅ API POST `/api/tenants/resolve-domain` — resolução pública de domínio para signup

**Arquivos Criados:**

- `lib/validations/tenant.ts`
- `services/tenant.ts`
- `app/api/admin/tenants/route.ts`
- `app/api/admin/tenants/[id]/route.ts`
- `app/api/tenants/resolve-domain/route.ts`

**Arquivos Modificados:**

- `lib/validations/index.ts` (adicionados exports de tenant)

---

### ✅ Etapa 3.2: Criação de Tenant (Wizard)

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ API POST `/api/admin/tenants` — criação atômica via $transaction (tenant + locations + admin user)
- ✅ Schema de validação `createTenantWizardSchema` com 3 seções (company, locations, admin)
- ✅ Hash de senha do admin com bcryptjs (salt rounds 12)
- ✅ Verificação de duplicidade de domínio e email
- ✅ Role TENANT_ADMIN atribuída automaticamente ao admin criado
- ✅ Página frontend `/superadmin/tenants/new` — wizard de 4 steps:
  1. Dados da Empresa (nome, domínio, logo)
  2. Localizações (dinâmico, add/remove)
  3. Administrador (nome, email, senha com indicador de força)
  4. Revisão (resumo completo em cards)
- ✅ Step indicator visual com ícones, estados e connecting lines
- ✅ Validação client-side por step antes de avançar

**Arquivos Criados:**

- `app/superadmin/tenants/new/page.tsx`

---

### ✅ Etapa 3.3: Edição e Toggle de Status de Tenant

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ API PATCH `/api/admin/tenants/[id]` — atualização de dados do tenant
- ✅ API PATCH `/api/admin/tenants/[id]/toggle-status` — ativar/desativar tenant
- ✅ Schema de validação `updateTenantSchema` (campos opcionais)
- ✅ Página frontend `/superadmin/tenants/[id]/edit` — formulário de edição
- ✅ Página frontend `/superadmin/tenants` — lista com toggle status e modal de confirmação
- ✅ Modal de toggle exibe impacto (número de funcionários afetados)

**Arquivos Criados:**

- `app/api/admin/tenants/[id]/toggle-status/route.ts`
- `app/superadmin/tenants/[id]/edit/page.tsx`
- `app/superadmin/tenants/page.tsx`

---

### ✅ Etapa 3.4: CRUD de Locations

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ API GET `/api/admin/tenants/[tenantId]/locations` — listagem por tenant
- ✅ API POST `/api/admin/tenants/[tenantId]/locations` — criação de localização
- ✅ API GET `/api/admin/locations/[id]` — detalhes com check de ownership
- ✅ API PATCH `/api/admin/locations/[id]` — atualização com check de ownership
- ✅ API DELETE `/api/admin/locations/[id]` — exclusão com verificação de agendamentos futuros
- ✅ Verificação de acesso: TENANT_ADMIN só acessa locations do próprio tenant
- ✅ Retorna 409 Conflict se location tem agendamentos futuros ativos
- ✅ Página frontend `/superadmin/tenants/[id]` — aba Localizações com CRUD completo via modais

**Arquivos Criados:**

- `app/api/admin/tenants/[tenantId]/locations/route.ts`
- `app/api/admin/locations/[id]/route.ts`
- `app/superadmin/tenants/[id]/page.tsx`

---

### ✅ Etapa 3.5: Tenant Admin Settings

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ API GET `/api/tenant-admin/settings` — busca configurações do tenant (TENANT_ADMIN)
- ✅ API PATCH `/api/tenant-admin/settings` — atualiza nome e logo do tenant (TENANT_ADMIN)
- ✅ Retorna dados completos: localizações, contagem de employees/programs/therapists
- ✅ Página frontend `/admin/settings` — painel de configurações com 3 abas:
  1. Dados da Empresa (nome, logo editáveis; domínio read-only)
  2. Localizações (lista read-only das sedes)
  3. Resumo (cards com métricas: funcionários, programas, terapeutas + status)
- ✅ Detecção de alterações com botão salvar condicional

**Arquivos Criados:**

- `app/api/tenant-admin/settings/route.ts`
- `app/admin/settings/page.tsx`

---

## PARTE 4: Gestão de Terapeutas ✅

**Status:** Concluída  
**Estimativa:** 1 semana

### ✅ Etapa 4.1: API de Listagem e Detalhes + Frontend de Listagem

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação Zod para listagem (paginação, filtros, ordenação)
- ✅ Schema de validação CPF com algoritmo de verificação de dígitos
- ✅ Service `listTherapists()` com busca por nome, email, CPF e filtro de status
- ✅ Service `getTherapistById()` com dados de assignments e estatísticas
- ✅ API GET `/api/admin/therapists` — listagem paginada (SUPER_ADMIN)
- ✅ API GET `/api/admin/therapists/[id]` — detalhes com stats (SUPER_ADMIN)
- ✅ Classe de erro `TherapistServiceError` com códigos tipados
- ✅ Página frontend `/superadmin/therapists` — listagem com tabela, busca, filtro de status, paginação
- ✅ Formatação de CPF (000.000.000-00) na exibição

**Arquivos Criados:**

- `lib/validations/therapist.ts`
- `services/therapist.ts`
- `app/api/admin/therapists/route.ts`
- `app/api/admin/therapists/[id]/route.ts`
- `app/superadmin/therapists/page.tsx`

---

### ✅ Etapa 4.2: API de Cadastro + Frontend de Criação

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação para criação (nome, email, CPF, specialties, password)
- ✅ Validação de senha: mínimo 8 caracteres, 1 número, 1 caractere especial
- ✅ Service `createTherapist()` — transação atômica: UserAccount + Therapist + UserRole (global)
- ✅ API POST `/api/admin/therapists` — criação (SUPER_ADMIN)
- ✅ Verificação de unicidade: email e CPF
- ✅ Hash de senha com bcryptjs (12 rounds)
- ✅ Página frontend `/superadmin/therapists/new` — formulário com:
  - Máscara de CPF (auto-formatação)
  - Indicador de força de senha (4 níveis)
  - Toggle de visibilidade de senha
  - Validação client-side antes do submit

**Arquivos Criados:**

- `app/superadmin/therapists/new/page.tsx`

---

### ✅ Etapa 4.3: API de Edição e Toggle Status + Frontend de Edição

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação para atualização (nome, specialties)
- ✅ Service `updateTherapist()` — atualiza nome e especialidades
- ✅ Service `toggleTherapistStatus()` — ativa/desativa terapeuta e cascateia para assignments
- ✅ API PATCH `/api/admin/therapists/[id]` — atualização (SUPER_ADMIN)
- ✅ API PATCH `/api/admin/therapists/[id]/toggle-status` — toggle (SUPER_ADMIN)
- ✅ Ao desativar: desativa UserAccount + todas TherapistAssignments
- ✅ Ao ativar: reativa apenas UserAccount (assignments devem ser reativados manualmente)
- ✅ Página frontend `/superadmin/therapists/[id]/edit` — formulário de edição
- ✅ Email e CPF exibidos como read-only (não editáveis)
- ✅ Detecção de alterações para habilitar/desabilitar botão salvar

**Arquivos Criados:**

- `app/api/admin/therapists/[id]/toggle-status/route.ts`
- `app/superadmin/therapists/[id]/edit/page.tsx`

---

### ✅ Etapa 4.4: CRUD de Vinculações (Assignments)

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação para criação de assignments (tenantId + locationIds[])
- ✅ Service `listAssignments()` — lista vinculações com dados do tenant e location
- ✅ Service `createAssignments()` — padrão upsert (reativa assignments inativos existentes)
- ✅ Service `removeAssignment()` — soft delete (marca como inativo)
- ✅ API GET `/api/admin/therapists/[id]/assignments` — listagem (SUPER_ADMIN)
- ✅ API POST `/api/admin/therapists/[id]/assignments` — criação batch (SUPER_ADMIN)
- ✅ API DELETE `/api/admin/therapists/[id]/assignments/[assignmentId]` — remoção (SUPER_ADMIN)
- ✅ Validação: verifica existência do tenant e das locations
- ✅ Validação: verifica que locations pertencem ao tenant informado
- ✅ Página frontend `/superadmin/therapists/[id]` — detalhes com 3 abas:
  1. **Visão Geral**: dados pessoais, conta, vinculações recentes, stats
  2. **Vinculações**: lista completa com add/remove modais
  3. **Editar**: formulário inline de edição rápida
- ✅ Modal de adição: seletor de tenant → checkboxes de locations (indicando já vinculados)
- ✅ Modal de remoção: confirmação com alerta
- ✅ Modal de toggle status: confirmação com alertas contextuais

**Arquivos Criados:**

- `app/api/admin/therapists/[id]/assignments/route.ts`
- `app/api/admin/therapists/[id]/assignments/[assignmentId]/route.ts`
- `app/superadmin/therapists/[id]/page.tsx`

---

### ✅ Etapa 4.5: Perfil Self-Service do Terapeuta

**Status:** Concluída  
**Data de Conclusão:** 6 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação para atualização de perfil (nome, specialties, password change)
- ✅ Service `getTherapistProfile()` — busca perfil do terapeuta logado com stats
- ✅ Service `updateTherapistProfile()` — atualiza nome, specialties e/ou senha
- ✅ Verificação de senha atual antes de permitir alteração
- ✅ API GET `/api/therapist/profile` — retorna perfil (THERAPIST)
- ✅ API PATCH `/api/therapist/profile` — atualiza perfil (THERAPIST)
- ✅ Página frontend `/therapist/profile` com 3 abas:
  1. **Dados Pessoais**: edição de nome e especialidades
  2. **Vinculações**: lista read-only das empresas/localizações
  3. **Segurança**: alteração de senha com verificação da atual + indicador de força
- ✅ Menu de navegação atualizado: "Meu Perfil" aponta para `/therapist/profile`
- ✅ Barrel exports atualizados em `lib/validations/index.ts`

**Arquivos Criados:**

- `app/api/therapist/profile/route.ts`
- `app/therapist/profile/page.tsx`

**Arquivos Modificados:**

- `lib/validations/index.ts` — adicionados exports de therapist
- `lib/config/menu.ts` — atualizado href do perfil do terapeuta

---

## PARTE 5: Programas e Disponibilidade ✅

**Status:** Concluída  
**Estimativa:** 2 semanas

### ✅ Etapa 5.1: CRUD de Programas (API + Validação)

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação Zod para programas (`createProgramSchema`, `updateProgramSchema`)
- ✅ Schema de validação para listagem com paginação, busca, filtros
- ✅ Serviço completo `ProgramService`:
  - `listPrograms()` — paginação, busca, filtros por status/tenant
  - `getProgramById()` — com estatísticas de agendamentos e slots
  - `createProgram()` — validação de tenant ativo
  - `updateProgram()` — validação de janela de tempo
  - `toggleProgramStatus()` — verifica agendamentos futuros antes de desativar
- ✅ Classe de erro `ProgramServiceError` com códigos tipados
- ✅ API routes:
  - `GET /api/admin/programs` — listar programas (SUPER_ADMIN)
  - `POST /api/admin/programs` — criar programa (SUPER_ADMIN)
  - `GET /api/admin/programs/[id]` — detalhes do programa
  - `PATCH /api/admin/programs/[id]` — atualizar programa
  - `PATCH /api/admin/programs/[id]/toggle-status` — ativar/desativar

**Arquivos Criados:**

- `lib/validations/program.ts`
- `services/program.ts`
- `app/api/admin/programs/route.ts`
- `app/api/admin/programs/[id]/route.ts`
- `app/api/admin/programs/[id]/toggle-status/route.ts`

**Arquivos Modificados:**

- `lib/validations/index.ts` — adicionados exports de program

---

### ✅ Etapa 5.2: Programas por Tenant

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Service function `listProgramsByTenant()` — lista programas de um tenant (com filtro activeOnly)
- ✅ API route `GET /api/admin/tenants/[tenantId]/programs` — SUPER_ADMIN e TENANT_ADMIN (somente próprio tenant)
- ✅ API route `POST /api/admin/tenants/[tenantId]/programs` — criar programa para tenant (SUPER_ADMIN)
- ✅ Decisão: Usa relação direta `Program.tenantId` já existente no schema (não necessário criar join table `TenantProgram`)

**Arquivos Criados:**

- `app/api/admin/tenants/[tenantId]/programs/route.ts`

---

### ✅ Etapa 5.3: Listagem de Slots de Disponibilidade

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação `listAvailabilitySlotsSchema` — filtros por data, programa, localização, terapeuta, onlyAvailable
- ✅ Service function `listAvailabilitySlots()` — query filtrada com includes de terapeuta/location/program
- ✅ Service function `listAvailableDates()` — agrupamento por data com capacidade/reservados (para calendário do employee)
- ✅ Service function `listSlotsForDate()` — slots agrupados por horário com detalhes de terapeuta
- ✅ API route `GET /api/availability` — listagem autenticada com tenant scope

**Arquivos Criados:**

- `app/api/availability/route.ts`

---

### ✅ Etapa 5.4: Geração Batch de Slots

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação `generateSlotsSchema` — programId, locationId, therapistIds[], startDate, endDate, weekdays[0-6]
- ✅ Validações refinadas: endDate >= startDate, startDate >= hoje, weekdays 0-6
- ✅ Service function `generateAvailabilitySlots()`:
  - Valida programa ativo
  - Valida localização pertence ao tenant do programa
  - Valida cada terapeuta (existe, ativo, vinculado ao tenant+location)
  - Gera datas no período para os dias da semana selecionados
  - Calcula slots com base na duração de sessão do programa e janela diária
  - Detecção de conflitos via Set (slotDate + startTime + therapistId)
  - `createMany` com `skipDuplicates`
- ✅ API route `POST /api/availability/generate` — SUPER_ADMIN e TENANT_ADMIN
- ✅ Frontend: Página de geração multi-step com preview

**Arquivos Criados:**

- `app/api/availability/generate/route.ts`
- `app/admin/availability/generate/page.tsx`

---

### ✅ Etapa 5.5: Disponibilidade Self-Service do Terapeuta

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Service function `listTherapistAvailability()` — slots do terapeuta com detalhes de appointments
- ✅ Service function `deleteTherapistSlots()` — remove slots sem agendamentos ativos
- ✅ API routes:
  - `GET /api/therapist/availability` — listar slots do terapeuta autenticado
  - `DELETE /api/therapist/availability` — remover slots por IDs (valida propriedade e ausência de appointments)
- ✅ Frontend: Página de disponibilidade do terapeuta com:
  - Visualização semanal em grid de 7 colunas
  - Navegação por semanas (prev/next) com "ir para semana atual"
  - Filtros por empresa e localização (derivados de assignments)
  - Seleção múltipla de slots para remoção em batch
  - Indicação visual de slots agendados vs livres
  - Destaque do dia atual

**Arquivos Criados:**

- `app/api/therapist/availability/route.ts`
- `app/therapist/availability/page.tsx`

---

### ✅ Etapa 5.6: Visão Geral de Disponibilidade (Tenant Admin)

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Schema de validação `availabilityOverviewSchema` — período, filtros por programa/localização
- ✅ Service function `getAvailabilityOverview()` — agregações por localização, programa, terapeuta e data com taxa de ocupação
- ✅ API route `GET /api/tenant-admin/availability/overview` — TENANT_ADMIN e SUPER_ADMIN
- ✅ Frontend: Dashboard de visão geral com:
  - 4 cards de resumo (total slots, reservados, disponíveis, taxa de ocupação)
  - Breakdown por localização com barras de progresso
  - Breakdown por programa com barras de progresso
  - Breakdown por terapeuta com barras de progresso
  - Heatmap de ocupação por data
  - Atalhos de período (7, 15, 30, 60, 90 dias)
  - Filtros por programa e localização
  - Semáforo de cores: verde (<50%), âmbar (50-80%), vermelho (>80%)

**Arquivos Criados:**

- `app/api/tenant-admin/availability/overview/route.ts`
- `app/admin/availability/page.tsx`

**Arquivos Modificados:**

- `lib/config/menu.ts` — adicionado "Programas" no menu SUPER_ADMIN e "Disponibilidade" no menu TENANT_ADMIN

---

## PARTE 6: Agendamentos (EMPLOYEE) ✅

**Status:** Concluída  
**Estimativa:** 2 semanas

### ✅ Etapa 6.1: Schemas de Validação para Agendamentos

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ 7 schemas Zod criados:
  1. `createAppointmentSchema` — programId, locationId, slotId, therapistId, date, startTime
  2. `listEmployeeAppointmentsSchema` — paginação, filtro por status, ordenação
  3. `cancelAppointmentSchema` — reason opcional
  4. `updateEmployeeProfileSchema` — name com min 2 chars
  5. `changePasswordSchema` — currentPassword, newPassword (min 8 chars)
  6. `availableDatesQuerySchema` — programId, locationId obrigatórios
  7. `availableSlotsQuerySchema` — programId, locationId, date obrigatórios
- ✅ Todos os tipos TypeScript exportados via `infer`
- ✅ Barrel export atualizado em `lib/validations/index.ts`

**Arquivos Criados:**

- `lib/validations/appointment.ts`

**Arquivos Modificados:**

- `lib/validations/index.ts`

---

### ✅ Etapa 6.2: Serviço de Agendamentos

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Classe de erro `AppointmentServiceError` com 10 códigos tipados:
  - NOT_FOUND, SLOT_NOT_FOUND, SLOT_FULL, ALREADY_BOOKED, PAST_DATE, CANCELLATION_DEADLINE, INVALID_STATUS, EMPLOYEE_NOT_FOUND, UNAUTHORIZED, VALIDATION_ERROR
- ✅ 10 funções de serviço:
  1. `getEmployeeDashboard()` — stats (total, completed, cancelled, attendance rate), próximo agendamento, lista de próximos
  2. `listAvailablePrograms()` — programas ativos do tenant com flag de disponibilidade
  3. `listAvailableLocations()` — locations do tenant com slots para o programa selecionado
  4. `createAppointment()` — criação atômica com `$transaction`, incremento de `reservedCount`, geração de código `MQV-YYYY-XXXXX` via nanoid
  5. `listEmployeeAppointments()` — paginação, filtro por status múltiplo, ordenação por data
  6. `getEmployeeAppointmentById()` — detalhes completos com joins (program, therapist, location)
  7. `cancelAppointment()` — validação de deadline (4h), decremento de `reservedCount`, registro de motivo
  8. `getEmployeeProfile()` — dados do usuário + stats
  9. `updateEmployeeProfile()` — atualiza nome
  10. `changeEmployeePassword()` — valida senha atual com bcrypt, hash da nova senha
- ✅ Validação de capacidade com optimistic locking: busca slot no `$transaction`, verifica `reservedCount < capacity`
- ✅ Verificação de 1 agendamento por dia por employee (regra de negócio)
- ✅ Deadline de cancelamento de 4 horas antes da sessão

**Arquivos Criados:**

- `services/appointment.ts`

---

### ✅ Etapa 6.3: API Routes do Employee

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ 9 API routes criados com `requireRole("EMPLOYEE")` ou `requireAuth()`:
  1. `GET /api/employee/dashboard` — dados do dashboard
  2. `GET /api/employee/programs/available` — programas disponíveis
  3. `GET /api/employee/locations?programId=X` — locations com disponibilidade
  4. `GET /api/employee/availability/dates?programId=X&locationId=Y` — datas com slots
  5. `GET /api/employee/availability/slots?programId=X&locationId=Y&date=Z` — slots horários
  6. `GET /api/employee/appointments` — listagem paginada
  7. `POST /api/employee/appointments` — criação de agendamento
  8. `GET /api/employee/appointments/[id]` — detalhes
  9. `DELETE /api/employee/appointments/[id]` — cancelamento
  10. `GET /api/employee/profile` — perfil
  11. `PATCH /api/employee/profile` — atualização de perfil
  12. `POST /api/employee/change-password` — troca de senha

**Arquivos Criados:**

- `app/api/employee/dashboard/route.ts`
- `app/api/employee/programs/available/route.ts`
- `app/api/employee/locations/route.ts`
- `app/api/employee/availability/dates/route.ts`
- `app/api/employee/availability/slots/route.ts`
- `app/api/employee/appointments/route.ts`
- `app/api/employee/appointments/[id]/route.ts`
- `app/api/employee/profile/route.ts`
- `app/api/employee/change-password/route.ts`

---

### ✅ Etapa 6.4: Dashboard do Employee

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página `/employee/dashboard` com:
  - Saudação personalizada por horário (Bom dia/Boa tarde/Boa noite)
  - 4 cards de estatísticas (Total, Realizados, Cancelados, Frequência %)
  - Card destaque do próximo agendamento com borda accent
  - Lista de próximos agendamentos (top 5)
  - Empty states com CTAs para novo agendamento
  - Loading e error states

**Arquivos Criados:**

- `app/employee/dashboard/page.tsx`

---

### ✅ Etapa 6.5: Wizard de Agendamento (4 Steps)

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página única `/appointments/new` com 4 steps internos:
  1. **Programa** — grid de cards com nome, duração, período, flag de disponibilidade, seleção visual
  2. **Data e Local** — seleção de localização + calendário interativo com:
     - Navegação de meses
     - Indicação visual de datas disponíveis (verde), selecionada (accent), indisponíveis (cinza)
     - Legenda de cores
  3. **Horário e Terapeuta** — slots de horário com terapeutas disponíveis, badge de vagas, indicação de lotado
  4. **Confirmação** — card de resumo completo com aviso de regra de cancelamento
- ✅ Step Indicator visual com ícones, cores e linhas de conexão
- ✅ Estado do wizard gerenciado internamente (sem URL params)
- ✅ Navegação back/forward com limpeza de seleções dependentes
- ✅ Redirect para `/appointments/[id]?created=true` após confirmação

**Arquivos Criados:**

- `app/appointments/new/page.tsx`

---

### ✅ Etapa 6.6: Lista de Agendamentos

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página `/appointments` com:
  - Tabs "Próximos" e "Histórico" com ícones
  - Cards de agendamento com: programa, código, data, horário, terapeuta, local, status badge
  - Paginação
  - Empty states diferenciados por tab
  - Botão "Novo Agendamento" no header
  - Link para detalhes ao clicar no card
- ✅ Substituiu a versão placeholder anterior

**Arquivos Modificados:**

- `app/appointments/page.tsx`

---

### ✅ Etapa 6.7: Detalhes e Cancelamento

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página `/appointments/[id]` com:
  - Card completo com todos os detalhes: código, programa, data, horário, terapeuta, local
  - Status badge com variant por status
  - Banner de sucesso quando `?created=true`
  - Informação de cancelamento (motivo, data) quando cancelado
  - Notas/observações quando existentes
  - Data de criação do agendamento
- ✅ Botão "Cancelar Agendamento" com validação de 4h
  - Modal de confirmação com campo de motivo opcional
  - Aviso quando fora do prazo de cancelamento
- ✅ Botão "Adicionar ao Calendário" — gera e baixa arquivo .ics
  - Formato ICS completo com DTSTART, DTEND, SUMMARY, LOCATION, DESCRIPTION

**Arquivos Criados:**

- `app/appointments/[id]/page.tsx`

---

### ✅ Etapa 6.8: Perfil do Colaborador

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página `/profile` com:
  - 4 cards de estatísticas (Total, Realizados, Cancelados, Frequência)
  - Formulário de dados pessoais (nome editável, email e empresa read-only)
  - Seção de segurança com botão para alterar senha
- ✅ Modal de alteração de senha:
  - Campos: senha atual, nova senha, confirmação
  - Toggle de visibilidade de senhas
  - Validação client-side (mínimo 8 chars, senhas coincidem)
  - Feedback de sucesso/erro
- ✅ Menu EMPLOYEE já configurado com rotas corretas: /dashboard, /appointments, /appointments/new, /profile

**Arquivos Criados:**

- `app/profile/page.tsx`

---

## PARTE 7: Experiência do Terapeuta ✅

**Status:** Concluída  
**Estimativa:** 1.5 semanas

### ✅ Etapa 7.1: Backend de Agenda do Terapeuta

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Schemas de validação Zod v4:
  - `listTherapistAppointmentsSchema` — filtros por view (day/week/month), date, tenantId, locationId, programId, status
  - `therapistDailySchema` — query para agenda diária
  - `checkInSchema` — status (COMPLETED/NO_SHOW) + notes
  - `therapistHistorySchema` — paginação, filtros, ordenação
- ✅ Service `therapist-appointments.ts` com 6 funções:
  - `listTherapistAppointments()` — lista agendamentos com summary stats
  - `getTherapistDailyAppointments()` — agenda do dia com próximo atendimento
  - `checkInAppointment()` — registra check-in com validação de timing
  - `getTherapistAppointmentById()` — detalhes com flags canCheckIn/canMarkNoShow
  - `getTherapistHistory()` — histórico paginado com stats e gráfico mensal
  - `getTherapistFilterOptions()` — opções de filtro (tenants/locations/programs)
- ✅ Classe `TherapistAppointmentError` com códigos: NOT_FOUND, THERAPIST_NOT_FOUND, UNAUTHORIZED, INVALID_STATUS, TOO_EARLY, ALREADY_CHECKED_IN, VALIDATION_ERROR
- ✅ Regras de check-in: COMPLETED liberado 5min antes do início; NO_SHOW liberado 15min após início
- ✅ Alerta de no-show frequente: log de aviso quando funcionário ≥ 3 ausências

**Arquivos Criados:**

- `lib/validations/therapist-appointments.ts`
- `services/therapist-appointments.ts`

---

### ✅ Etapa 7.2: API Routes do Terapeuta

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ 5 rotas de API com `requireRole(["THERAPIST"])`:
  - `GET /api/therapist/appointments` — lista agendamentos com filtros de calendário
  - `GET /api/therapist/appointments?filters=true` — retorna opções de filtro
  - `GET /api/therapist/appointments/[id]` — detalhes do agendamento
  - `PATCH /api/therapist/appointments/[id]/check-in` — registra check-in
  - `GET /api/therapist/daily` — agenda do dia com próximo atendimento
  - `GET /api/therapist/history` — histórico paginado com estatísticas

**Arquivos Criados:**

- `app/api/therapist/appointments/route.ts`
- `app/api/therapist/appointments/[id]/route.ts`
- `app/api/therapist/appointments/[id]/check-in/route.ts`
- `app/api/therapist/daily/route.ts`
- `app/api/therapist/history/route.ts`

---

### ✅ Etapa 7.3: Calendário e Visão Semanal/Mensal

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página `/therapist/calendar` com 3 visualizações:
  - **MonthView** — grade mensal com dots coloridos por status
  - **WeekView** — linhas horizontais por dia com cards de agendamento
  - **DayView** — cards detalhados com info completa
- ✅ Navegação de data (anterior/próximo/hoje)
- ✅ Painel de filtros (empresa, local, status)
- ✅ Sidebar com summary stats (total, confirmados, pendentes, concluídos, ausências)
- ✅ Toggle de view (Dia/Semana/Mês)
- ✅ Click para navegar ao detalhe do agendamento

**Arquivos Criados:**

- `app/therapist/calendar/page.tsx`

---

### ✅ Etapa 7.4: Agenda Diária e Check-in

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página `/therapist/daily` — visão de timeline do dia:
  - Navegação de data com botão "Hoje"
  - 4 cards de resumo (total, pendentes, concluídos, ausências)
  - Destaque para próximo atendimento com contagem regressiva
  - Timeline vertical com dots coloridos por status
  - Botões inline de check-in (Marcar Presente / Marcar Ausência)
- ✅ Modal de check-in com campo de observações
- ✅ Validação de timing: botão "Presente" habilitado 5min antes; "Ausência" habilitado 15min após
- ✅ Página `/therapist/appointments/[id]` — detalhe com check-in:
  - Grid de 4 cards: Info do Agendamento, Info do Funcionário, Histórico do Funcionário, Timeline de Status
  - Alerta de no-show frequente (≥3 ausências)
  - Stats do funcionário (sessões anteriores, total de ausências)
  - Botões de ação (Marcar Presente / Marcar Ausência)
  - Modal de confirmação com campo de notas

**Arquivos Criados:**

- `app/therapist/daily/page.tsx`
- `app/therapist/appointments/[id]/page.tsx`

---

### ✅ Etapa 7.5: Histórico de Atendimentos

**Status:** Concluída  
**Data de Conclusão:** 7 de fevereiro de 2026

**Realizado:**

- ✅ Página `/therapist/history` com:
  - 4 cards de estatísticas: Concluídos, Ausências, Cancelados, Taxa de Presença
  - Gráfico de barras de atendimentos por mês (últimos 6 meses)
  - Painel de filtros: empresa, local, status, data início, data fim
  - Tabela paginada com código, data/horário, funcionário, empresa, local, programa, status
  - Paginação com indicador de registros
  - Botão "Ver" para navegar ao detalhe do agendamento
- ✅ Exportação CSV com codificação UTF-8 (BOM) e separador ponto-e-vírgula
- ✅ Menu THERAPIST atualizado: Calendário, Agenda do Dia, Disponibilidade, Histórico, Meu Perfil

**Arquivos Criados:**

- `app/therapist/history/page.tsx`

**Arquivos Modificados:**

- `lib/config/menu.ts` — atualizado menu THERAPIST com novas rotas

---

## PARTE 8: Dashboards Administrativos ✅

**Status:** Concluída  
**Estimativa:** 2 semanas

### ✅ Etapa 8.1: Dashboard do Tenant Admin

**Status:** Concluída  
**Data de Conclusão:** 8 de fevereiro de 2026

**Realizado:**

- ✅ Service `AdminDashboardService` com funções para todos os dashboards
- ✅ `getTenantAdminDashboard(tenantId)` — KPIs, timeline 6 meses, por programa, por local, top users, atividade recente
- ✅ API Route GET `/api/tenant-admin/dashboard` com `requireRole(["TENANT_ADMIN"])`
- ✅ Página `/admin/dashboard` com:
  - 6 cards KPI (Total, Concluídos, Cancelados, Ausências, Taxa, Funcionários Ativos)
  - Gráfico de barras horizontal — Timeline 6 meses
  - Gráfico horizontal — Atendimentos por Programa
  - Gráfico horizontal — Atendimentos por Local
  - Top 5 usuários mais ativos
  - Feed de atividade recente (5 últimos agendamentos)
  - Quick navigation cards

**Arquivos Criados:**

- `services/admin-dashboard.ts`
- `app/api/tenant-admin/dashboard/route.ts`
- `app/admin/dashboard/page.tsx`

---

### ✅ Etapa 8.2: Gestão de Funcionários (Admin)

**Status:** Concluída  
**Data de Conclusão:** 8 de fevereiro de 2026

**Realizado:**

- ✅ `listTenantEmployees(tenantId, query)` — lista paginada com stats (completed, noShows)
- ✅ `toggleEmployeeStatus(employeeId, tenantId)` — ativa/desativa employee + user em transação
- ✅ `resetEmployeePassword(employeeId, tenantId)` — reset de senha (simulado)
- ✅ API Routes:
  - GET `/api/tenant-admin/employees` — listagem com filtros e paginação
  - PATCH `/api/tenant-admin/employees/[id]/toggle-status` — toggle status
  - POST `/api/tenant-admin/employees/[id]/reset-password` — reset senha
- ✅ Página `/admin/employees` com:
  - SearchBar + filtro de status (Ativo/Inativo/Todos)
  - Tabela com nome, email, status, agendamentos, concluídos, ausências, último acesso
  - Botão toggle ativar/desativar com modal de confirmação
  - Botão reset senha com modal de confirmação
  - Paginação com indicador de registros
  - Exportação CSV com BOM UTF-8

**Arquivos Criados:**

- `app/api/tenant-admin/employees/route.ts`
- `app/api/tenant-admin/employees/[id]/toggle-status/route.ts`
- `app/api/tenant-admin/employees/[id]/reset-password/route.ts`
- `app/admin/employees/page.tsx`

---

### ✅ Etapa 8.3: Relatórios Mensais

**Status:** Concluída  
**Data de Conclusão:** 8 de fevereiro de 2026

**Realizado:**

- ✅ `getTenantMonthlyReport(tenantId, month)` — relatório mensal com breakdown diário, por programa e por local
- ✅ API Route GET `/api/tenant-admin/reports/monthly?month=YYYY-MM`
- ✅ Página `/admin/reports` com:
  - Navegação de meses (anterior/próximo)
  - 4 cards resumo (Total, Concluídos, Ausências, Taxa Conclusão)
  - Cards de participantes únicos (Funcionários Atendidos, Terapeutas Atuantes)
  - Gráfico de barras empilhadas — atendimentos diários (concluídos, cancelados, ausências, agendados)
  - Legenda de cores
  - Progress bars por programa
  - Progress bars por local
  - Exportação CSV

**Arquivos Criados:**

- `app/api/tenant-admin/reports/monthly/route.ts`
- `app/admin/reports/page.tsx`

---

### ✅ Etapa 8.4: Dashboard do Super Admin

**Status:** Concluída  
**Data de Conclusão:** 8 de fevereiro de 2026

**Realizado:**

- ✅ `getSuperAdminDashboard()` — KPIs globais, por tenant, timeline, user growth, recent tenants, alerts
- ✅ API Route GET `/api/admin/dashboard` com `requireRole(["SUPER_ADMIN"])`
- ✅ Página `/superadmin/dashboard` com:
  - 6 KPI cards (Empresas Ativas, Funcionários, Terapeutas, Agendamentos, Concluídos, Taxa Global)
  - Alertas do sistema
  - Timeline de atendimentos 6 meses
  - Gráfico de crescimento de usuários
  - Comparativo por empresa (barras horizontais)
  - Empresas recentes com plano e contagem
  - Quick navigation cards

**Arquivos Criados:**

- `app/api/admin/dashboard/route.ts`
- `app/superadmin/dashboard/page.tsx`

---

### ✅ Etapa 8.5: Logs de Acesso e Auditoria

**Status:** Concluída  
**Data de Conclusão:** 8 de fevereiro de 2026

**Realizado:**

- ✅ `listAuthLogs(query)` — logs paginados com filtros (method, outcome, userId, período)
- ✅ API Route GET `/api/admin/logs` com `requireRole(["SUPER_ADMIN"])`
- ✅ Página `/superadmin/logs` com:
  - Filtros: Método (Credenciais, Magic Link, Google, Reset Senha), Resultado (Sucesso, Falha, Bloqueado), Data Início, Data Fim
  - Tabela com data/hora, usuário, método, resultado, IP
  - Linhas expandíveis com detalhes (ID, papel, motivo)
  - Paginação com indicador
  - Exportação CSV
  - Botão limpar filtros

**Arquivos Criados:**

- `app/api/admin/logs/route.ts`
- `app/superadmin/logs/page.tsx`

---

### ✅ Etapa 8.6: Configurações Globais

**Status:** Concluída  
**Data de Conclusão:** 8 de fevereiro de 2026

**Realizado:**

- ✅ API Route GET/PATCH `/api/admin/settings` com `requireRole(["SUPER_ADMIN"])`
- ✅ GET retorna configurações padrão (TODO: persistir no banco)
- ✅ PATCH aceita body e loga (TODO: persistir no banco)
- ✅ Página `/superadmin/settings` com:
  - 4 tabs: Políticas, Segurança, Email, Rate Limits
  - Tab Políticas: max agend/dia, max cancel/mês, antecedência, permite fds, requer aprovação
  - Tab Segurança: timeout sessão, min senha, bloquear após falhas, MFA, magic link
  - Tab Email: SMTP host/port/user, nome/email remetente, habilitar notificações
  - Tab Rate Limits: login/min, api/min, reset/hora
  - Detecção de alterações com indicador visual
  - Botão desfazer e salvar

**Arquivos Criados:**

- `app/api/admin/settings/route.ts`
- `app/superadmin/settings/page.tsx`

---

## PARTE 9: Refinamento e Deploy

**Status:** Não iniciada  
**Estimativa:** 1 semana

---

## Observações Técnicas

### Decisões Arquiteturais

1. **Tailwind CSS v4.0**: Adotada a nova sintaxe `text-(--var)` para variáveis CSS
2. **Prisma 7**: Necessário executar migrations manualmente via Docker devido a limitações de conexão
3. **TypeScript Strict Mode**: Todas as verificações estritas habilitadas
4. **Multi-Tenancy**: Implementado via utilities e React Context antes da autenticação
5. **Terapeutas Globais**: Terapeutas são entidades globais (UserRole sem tenantId); vinculações (assignments) os conectam a tenants/locations específicos
6. **Upsert em Assignments**: Ao criar vinculação para par terapeuta+location já existente (inativo), reativa ao invés de criar duplicata
7. **Cascade de Desativação**: Desativar terapeuta cascateia para UserAccount + todas TherapistAssignments; ativar reativa apenas UserAccount
8. **CPF com Algoritmo**: Validação de CPF inclui verificação completa dos dígitos verificadores, não apenas formato
9. **Program.tenantId Direto**: Schema já possui relação direta `Program.tenantId` → não é necessário join table `TenantProgram` como sugerido no plano
10. **Geração Batch de Slots**: Usa `createMany` com `skipDuplicates` + detecção de conflitos via Set para evitar duplicatas no mesmo lote
11. **Código de Agendamento**: Formato `MQV-YYYY-XXXXX` usando nanoid para parte aleatória — único e amigável
12. **Wizard de Agendamento**: Implementado como single page com state interno ao invés de rotas separadas — melhor UX e gestão de estado
13. **Optimistic Locking**: Criação de agendamento usa `$transaction` do Prisma com verificação de `reservedCount < capacity` dentro da transação para evitar race conditions
14. **Regra de 1 por Dia**: Employee pode ter no máximo 1 agendamento CONFIRMED por dia — validado no service
15. **Cancelamento com Deadline**: 4 horas de antecedência — decrementa `reservedCount` do slot ao cancelar
16. **Download ICS**: Geração client-side de arquivo .ics para integração com calendários (Google, Apple, Outlook)

### Desafios Encontrados

1. **Prisma 7 Connection**: Resolvido usando `127.0.0.1` ao invés de `localhost`
2. **Tailwind CSS 4 @import**: Ordem de imports crítica (antes de @theme)
3. **Enum Naming**: Conflito entre `UserRole` enum e model, renomeado para `RoleType`
4. **FormField Discriminated Union**: Componente FormField usa union discriminada por `type` — não aceita children; requer `inputProps`/`selectProps` etc.
5. **Next.js 16 Route Params**: Tipo `params` em route handlers espera `Promise<{...}>` mas middleware de auth usa `Record<string, string>` — erro de tipo pré-existente em todos os routes

### Próximas Etapas Sugeridas

1. **Parte 9**: Refinamento e Deploy — testes finais, otimizações e documentação de deploy

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Prisma
npx prisma studio
npx prisma migrate dev
npx prisma generate

# Docker
docker-compose up -d
docker-compose down

# TypeScript
npx tsc --noEmit

# Showcase de componentes
http://localhost:3000/components-showcase
http://localhost:3000/molecules-showcase
```
