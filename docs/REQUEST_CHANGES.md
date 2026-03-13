# Plano de Implementação — Mudanças Solicitadas (Request Changes)

> **Versão:** 1.0.0
> **Data:** 17 de fevereiro de 2026
> **Status:** Planejado
> **Base:** Documento `Maratona Wellness Hub.md` — Pontos de melhoria

---

## Visão Geral

Este documento detalha o plano de implementação das mudanças solicitadas no documento de pontos de melhoria do **Maratona QV Wellness Hub**. São correções de bugs visuais, funcionais, remoção de elementos desnecessários, reestruturação de dashboards e melhorias de UX.

### Escopo Total

- **6 PARTES** organizadas por contexto de impacto
- **23 ETAPAS** incrementais e funcionais
- **Stack**: Next.js 16+ (App Router), Prisma, PostgreSQL, Tailwind CSS
- **Estimativa total**: 3-4 semanas de desenvolvimento

### Perfis de Usuário Impactados

| Perfil           | Descrição                                     |
| ---------------- | --------------------------------------------- |
| **EMPLOYEE**     | Funcionário de empresa cliente (agendamentos) |
| **TENANT_ADMIN** | Administrador de empresa cliente (gestão)     |
| **THERAPIST**    | Terapeuta credenciado (agenda e atendimentos) |
| **SUPER_ADMIN**  | Administrador da Maratona (gestão global)     |

---

## Mapa de Dependências

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ORDEM DE IMPLEMENTAÇÃO (CHANGES)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PARTE 1: Correções Gerais de UI/UX    ──┐                                  │
│  (Sidebar, Navbar, Scroll, Logo,          │                                  │
│   Select, Tabela, Botão Sair)             │                                  │
│                                           ▼                                  │
│  PARTE 2: Correções de Autenticação   ──┐                                  │
│  (Verificação de conta, Reset Pass,       │                                  │
│   Termos de uso)                          │                                  │
│                                           ▼                                  │
│  PARTE 3: Correções do Employee        ──┐                                  │
│  (Home, Perfil, Sidebar focus)            │                                  │
│                                           ▼                                  │
│  PARTE 4: Correções do Therapist       ──┐                                  │
│  (Disponibilidade, Home, Calendário,      │                                  │
│   Histórico responsivo)                   │                                  │
│                                           ▼                                  │
│  PARTE 5: Correções do Super Admin     ──┐                                  │
│  (Programas globais, Capacidade,          │                                  │
│   Logs, Admins tenant, Logo tenant)       │                                  │
│                                           ▼                                  │
│  PARTE 6: Dashboards                                                        │
│  (Super Admin, Tenant Admin)                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PARTE 1: Correções Gerais de UI/UX

**Objetivo**: Corrigir problemas visuais e estruturais que afetam todos os perfis de usuário — sidebar, navbar, scroll, logo, inputs select, componente de tabela e botão de logout.

**Perfis impactados**: Todos
**Dependências**: Nenhuma (primeira parte)
**Estimativa**: 1 semana

---

### Etapa 1.1: Limpeza da Sidebar — Remover Itens Inválidos

**Descrição**: Remover itens do menu lateral que referenciam páginas não existentes. Auditar `lib/config/menu.ts` para cada role e validar que todos os `href` apontam para páginas implementadas.

**Frontend**:

- [ ] Auditar itens do menu EMPLOYEE — remover referências a páginas inexistentes
- [ ] Auditar itens do menu THERAPIST — remover referências a páginas inexistentes
- [ ] Auditar itens do menu TENANT_ADMIN — remover referências a páginas inexistentes (ex: `/admin/appointments`, `/admin/programs`)
- [ ] Auditar itens do menu SUPER_ADMIN — remover referências a páginas inexistentes (ex: `/superadmin/users`, `/superadmin/appointments`, `/superadmin/reports`)
- [ ] Validar que todas as rotas restantes possuem página correspondente em `/app`

**Critérios de Aceitação**:

- Nenhum item do menu lateral aponta para página 404
- Sidebar exibe apenas itens com páginas funcionais
- Menu mantém hierarquia lógica para cada role

**Dependências**: Nenhuma

---

### Etapa 1.2: Substituição da Logo — Usar Imagem Oficial

**Descrição**: Substituir o ícone de logo manual (div com "W") pela imagem `logo.png` localizada em `/assets`. Manter o texto "Wellness Hub" ao lado e o link para `/dashboard`.

**Frontend**:

- [ ] Copiar `logo.png` de `/assets` para `/public` (ou usar import direto)
- [ ] Alterar componente `Navbar.tsx` — substituir div de logo por `<Image>` do Next.js usando `logo.png`
- [ ] Manter texto "Wellness Hub" ao lado da imagem
- [ ] Manter link `<a>` ou `<Link>` apontando para `/dashboard`
- [ ] Ajustar tamanho da imagem para caber no navbar (h-8, w-auto ou similar)
- [ ] Garantir que a logo é exibida corretamente em mobile e desktop

**Critérios de Aceitação**:

- Logo exibe a imagem `logo.png` ao invés do ícone "W"
- Texto "Wellness Hub" permanece visível ao lado (hidden em mobile se necessário)
- Click na logo redireciona para `/dashboard`
- Imagem é otimizada pelo Next.js `<Image>`

**Dependências**: Nenhuma

---

### Etapa 1.3: Remover Elementos de Notificação e User Menu do Header

**Descrição**: Remover o bloco HTML de notificações (sino) e o user menu (avatar + nome + email) do header para todos os perfis. Esses elementos existem no `Navbar.tsx` e devem ser completamente removidos.

**Frontend**:

- [ ] Identificar e remover o botão de notificações (sino com badge) do `Navbar.tsx`
- [ ] Identificar e remover o bloco de avatar + nome + email do `Navbar.tsx`
- [ ] Remover componente `UserMenu.tsx` se for exclusivo desse bloco
- [ ] Ajustar layout do Navbar para não deixar espaço vazio
- [ ] Validar que a remoção não quebra nenhum perfil

**Critérios de Aceitação**:

- Nenhum botão de notificação visível no header
- Nenhum avatar/nome/email visível no header
- Layout do header permanece equilibrado
- Funciona para todos os perfis (EMPLOYEE, THERAPIST, TENANT_ADMIN, SUPER_ADMIN)

**Dependências**: Nenhuma

---

### Etapa 1.4: Botão de Sair na Sidebar com Modal de Confirmação

**Descrição**: Adicionar um botão "Sair" logo abaixo do item "Configurações" na sidebar para todos os perfis. Ao clicar, deve exibir um modal de confirmação. Ao confirmar, desconectar o usuário, remover sessão e redirecionar para `/login`.

**Frontend**:

- [ ] Adicionar item "Sair" no final da sidebar (abaixo de "Configurações") com ícone `LogOut` do Lucide
- [ ] Criar modal de confirmação usando componente `Modal` existente
- [ ] Texto do modal: "Tem certeza que deseja sair?" com botões "Cancelar" e "Sair"
- [ ] Ao confirmar: chamar `signOut()` do NextAuth com `{ callbackUrl: '/login' }`
- [ ] Limpar cookies de sessão
- [ ] Estilizar o botão "Sair" diferenciado dos demais itens (cor vermelha ou destaque)

**Critérios de Aceitação**:

- Botão "Sair" aparece abaixo de "Configurações" para todos os perfis
- Modal de confirmação é exibido ao clicar
- "Cancelar" fecha o modal sem ação
- "Sair" desconecta, limpa sessão e redireciona para `/login`
- Sessão é completamente invalidada

**Dependências**: Nenhuma

---

### Etapa 1.5: Correção dos Inputs Select — Texto Visível

**Descrição**: Os componentes `Select` estão com texto truncado ou oculto devido a tamanho fixo interno. Corrigir para que o texto das opções seja totalmente visível.

**Frontend**:

- [ ] Analisar componente `components/ui/Select.tsx`
- [ ] Remover ou ajustar height/width fixo que limita a visibilidade do texto
- [ ] Garantir que o texto do option selecionado seja visível por completo
- [ ] Garantir que o dropdown de opções exibe texto completo
- [ ] Testar em todos os selects existentes da aplicação (formulários de criação, filtros, etc.)

**Critérios de Aceitação**:

- Texto da opção selecionada é totalmente visível no select
- Dropdown de opções exibe texto completo
- Select se ajusta ao conteúdo ou tem width adequado
- Funciona em todos os contextos onde Select é utilizado

**Dependências**: Nenhuma

---

### Etapa 1.6: Componente de Tabela Padrão Reutilizável

**Descrição**: Criar um componente `DataTable` genérico e reutilizável que será o padrão para todas as telas de listagem. Deve aceitar colunas e itens customizáveis, com suporte a ordenação, busca e ações por linha.

**Frontend**:

- [ ] Criar componente `components/molecules/DataTable.tsx`
- [ ] Props: `columns[]` (header, accessor, render, sortable), `data[]`, `loading`, `emptyMessage`
- [ ] Suporte a renderização customizada de células via `render` function
- [ ] Suporte a ordenação por coluna (click no header)
- [ ] Suporte a ações por linha (via coluna de ações)
- [ ] Suporte a loading state (skeleton rows)
- [ ] Suporte a empty state usando componente `EmptyState`
- [ ] Integração com componente `Pagination` existente
- [ ] Integração com componente `SearchBar` existente (opcional via prop)
- [ ] Responsividade: scroll horizontal em telas pequenas
- [ ] Exportar do barrel `components/molecules/index.ts`

**Critérios de Aceitação**:

- DataTable é genérico e aceita qualquer tipo de dados
- Colunas são configuráveis (label, accessor, render customizado)
- Ordenação funciona (ascendente/descendente)
- Loading e empty states funcionam
- Componente é responsivo
- Está exportado e disponível para uso

**Dependências**: Nenhuma

---

### Etapa 1.7: Correção do Scroll — Sidebar e Header Fixos

**Descrição**: Atualmente, ao fazer scroll da página, a sidebar sobrepõe o header. Ambos (sidebar e header) devem ser fixos em suas posições, e apenas o conteúdo principal deve scrollar.

**Frontend**:

- [ ] Analisar `components/layouts/DashboardLayout.tsx` para entender o layout atual
- [ ] Fixar o `Navbar` no topo com `position: fixed` ou `sticky` e `z-index` adequado
- [ ] Fixar a `Sidebar` na lateral com `position: fixed` ou `sticky` e `z-index` adequado (menor que o Navbar)
- [ ] Ajustar o container de conteúdo principal para ter `margin-top` e `margin-left` compensando os fixos
- [ ] Garantir que a sidebar não sobrepõe o header em nenhum cenário de scroll
- [ ] Testar em diferentes tamanhos de tela (mobile, tablet, desktop)
- [ ] Garantir que o overlay da sidebar em mobile continua funcionando

**Critérios de Aceitação**:

- Header permanece fixo no topo durante scroll
- Sidebar permanece fixa na lateral durante scroll
- Sidebar não sobrepõe o header
- Conteúdo principal scrolla independentemente
- Layout funciona em todos os breakpoints
- Overlay mobile da sidebar continua funcional

**Dependências**: Nenhuma

---

## PARTE 2: Correções de Autenticação e Cadastro

**Objetivo**: Corrigir fluxos de autenticação — verificação de conta existente antes de enviar email, validação no reset de senha, e ajustes no checkbox de termos de uso.

**Perfis impactados**: EMPLOYEE (cadastro), Todos (reset de senha)
**Dependências**: PARTE 1
**Estimativa**: 0.5 semana

---

### Etapa 2.1: Validação de Conta Existente no Envio de Email

**Descrição**: Antes de disparar email de verificação, o sistema deve verificar se a conta do usuário já existe. Comportamento diferenciado por fluxo:

- **Cadastro (signup)**: Se já existe conta com o email → retornar erro "Já existe uma conta com esse email."
- **Reset de senha**: Se conta está inativa → retornar erro "Entre em contato com o RH."

**Backend**:

- [ ] Alterar `POST /api/auth/magic-link/request` — verificar se já existe `UserAccount` com o email antes de gerar token
  - Se existe: retornar 409 com mensagem "Já existe uma conta cadastrada com esse email. Faça login."
- [ ] Alterar `POST /api/auth/forgot-password` — verificar se a conta está ativa antes de gerar token de reset
  - Se conta existe mas está inativa: retornar 403 com mensagem "Sua conta está inativa. Entre em contato com o RH da sua empresa."
  - Se conta não existe: continuar retornando sucesso genérico (segurança)

**Frontend**:

- [ ] Atualizar página `/signup` para exibir mensagem de erro "Já existe uma conta com esse email" com link para login
- [ ] Atualizar página `/forgot-password` para exibir mensagem de erro "Conta inativa — entre em contato com o RH"

**Critérios de Aceitação**:

- No signup, email já cadastrado retorna erro claro com link para login
- No reset de senha, conta inativa retorna mensagem orientando contato com RH
- No reset de senha, conta inexistente continua retornando sucesso genérico (não revela existência)
- Fluxo normal (conta não existente no signup, conta ativa no reset) funciona normalmente

**Dependências**: Nenhuma

---

### Etapa 2.2: Correção do Checkbox de Termos de Uso

**Descrição**: O checkbox de aceite de termos de uso no cadastro de EMPLOYEE possui dois problemas: (1) não referencia um link para acessar os termos e (2) não permite marcar clicando diretamente no quadrado.

**Frontend**:

- [ ] Adicionar arquivo `termos-de-uso.pdf` em `/public/assets/` (placeholder se necessário)
- [ ] Alterar texto do checkbox para incluir link: "Li e aceito os [Termos de Uso](link para download do PDF)"
- [ ] Link deve abrir/baixar o PDF `termos-de-uso.pdf`
- [ ] Corrigir componente `Checkbox` ou seu uso em `/signup/complete` para que o clique no quadrado funcione
- [ ] Analisar se o `htmlFor` do label está corretamente vinculado ao `id` do input checkbox
- [ ] Garantir que o click em qualquer parte (quadrado ou texto) marca/desmarca o checkbox

**Critérios de Aceitação**:

- Texto dos termos contém link clicável que baixa/abre o PDF
- Click no quadrado do checkbox marca/desmarca corretamente
- Click no texto do checkbox marca/desmarca corretamente
- PDF de termos é acessível via link

**Dependências**: Nenhuma

---

## PARTE 3: Correções do Employee

**Objetivo**: Corrigir problemas específicos da experiência do funcionário — remoção da home desnecessária, correção do perfil e fix do foco da sidebar.

**Perfis impactados**: EMPLOYEE
**Dependências**: PARTE 1
**Estimativa**: 0.5 semana

---

### Etapa 3.1: Remover Home do Employee e Tornar Agendamentos a Página Inicial

**Descrição**: A home atual (`/dashboard`) não tem informação pertinente para o EMPLOYEE. Deve ser removida/redirecionada, e a tela "Meus Agendamentos" (`/appointments`) deve ser a página inicial do funcionário.

**Frontend**:

- [ ] Alterar `lib/hooks/useAuth.ts` — função `getRedirectByRole()` para que EMPLOYEE redirecione para `/appointments` ao invés de `/dashboard`
- [ ] Alterar `middleware.ts` — redirecionamento pós-login de EMPLOYEE para `/appointments`
- [ ] Remover item "Home" do menu EMPLOYEE em `lib/config/menu.ts`
- [ ] Garantir que "Meus Agendamentos" seja o primeiro item do menu e fique ativo ao acessar

**Critérios de Aceitação**:

- Login como EMPLOYEE redireciona para `/appointments`
- Menu EMPLOYEE não tem item "Home"
- "Meus Agendamentos" é o primeiro item e fica destacado
- Acesso a `/dashboard` como EMPLOYEE redireciona para `/appointments`

**Dependências**: Etapa 1.1

---

### Etapa 3.2: Correção do Perfil do Employee

**Descrição**: Remover os 4 "big numbers" informativos da tela de Meu Perfil e corrigir os campos "email" e "empresa" que exibem valores vazios.

**Frontend**:

- [ ] Remover os 4 cards de estatísticas (Total, Realizados, Cancelados, Frequência) da página `/profile`
- [ ] Corrigir campo "Email" do formulário de Dados Pessoais — garantir que exibe o email do usuário logado
- [ ] Corrigir campo "Empresa" do formulário de Dados Pessoais — garantir que exibe o nome do tenant do usuário

**Backend**:

- [ ] Verificar `GET /api/employee/profile` — garantir que retorna `email` e `tenantName` no payload

**Critérios de Aceitação**:

- Tela de perfil não exibe os 4 big numbers
- Campo "Email" mostra o email do funcionário
- Campo "Empresa" mostra o nome do tenant/empresa
- Formulário de dados pessoais funciona corretamente

**Dependências**: Nenhuma

---

### Etapa 3.3: Correção do Foco da Sidebar — Novo Agendamento

**Descrição**: Ao clicar em "Novo Agendamento" na sidebar, o item "Meus Agendamentos" também fica em destaque (efeito de foco simultâneo). Apenas o item clicado deve ficar ativo.

**Frontend**:

- [ ] Analisar lógica de highlight ativo na `Sidebar.tsx`
- [ ] Corrigir comparação de URL — usar `pathname === href` exato ao invés de `pathname.startsWith(href)`
- [ ] Garantir que `/appointments/new` não ativa `/appointments` simultaneamente
- [ ] Testar com todas as rotas do menu EMPLOYEE

**Critérios de Aceitação**:

- Apenas o item clicado na sidebar fica destacado
- "Novo Agendamento" não ativa "Meus Agendamentos" simultaneamente
- Navegação entre itens destaca corretamente o item atual

**Dependências**: Etapa 1.1

---

## PARTE 4: Correções do Therapist

**Objetivo**: Corrigir bugs de visualização e responsividade na experiência do terapeuta — disponibilidade, home, calendário e histórico.

**Perfis impactados**: THERAPIST
**Dependências**: PARTE 1
**Estimativa**: 1 semana

---

### Etapa 4.1: Correção da Visualização de Disponibilidade

**Descrição**: Os cards de slots na tela de Disponibilidade possuem bug de visualização em telas que não são mobile. Em telas maiores que 1700px de largura, validar se existem slots para sábado e domingo — se não houver, remover esses dias da visualização semanal e exibir apenas 5 dias.

**Frontend**:

- [ ] Analisar página `/therapist/availability` e identificar o bug de tamanho dos cards
- [ ] Corrigir CSS dos cards de slots para que sejam legíveis em todas as resoluções
- [ ] Implementar lógica de verificação: ao atingir width >= 1700px, verificar se há slots para sábado e domingo
  - Se não houver slots no fim de semana: exibir grade de 5 dias (segunda a sexta)
  - Se houver slots no fim de semana: manter 7 dias mas ajustar visualização para 5 colunas com scroll ou tamanho ajustado
- [ ] Usar `window.innerWidth` ou media query para detectar tamanho da tela
- [ ] Garantir que os cards sejam legíveis em qualquer resolução acima de mobile

**Critérios de Aceitação**:

- Cards de slots são legíveis em todas as resoluções (desktop, tablet, mobile)
- Em telas >= 1700px sem slots no fim de semana, exibe apenas 5 dias
- Em telas >= 1700px com slots no fim de semana, mantém 7 dias com visualização adequada
- Não há cards minúsculos ou ilegíveis em nenhuma resolução

**Dependências**: Nenhuma

---

### Etapa 4.2: Remover Dashboard do Therapist — Home = Calendário

**Descrição**: A tela de dashboard não faz sentido para o terapeuta. A home deve ser a tela de Calendário (`/therapist/calendar`).

**Frontend**:

- [ ] Alterar `lib/hooks/useAuth.ts` — `getRedirectByRole()` para que THERAPIST redirecione para `/therapist/calendar`
- [ ] Alterar `middleware.ts` — redirecionamento pós-login de THERAPIST para `/therapist/calendar`
- [ ] Remover ou alterar item "Home" do menu THERAPIST em `lib/config/menu.ts` — tornar "Calendário" o primeiro item
- [ ] Garantir que acesso a `/dashboard` como THERAPIST redireciona para `/therapist/calendar`

**Critérios de Aceitação**:

- Login como THERAPIST redireciona para `/therapist/calendar`
- Menu THERAPIST não tem item "Home" separado — "Calendário" é o primeiro
- Acesso a `/dashboard` como THERAPIST redireciona para `/therapist/calendar`

**Dependências**: Etapa 1.1

---

### Etapa 4.3: Responsividade do Seletor de Visualização no Calendário

**Descrição**: Na tela de calendário, entre 1000px e 1400px de largura, a seleção de visualização (dia/semana/mês) fica comprometida. Ao atingir essa faixa, os botões devem quebrar de linha e ficar centralizados.

**Frontend**:

- [ ] Analisar página `/therapist/calendar` e o componente de toggle (Dia/Semana/Mês)
- [ ] Adicionar media query ou classes responsivas para faixa 1000px-1400px
- [ ] Quando width entre 1000px e 1400px: botões de visualização quebram de linha e ficam centralizados
- [ ] Garantir que o restante do calendário permanece funcional nessa faixa

**Critérios de Aceitação**:

- Entre 1000px e 1400px, seleção de visualização quebra de linha e centraliza
- Abaixo de 1000px, comportamento mobile existente mantido
- Acima de 1400px, comportamento desktop existente mantido
- Não há sobreposição ou corte de texto

**Dependências**: Nenhuma

---

### Etapa 4.4: Responsividade do Histórico de Agendamentos

**Descrição**: A tela de histórico de agendamentos do terapeuta (`/therapist/history`) não está responsiva.

**Frontend**:

- [ ] Analisar página `/therapist/history` em diferentes resoluções
- [ ] Tornar a tabela de histórico responsiva (scroll horizontal em mobile ou layout de cards)
- [ ] Tornar os filtros responsivos (empilhar em mobile)
- [ ] Tornar os cards de estatísticas responsivos (grid adaptável)
- [ ] Tornar o gráfico de barras responsivo
- [ ] Testar em breakpoints: 320px, 768px, 1024px, 1440px

**Critérios de Aceitação**:

- Página é utilizável e legível em todos os breakpoints
- Tabela não quebra o layout em telas pequenas
- Filtros são acessíveis em mobile
- Estatísticas se reorganizam adequadamente

**Dependências**: Nenhuma

---

## PARTE 5: Correções do Super Admin

**Objetivo**: Corrigir regras de negócio e ajustes no painel do Super Admin — programas globais, capacidade, logs, visualização de admins e remoção de campo de logo.

**Perfis impactados**: SUPER_ADMIN, TENANT_ADMIN
**Dependências**: PARTE 1
**Estimativa**: 1 semana

---

### Etapa 5.1: Programas Globais — Desvincular de Tenant Único

**Descrição**: Os programas devem ser globais e não vinculados a uma única empresa. A Maratona pode oferecer programas gerais e vinculá-los a múltiplos tenants. Deve-se criar um relacionamento many-to-many entre `Program` e `Tenant`.

**Backend**:

- [ ] Criar tabela de junção `TenantProgram` (tenant_id, program_id, active, created_at, updated_at) via Prisma migration
- [ ] Tornar `Program.tenantId` opcional ou remover (programa é global)
- [ ] Atualizar `ProgramService` — criar programa sem tenantId obrigatório
- [ ] Criar endpoints para vincular/desvincular programa de tenant:
  - `POST /api/admin/programs/[id]/tenants` — vincular programa a tenant(s)
  - `DELETE /api/admin/programs/[id]/tenants/[tenantId]` — desvincular
  - `GET /api/admin/programs/[id]/tenants` — listar tenants vinculados
- [ ] Atualizar queries de disponibilidade para usar TenantProgram ao invés de Program.tenantId
- [ ] Atualizar listagem de programas para TENANT_ADMIN — filtrar via TenantProgram

**Frontend**:

- [ ] Atualizar página `/superadmin/programs` — exibir programas globais
- [ ] Adicionar gestão de vinculação de tenants na página de detalhes/edição do programa
- [ ] Criar visualização read-only dos programas para TENANT_ADMIN (`/admin/programs` apenas visualização)

**Critérios de Aceitação**:

- Programas são criados sem vínculo obrigatório a um tenant
- Programa pode ser vinculado a múltiplos tenants
- TENANT_ADMIN visualiza apenas programas vinculados ao seu tenant
- Queries de disponibilidade usam a nova relação
- Migration não perde dados existentes

**Dependências**: Nenhuma

---

### Etapa 5.2: Capacidade Máxima por Terapeuta por Sessão

**Descrição**: A capacidade máxima do local hoje indica quantidade máxima de slots por dia, mas deveria ser a capacidade máxima de pessoas simultâneas por sessão de cada terapeuta. Ao gerar slots, essa capacidade deve ser considerada individualmente.

**Backend**:

- [ ] Reevaliar o campo `capacity` no model `Program` ou `Location` — definir claramente como "capacidade máxima de pessoas por sessão por terapeuta"
- [ ] Atualizar `generateAvailabilitySlots()` — ao gerar slots, usar a capacidade para definir quantas vagas cada slot individual tem
- [ ] Atualizar lógica de criação de agendamento — validar contra capacidade do slot individual
- [ ] Documentar a regra: um slot de terapeuta X com capacidade 30 aceita até 30 agendamentos simultâneos

**Frontend**:

- [ ] Atualizar formulários de criação/edição de programa — label do campo "Capacidade" para "Capacidade máxima por sessão (pessoas simultâneas)"
- [ ] Atualizar tooltip ou help text para explicar o significado

**Critérios de Aceitação**:

- Capacidade reflete número de pessoas simultâneas por sessão por terapeuta
- Geração de slots usa essa capacidade corretamente
- Agendamentos respeitam o limite de capacidade por slot
- Labels e descrições são claros

**Dependências**: Nenhuma

---

### Etapa 5.3: Remover Página de Logs de Acesso

**Descrição**: Remover a página de logs de acesso do Super Admin e seu item no menu.

**Frontend**:

- [ ] Remover item "Logs de Acesso" do menu SUPER_ADMIN em `lib/config/menu.ts`
- [ ] Remover ou marcar como deprecated a página `/superadmin/logs`
- [ ] Remover ou marcar como deprecated a API route `GET /api/admin/logs`

**Critérios de Aceitação**:

- Item "Logs de Acesso" não aparece no menu
- Página `/superadmin/logs` não é mais acessível (ou redireciona para dashboard)

**Dependências**: Etapa 1.1

---

### Etapa 5.4: Visualizar Admins na Tela de Detalhes do Tenant

**Descrição**: Na página `/superadmin/tenants/[id]`, exibir a lista de administradores (TENANT_ADMIN) cadastrados para a empresa.

**Backend**:

- [ ] Atualizar `GET /api/admin/tenants/[id]` — incluir lista de usuários com role TENANT_ADMIN do tenant
- [ ] Retornar: nome, email, status (ativo/inativo), data de criação

**Frontend**:

- [ ] Adicionar seção ou aba "Administradores" na página `/superadmin/tenants/[id]`
- [ ] Exibir tabela/lista com: nome, email, status, data de cadastro
- [ ] Indicar visualmente admins ativos vs inativos

**Critérios de Aceitação**:

- Lista de admins é exibida na página de detalhes do tenant
- Mostra nome, email, status e data de criação
- Dados são filtrados corretamente pelo tenant

**Dependências**: Nenhuma

---

### Etapa 5.5: Remover URL de Logo das Empresas

**Descrição**: Remover o campo de URL de logo das empresas (tenants), pois não tem uso atual.

**Frontend**:

- [ ] Remover campo "Logo URL" dos formulários de criação de tenant (`/superadmin/tenants/new`)
- [ ] Remover campo "Logo URL" dos formulários de edição de tenant
- [ ] Remover campo "Logo" das configurações do TENANT_ADMIN (`/admin/settings`)

**Backend**:

- [ ] Remover `logo_url` do schema de validação de tenant (opcional — manter no banco para futuro)
- [ ] Não retornar `logo_url` nas APIs ou marcar como deprecated

**Critérios de Aceitação**:

- Nenhum formulário exibe campo de logo/logo URL
- Dados existentes não são perdidos (campo mantido no banco, apenas removido da UI)

**Dependências**: Nenhuma

---

### Etapa 5.6: Visualização de Programas para Tenant Admin (Read-Only)

**Descrição**: Adicionar uma tela para o TENANT_ADMIN visualizar os programas disponíveis para sua empresa. Permissão apenas de visualização.

**Backend**:

- [ ] Garantir que o endpoint de listagem de programas por tenant (`GET /api/admin/tenants/[tenantId]/programs`) aceita role TENANT_ADMIN
- [ ] Retornar apenas programas vinculados ao tenant do admin logado

**Frontend**:

- [ ] Criar página `/admin/programs` (read-only)
- [ ] Exibir lista/cards de programas com: nome, descrição, duração, período, capacidade, status
- [ ] Sem botões de edição, criação ou exclusão
- [ ] Garantir que item "Programas" existe no menu TENANT_ADMIN apontando para `/admin/programs`

**Critérios de Aceitação**:

- TENANT_ADMIN visualiza programas vinculados à sua empresa
- Nenhuma ação de escrita é possível
- Dados são atualizados e corretos

**Dependências**: Etapa 5.1

---

## PARTE 6: Reestruturação dos Dashboards

**Objetivo**: Reestruturar completamente os dashboards do SUPER_ADMIN e TENANT_ADMIN conforme especificação detalhada no documento de mudanças.

**Perfis impactados**: SUPER_ADMIN, TENANT_ADMIN
**Dependências**: PARTEs 1-5
**Estimativa**: 1 semana

---

### Etapa 6.1: Dashboard do Super Admin — Big Numbers

**Descrição**: Implementar os 4 big numbers especificados na primeira linha do dashboard do Super Admin.

**Backend**:

- [ ] Atualizar `getSuperAdminDashboard()` — garantir que retorna:
  1. Total de Tenants ativos
  2. Total de Funcionários cadastrados (geral)
  3. Total de acessos até o momento (geral) — contar registros de AuthLog com outcome SUCCESS
  4. Total de agendamentos cadastrados (geral)

**Frontend**:

- [ ] Criar/atualizar página `/superadmin/dashboard` — primeira linha com 4 big numbers
- [ ] Cada big number ocupa 25% da largura (grid de 4 colunas)
- [ ] Estilo: número grande em destaque, label descritivo abaixo
- [ ] Responsivo: em mobile, empilhar 2x2 ou 1 coluna

**Critérios de Aceitação**:

- 4 big numbers visíveis na primeira linha
- Cada um ocupa 25% da tela em desktop
- Dados são corretos e atualizados
- Layout responsivo em mobile

**Dependências**: Nenhuma

---

### Etapa 6.2: Dashboard do Super Admin — Charts

**Descrição**: Implementar os 3 gráficos especificados para o dashboard do Super Admin, ocupando 75% restante da tela.

**Backend**:

- [ ] Atualizar `getSuperAdminDashboard()` — garantir que retorna dados para:
  1. Total de agendamentos por Tenant por dia (separado em concluídos, cancelados, agendados) — para gráfico de barras empilhado
  2. Total de acessos diários da plataforma — para gráfico de barras
  3. Total de Employees cadastrados por Tenant — para gráfico de barras

**Frontend**:

- [ ] Instalar biblioteca de gráficos se não existir (Recharts ou Chart.js)
- [ ] Chart 1: Gráfico de barras empilhado — agendamentos por tenant por dia (cores: verde=concluídos, vermelho=cancelados, azul=agendados)
- [ ] Chart 2: Gráfico de barras — acessos diários da plataforma
- [ ] Chart 3: Gráfico de barras — employees por tenant
- [ ] Layout: 3 charts organizados de forma otimizada nos 75% restantes da tela
- [ ] Filtro de período para os gráficos (últimos 7, 15, 30 dias)

**Critérios de Aceitação**:

- 3 gráficos são exibidos abaixo dos big numbers
- Gráfico 1 é de barras empilhado com 3 categorias por cor
- Todos os gráficos são interativos (tooltip ao hover)
- Layout é equilibrado e responsivo
- Dados são corretos e atualizados

**Dependências**: Etapa 6.1

---

### Etapa 6.3: Dashboard do Tenant Admin — Big Numbers

**Descrição**: Implementar os 4 big numbers especificados na primeira linha do dashboard do Tenant Admin.

**Backend**:

- [ ] Atualizar `getTenantAdminDashboard()` — garantir que retorna:
  1. Total de Funcionários cadastrados (tenant)
  2. Total de acessos de funcionários até o momento (tenant) — AuthLog filtrado por tenant
  3. Total de agendamentos realizados (tenant)
  4. Taxa de conversão (acessos vs agendamentos) — percentual

**Frontend**:

- [ ] Criar/atualizar página `/admin/dashboard` — primeira linha com 4 big numbers
- [ ] Cada big number ocupa 25% da largura (grid de 4 colunas)
- [ ] Taxa de conversão exibida como percentual com ícone indicativo
- [ ] Responsivo: em mobile, empilhar 2x2 ou 1 coluna

**Critérios de Aceitação**:

- 4 big numbers visíveis na primeira linha
- Taxa de conversão calculada corretamente (agendamentos / acessos \* 100)
- Dados são filtrados pelo tenant do admin logado
- Layout responsivo

**Dependências**: Nenhuma

---

### Etapa 6.4: Dashboard do Tenant Admin — Charts

**Descrição**: Implementar os 3 gráficos especificados para o dashboard do Tenant Admin.

**Backend**:

- [ ] Atualizar `getTenantAdminDashboard()` — garantir que retorna dados para:
  1. Total de agendamentos por dia (separado em concluídos, cancelados, agendados) — gráfico de barras empilhado
  2. Total de acessos dos funcionários diariamente — gráfico de barras
  3. Taxa de conversão diária (acessos vs agendamentos por dia) — gráfico de barras/linha

**Frontend**:

- [ ] Chart 1: Gráfico de barras empilhado — agendamentos por dia (cores: verde=concluídos, vermelho=cancelados, azul=agendados)
- [ ] Chart 2: Gráfico de barras — acessos diários dos funcionários
- [ ] Chart 3: Gráfico de barras/linha — taxa de conversão diária (percentual)
- [ ] Layout: 3 charts organizados nos 75% restantes da tela
- [ ] Filtro de período (últimos 7, 15, 30 dias)

**Critérios de Aceitação**:

- 3 gráficos são exibidos abaixo dos big numbers
- Gráfico 1 é de barras empilhado com 3 categorias por cor
- Taxa de conversão exibida como percentual
- Dados filtrados pelo tenant
- Layout equilibrado e responsivo

**Dependências**: Etapa 6.3

---

## Resumo de Dependências entre PARTES

| PARTE | Nome                                 | Depende de |
| ----- | ------------------------------------ | ---------- |
| 1     | Correções Gerais de UI/UX            | -          |
| 2     | Correções de Autenticação e Cadastro | PARTE 1    |
| 3     | Correções do Employee                | PARTE 1    |
| 4     | Correções do Therapist               | PARTE 1    |
| 5     | Correções do Super Admin             | PARTE 1    |
| 6     | Reestruturação dos Dashboards        | PARTEs 1-5 |

> **Nota**: PARTEs 2, 3, 4 e 5 podem ser implementadas em paralelo após a conclusão da PARTE 1. A PARTE 6 depende de todas as anteriores.

---

## Cronograma Estimado

| PARTE     | Duração         | Semanas |
| --------- | --------------- | ------- |
| PARTE 1   | 1 semana        | S1      |
| PARTE 2   | 0.5 semana      | S2      |
| PARTE 3   | 0.5 semana      | S2      |
| PARTE 4   | 1 semana        | S2-S3   |
| PARTE 5   | 1 semana        | S2-S3   |
| PARTE 6   | 1 semana        | S3-S4   |
| **TOTAL** | **3-4 semanas** |         |

---

> **Nota**: Este plano é um guia complementar ao `IMPLEMENTATION_PLAN.md` original. As mudanças aqui descritas são refinamentos e correções sobre a implementação já existente (PARTEs 1-8 do plano original).
