# Maratona QV Wellness Hub — PRD e Especificação Técnica de Implementação

> **Versão:** 1.0.0
> **Última Atualização:** 3 de fevereiro de 2026
> **Status:** Aprovado para Desenvolvimento

---

## Índice

- [Parte I: Visão de Produto](#parte-i-visão-de-produto)
  - [Objetivos](#objetivos)
  - [Propósito](#proposito)
  - [User Stories](#user-stories)
- [Parte II: Contexto de Negócio](#parte-ii-contexto-de-negócio)
- [Parte III: Arquitetura e Stack Tecnológica](#parte-iii-arquitetura-e-stack-tecnológica)
- [Parte IV: Design System](#parte-iv-design-system)
- [Parte V: Especificação de Páginas por Perfil](#parte-v-especificação-de-páginas-por-perfil)
- [Parte VI: Componentes Compartilhados](#parte-vi-componentes-compartilhados)
- [Parte VII: API Routes e Endpoints](#parte-vii-api-routes-e-endpoints)
- [Parte VIII: Segurança e Multi-Tenancy](#parte-viii-segurança-e-multi-tenancy)
- [Parte IX: Roadmap de Implementação](#parte-ix-roadmap-de-implementação)

---

# Parte I: Visão de Produto

## Objetivos

Esse documento busca definir um produto mínimo viável da plataforma reservada para agendamentos de programas da Maratona por empresa (multi tenant). Ou seja, cada cliente deverá ter um ecossistema único de agendas, funcionários, acessos administradores, etc.

## Proposito

Esse projeto corresponde ao Backend do fluxo de plataforma de agendamentos da empresa Maratona Qualidade de Vida.

O propósito desse projeto é criar uma API modular em monolito que permita com que cada uma das histórias de usuários sejam concluídas com sucesso. A ideia é que a plataforma de agendamentos crie um fluxo de schedule, além de controle individual para as terapeutas, empresas tenant e funcionários que aproveitam do benefício. Além disso, precisamos de uma etapa pra nós validarmos o uso disso, por isso o acesso administrativo maratona.

# User Stories

## História 1: Acesso do Funcionário

> **Como** funcionário de uma empresa cliente,
> **Quero** acessar a plataforma usando minhas credenciais corporativas,
> **Para que** eu possa visualizar apenas os programas de massagens disponíveis para minha empresa e realizar agendamentos.

### Critérios de Aceitação

- [ ] Sistema identifica automaticamente a empresa (tenant) do funcionário através do email corporativo (@empresaX.com.br)
- [ ] Sistema valida credenciais do funcionário (email/senha corporativo)
- [ ] Após login bem-sucedido, usuário visualiza dashboard isolado com:
  - **Apenas** programas de massagens contratados por sua empresa
  - Calendário com datas disponíveis específicas para sua empresa
  - Vagas disponíveis considerando apenas funcionários da mesma empresa
  - Nome/logo da empresa no cabeçalho
- [ ] Sistema exibe mensagem de erro clara em caso de credenciais inválidas
- [ ] Sistema bloqueia acesso caso a empresa não tenha programas ativos
- [ ] Sessão expira após 30 minutos de inatividade
- [ ] Funcionário pode fazer logout a qualquer momento
- [ ] Funcionário **não** visualiza dados de outras empresas

## História 2: Acesso do Administrador

### User Story

> **Como** administrador da Maratona (sua empresa),
> **Quero** acessar a plataforma usando minhas credenciais corporativas,
> **Para que** eu possa gerenciar e visualizar dados consolidados de todas as empresas clientes.

### Critérios de Aceitação

- [ ] Sistema identifica o usuário como administrador global (não vinculado a um tenant específico)
- [ ] Sistema valida credenciais do administrador
- [ ] Após login bem-sucedido, administrador visualiza:
  - **Dashboard global** com métricas consolidadas de todas as empresas
  - Lista de todas as empresas clientes ativas
  - Total de funcionários cadastrados por empresa
  - Total de agendamentos realizados (geral e por empresa)
  - Programas de massagens ativos por empresa
  - Status de utilização dos serviços (% de vagas ocupadas)
- [ ] Administrador pode **selecionar uma empresa** para visualizar detalhes específicos:
  - Funcionários cadastrados
  - Histórico de agendamentos
  - Programas contratados e suas configurações
- [ ] Sistema exibe mensagem de erro clara em caso de credenciais inválidas
- [ ] Sessão expira após 30 minutos de inatividade
- [ ] Administrador pode fazer logout a qualquer momento
- [ ] Administrador **tem acesso completo** a dados de todas as empresas (super admin)

## História 3: Acesso de administrador cliente

### User Story

> **Como** administrador de empresa cliente,
> **Quero** gerenciar os funcionários da minha empresa na plataforma,
> **Para que** eu possa controlar quem tem acesso aos programas de massagem.

### Critérios de Aceitação

- [ ] Admin da empresa pode cadastrar novos funcionários
- [ ] Admin pode ativar/desativar acesso de funcionários
- [ ] Admin visualiza relatórios de utilização apenas da sua empresa
- [ ] Admin **não** tem acesso a dados de outras empresas

## História 4: Acesso do terapeuta

### User Story

> **Como** terapeuta credenciado pela Maratona,
> **Quero** acessar a plataforma e visualizar minhas agendas por empresa e localização,
> **Para que** eu possa gerenciar meus atendimentos em diferentes clientes e locais de forma organizada.

### Critérios de Aceitação

- [ ] Sistema valida credenciais do terapeuta (email/senha)
- [ ] Terapeuta visualiza **lista de empresas** às quais está vinculado
- [ ] Para cada empresa, terapeuta visualiza **localizações/sedes** onde presta serviço
- [ ] Após selecionar empresa + localização, terapeuta visualiza:
  - Agenda específica daquela combinação (empresa X localização)
  - Horários de atendimento configurados
  - Agendamentos confirmados com dados do funcionário
  - Horários disponíveis (sem agendamento)
  - Status de cada agendamento (confirmado, cancelado, concluído)
- [ ] Sistema **impede** que terapeuta tenha agendamentos conflitantes no mesmo horário (mesmo em empresas/localizações diferentes)
- [ ] Terapeuta pode filtrar agenda por:
  - Data específica
  - Período (semana, mês)
  - Status do agendamento
- [ ] Terapeuta pode marcar atendimentos como "concluídos"
- [ ] Sistema exibe alerta visual para horários próximos (ex: próximos 30min)
- [ ] Sessão expira após 30 minutos de inatividade
- [ ] Terapeuta pode fazer logout a qualquer momento

## História 5: Gestão de Terapeutas pelo Administrador

### User Story

> **Como** administrador da Maratona,
> **Quero** gerenciar terapeutas e suas vinculações com empresas e localizações,
> **Para que** eu possa controlar a disponibilidade de profissionais em cada cliente e sede.

### Critérios de Aceitação

#### Cadastro de Terapeuta

- [ ] Administrador acessa página de cadastro de terapeutas
- [ ] Sistema solicita dados obrigatórios:
  - Nome completo
  - Email (será usado para login)
  - Telefone
  - CPF
  - Especialidade(s)
  - Senha inicial (ou envio por email)
- [ ] Sistema valida unicidade do email e CPF
- [ ] Sistema envia email de boas-vindas com credenciais de acesso
- [ ] Terapeuta é criado com status "ativo" por padrão
- [ ] Sistema exibe mensagem de sucesso após cadastro

#### Listagem de Terapeutas

- [ ] Administrador visualiza lista paginada de todos os terapeutas
- [ ] Lista exibe: nome, email, especialidades, status, quantidade de empresas vinculadas
- [ ] Administrador pode filtrar por:
  - Status (ativo/inativo)
  - Especialidade
  - Empresa vinculada
  - Texto livre (nome, email)
- [ ] Administrador pode ordenar por nome, data de cadastro

#### Visualização de Detalhes

- [ ] Administrador clica em um terapeuta e visualiza:
  - Dados cadastrais completos
  - Lista de empresas e localizações vinculadas
  - Histórico de agendamentos (resumido)
  - Data de cadastro e última atualização

#### Edição de Terapeuta

- [ ] Administrador pode editar dados cadastrais do terapeuta
- [ ] Sistema valida alterações (email único, CPF válido, etc.)
- [ ] Sistema registra data/hora da última atualização
- [ ] Administrador pode ativar/desativar terapeuta
- [ ] Ao desativar, sistema impede novos agendamentos
- [ ] Agendamentos futuros existentes são mantidos (com alerta)

#### Gerenciamento de Vinculações (Empresas + Localizações)

- [ ] Administrador acessa seção "Vinculações" do terapeuta
- [ ] Sistema exibe lista atual de vinculações (empresa + sede)
- [ ] **Adicionar Vinculação:**
  - Administrador seleciona empresa cliente
  - Sistema carrega localizações disponíveis daquela empresa
  - Administrador seleciona uma ou mais localizações
  - Sistema cria vinculação ativa
  - Sistema permite definir disponibilidade (dias/horários) para cada local
- [ ] **Remover Vinculação:**
  - Administrador clica em "Remover" em uma vinculação
  - Sistema verifica se há agendamentos futuros
  - Se houver agendamentos futuros, sistema exibe alerta e solicita confirmação
  - Sistema inativa a vinculação (soft delete)
  - Agendamentos passados são mantidos para histórico
- [ ] **Editar Vinculação:**
  - Administrador pode alterar disponibilidade de horários
  - Sistema valida conflitos com agendamentos existentes

#### Exclusão de Terapeuta

- [ ] Administrador pode excluir terapeuta (soft delete)
- [ ] Sistema verifica agendamentos futuros
- [ ] Se houver agendamentos, sistema bloqueia exclusão e exibe lista
- [ ] Se não houver impedimentos, terapeuta é marcado como inativo
- [ ] Dados históricos são preservados

## História 6: Primeiro Acesso e Autenticação por Token

### User Story

> **Como** funcionário de uma empresa cliente,
> **Quero** realizar meu primeiro acesso na plataforma usando apenas meu email corporativo,
> **Para que** eu possa me autenticar de forma segura através de um token enviado por email, sem necessidade de criar senha.

### Critérios de Aceitação

#### Primeiro Login

- [ ] Sistema valida se o domínio do email (@empresaX.com.br) pertence a uma empresa cliente cadastrada
- [ ] Sistema exibe mensagem de erro clara caso o domínio não seja válido/autorizado
- [ ] Ao inserir email válido, sistema gera um token único com TTL (Time To Live)
- [ ] Sistema envia email contendo o token de autenticação
- [ ] Email enviado contém:
  - Token de acesso
  - Tempo de expiração do token
  - Link direto para página de validação
  - Instruções claras de uso
- [ ] Sistema armazena **apenas o email** do funcionário na base de dados (sem senha)

#### Logins Subsequentes

- [ ] A cada novo login, sistema gera e envia um **novo token** com TTL
- [ ] Token anterior é invalidado automaticamente ao gerar novo token
- [ ] Funcionário pode solicitar reenvio do token durante o processo de login
- [ ] Sistema limita quantidade de reenvios de token (ex: máximo 3 tentativas em 15 minutos)
- [ ] Sistema exibe mensagem de sucesso após envio do token

#### Validação do Token

- [ ] Funcionário insere o token recebido por email
- [ ] Sistema valida se o token está correto e ainda dentro do TTL
- [ ] Sistema exibe mensagem de erro clara caso token seja:
  - Inválido
  - Expirado
  - Já utilizado
- [ ] Após validação bem-sucedida, sistema cria sessão autenticada
- [ ] Sessão expira após 30 minutos de inatividade

#### Segurança

- [ ] Tokens são gerados de forma criptograficamente segura
- [ ] TTL padrão do token é de 15 minutos
- [ ] Sistema registra log de tentativas de autenticação
- [ ] Sistema bloqueia temporariamente após múltiplas tentativas com tokens inválidos
- [ ] Token pode ser usado apenas uma vez (single-use)

#### Experiência do Usuário

- [ ] Interface indica claramente tempo restante para expiração do token
- [ ] Botão "Reenviar token" fica disponível durante o processo de login
- [ ] Sistema exibe feedback visual durante envio de email
- [ ] Mensagens de erro são claras e orientam próximos passos

## História 7: Efetuar um Agendamento

### User Story

> **Como** funcionário de uma empresa cliente,
> **Quero** fazer um agendamento de massagem pela plataforma,
> **Para que** eu possa escolher data, horário e terapeuta que sejam convenientes para minha rotina de trabalho.

Critérios de Aceitação

#### Visualização de Disponibilidade

- [ ] Sistema exibe calendário com apenas os dias disponíveis para agendamento da minha empresa
- [ ] Sistema exibe horários disponíveis conforme programa contratado (ex: 9h às 18h)
- [ ] Sistema exibe quantidade de vagas disponíveis por horário
- [ ] Sistema exibe lista de terapeutas disponíveis para cada horário
- [ ] Sistema exibe informações do terapeuta:
  - Nome completo
  - Foto (se disponível)
  - Especialidades/técnicas
  - Avaliação (se aplicável)
- [ ] Sistema bloqueia horários que já atingiram capacidade máxima
- [ ] Sistema bloqueia datas/horários fora do período do programa contratado

#### Processo de Agendamento

- [ ] Funcionário seleciona data desejada no calendário
- [ ] Sistema carrega horários disponíveis para a data selecionada
- [ ] Funcionário seleciona horário desejado
- [ ] Sistema exibe terapeutas disponíveis para aquele horário
- [ ] Funcionário pode escolher terapeuta específico ou deixar sistema alocar automaticamente
- [ ] Sistema exibe resumo do agendamento antes da confirmação:
  - Data e horário
  - Terapeuta
  - Duração da sessão
  - Local (se aplicável)
- [ ] Funcionário confirma o agendamento
- [ ] Sistema valida se ainda há vaga disponível no momento da confirmação

#### Confirmação e Notificações

- [ ] Sistema cria o agendamento e gera código único de confirmação
- [ ] Sistema envia email de confirmação contendo:
  - Código do agendamento
  - Data, horário e duração
  - Nome do terapeuta
  - Local/instruções
  - Opção de adicionar ao calendário (iCal)
  - Política de cancelamento
- [ ] Sistema exibe mensagem de sucesso com resumo do agendamento
- [ ] Sistema atualiza automaticamente disponibilidade de vagas
- [ ] Sistema envia notificação ao terapeuta sobre novo agendamento

#### Restrições e Regras de Negócio

- [ ] Funcionário **não pode** agendar mais de uma sessão no mesmo dia
- [ ] Sistema valida limite de agendamentos por funcionário conforme programa contratado
- [ ] Sistema impede agendamento em horários passados
- [ ] Sistema exige antecedência mínima para agendamento (ex: 2 horas)
- [ ] Sistema bloqueia agendamento caso funcionário tenha pendência (ex: no-show anterior)

#### Experiência do Usuário

- [ ] Interface responsiva e intuitiva para navegação no calendário
- [ ] Sistema salva progresso caso usuário saia antes de confirmar
- [ ] Botão "Voltar" permite ajustar seleções anteriores
- [ ] Sistema exibe mensagens claras em caso de erro ou indisponibilidade

## História 8: Cancelar Agendamento

### User Story

> **Como** funcionário de uma empresa cliente,
> **Quero** cancelar um agendamento feito anteriormente,
> **Para que** eu possa liberar a vaga para outros colegas e reagendar conforme minha disponibilidade.

### Critérios de Aceitação

#### Visualização de Agendamentos

- [ ] Sistema exibe lista de todos os agendamentos ativos do funcionário
- [ ] Para cada agendamento, sistema exibe:
  - Data e horário
  - Nome do terapeuta
  - Status (Confirmado/Pendente)
  - Código do agendamento
  - Tempo restante até a sessão
- [ ] Sistema identifica visualmente agendamentos que **não podem** mais ser cancelados
- [ ] Sistema ordena agendamentos por data (mais próximos primeiro)

#### Processo de Cancelamento

- [ ] Funcionário seleciona agendamento que deseja cancelar
- [ ] Sistema verifica se cancelamento está dentro do prazo permitido
- [ ] Sistema exibe modal de confirmação com:
  - Detalhes do agendamento
  - Aviso sobre política de cancelamento
  - Campo opcional para motivo do cancelamento
  - Alerta se houver restrições aplicáveis
- [ ] Funcionário confirma o cancelamento
- [ ] Sistema processa cancelamento e atualiza status

#### Regras de Cancelamento

- [ ] Sistema permite cancelamento até **X horas** antes do horário agendado (ex: 4 horas)
- [ ] Sistema **não permite** cancelamento após prazo limite
- [ ] Sistema registra histórico de cancelamentos do funcionário
- [ ] Sistema aplica penalidades conforme política:
  - Após 3 cancelamentos em sequência: bloqueio temporário (ex: 7 dias)
  - Cancelamento fora do prazo: contabiliza como falta (no-show)
- [ ] Sistema exibe claramente consequências antes da confirmação

#### Notificações e Atualização

- [ ] Sistema envia email de confirmação de cancelamento contendo:
  - Código do agendamento cancelado
  - Data e horário que foram liberados
  - Link para fazer novo agendamento
- [ ] Sistema notifica terapeuta sobre o cancelamento
- [ ] Sistema libera imediatamente a vaga para outros funcionários
- [ ] Sistema atualiza calendário de disponibilidade em tempo real
- [ ] Sistema remove agendamento da lista de "Agendamentos Ativos"

#### Histórico

- [ ] Agendamento cancelado é movido para "Histórico"
- [ ] Sistema mantém registro com:
  - Data do agendamento original
  - Data do cancelamento
  - Motivo (se informado)
  - Status: "Cancelado pelo funcionário"
- [ ] Funcionário pode visualizar histórico de cancelamentos

#### Casos Especiais

- [ ] Sistema exibe mensagem diferenciada se cancelamento for fora do prazo
- [ ] Sistema permite solicitar cancelamento excepcional (requer aprovação)
- [ ] Sistema exibe alternativas caso funcionário tenha muitos cancelamentos:
  - Sugestão de reagendamento imediato
  - Alerta sobre bloqueio iminente

## História 9: Marcar Presença do Agendamento

### User Story

> **Como** terapeuta credenciado pela Maratona,
> **Quero** registrar a presença ou ausência dos funcionários nos agendamentos,
> **Para que** eu possa documentar as sessões realizadas e os no-shows para fins de controle e faturamento.

### Critérios de Aceitação

#### Visualização de Agendamentos do Terapeuta

- [ ] Sistema exibe dashboard com agendamentos do dia do terapeuta
- [ ] Para cada agendamento, sistema exibe:
  - Horário da sessão
  - Nome do funcionário
  - Empresa do funcionário
  - Código do agendamento
  - Status atual (Confirmado/Em Andamento/Concluído/Ausente)
- [ ] Sistema destaca visualmente próximo agendamento
- [ ] Sistema permite filtrar agendamentos por:
  - Data
  - Status
  - Empresa
- [ ] Sistema exibe resumo do dia:
  - Total de agendamentos
  - Sessões realizadas
  - No-shows
  - Cancelamentos

#### Registro de Presença

- [ ] Terapeuta pode marcar presença **durante** ou **após** o horário agendado
- [ ] Sistema exibe opções claras:
  - ✅ **Presente** - Funcionário compareceu
  - ❌ **Ausente (No-show)** - Funcionário não compareceu
  - ⏰ **Atrasado** - Funcionário chegou com atraso
- [ ] Sistema solicita confirmação antes de registrar
- [ ] Após registro, sistema atualiza status imediatamente
- [ ] Sistema permite adicionar observações opcionais:
  - Tempo de atraso (se aplicável)
  - Notas sobre a sessão
  - Feedback do atendimento

#### Registro de No-Show

- [ ] Sistema permite marcar no-show apenas **após** horário agendado + tolerância (ex: 15 min)
- [ ] Sistema exibe modal de confirmação específico para no-show
- [ ] Sistema solicita confirmação:
  - "Funcionário [Nome] não compareceu?"
  - Campo opcional para observações
- [ ] Terapeuta confirma ausência
- [ ] Sistema registra no-show no histórico do funcionário

#### Atualização e Notificações

- [ ] Sistema envia notificação ao funcionário após registro de presença:
  - ✅ Presença: "Obrigado por comparecer! Esperamos que tenha aproveitado."
  - ❌ No-show: "Você não compareceu ao agendamento de [data/hora]. Isso impacta futuras reservas."
- [ ] Sistema atualiza estatísticas do funcionário:
  - Total de sessões realizadas
  - Total de no-shows
  - Taxa de comparecimento
- [ ] Sistema notifica empresa cliente sobre no-shows (relatório consolidado)
- [ ] Sistema atualiza disponibilidade de vagas em tempo real

#### Restrições e Regras

- [ ] Terapeuta **só pode** marcar presença de seus próprios agendamentos
- [ ] Sistema **não permite** alterar registro após 24 horas
- [ ] Sistema exige que terapeuta registre presença até final do dia (23:59)
- [ ] Agendamentos sem registro são automaticamente marcados como "Pendente de confirmação"
- [ ] Sistema envia lembrete ao terapeuta sobre agendamentos sem registro

#### Controle de No-Shows

- [ ] Sistema registra no-show no histórico do funcionário
- [ ] Após **3 no-shows**, sistema:
  - Bloqueia temporariamente novos agendamentos (ex: 15 dias)
  - Envia notificação ao funcionário e empresa
- [ ] Sistema permite que empresa visualize taxa de no-show por funcionário
- [ ] Sistema gera relatório mensal de presença/ausência para faturamento

#### Interface do Terapeuta

- [ ] Botões de ação são grandes e facilmente acessíveis (mobile-friendly)
- [ ] Sistema confirma visualmente cada registro com feedback imediato
- [ ] Sistema permite registro em lote (múltiplos agendamentos simultaneamente)
- [ ] Sistema funciona offline e sincroniza quando conectar
- [ ] Interface exibe timer indicando tempo restante para registrar presença

#### Auditoria e Histórico

- [ ] Sistema mantém log completo de todos os registros:
  - Quem registrou (terapeuta)
  - Quando registrou
  - Status marcado
  - Observações adicionadas
- [ ] Terapeuta pode visualizar histórico de atendimentos
- [ ] Sistema gera relatórios de produtividade do terapeuta

## Requisitos Não Funcionais:

1. Nenhum cliente deve ter acesso a outra base de dados ou informações de outro cliente.
2. As stacks para backend devem ser Java com Spring Boot e banco de dados PostgreSQL.
3. A API deve ser documentada utilizando OpenAPI/Swagger.
4. O fluxo de acesso deve ser seguro, e além de utilizar HTTPS, deve-se adicionar um fluxo de autenticação de sessão individual para cada tipo de usuário, garantindo que apenas o usuário autenticado possa acessar suas correspondentes funcionalidades.

---

# Parte II: Contexto de Negócio

## Sobre a Maratona Qualidade de Vida (MQV)

A **Maratona Qualidade de Vida** é uma prestadora de serviços de massagem, massoterapia, eventos e outras modalidades de bem-estar para funcionários de empresas contratantes.

### Proposta de Valor

A plataforma **Maratona QV Wellness Hub** deve:

| Objetivo                           | Descrição                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| **Agendamento Self-Service** | Permitir que funcionários agendem horários com terapeutas para modalidades específicas |
| **Visibilidade Gerencial**   | Fornecer métricas e relatórios para administradores (SUPER_ADMIN e TENANT_ADMIN)        |
| **Isolamento de Dados**      | Garantir isolamento completo entre dados de diferentes tenants (clientes)                 |
| **Controle de Acesso**       | Oferecer controle baseado em 4 perfis distintos                                           |

### Perfis de Usuário

| Perfil                 | Descrição                      | Escopo de Acesso                           |
| ---------------------- | -------------------------------- | ------------------------------------------ |
| **EMPLOYEE**     | Funcionário de empresa cliente  | Apenas dados do próprio tenant            |
| **TENANT_ADMIN** | Administrador de empresa cliente | Gestão completa do próprio tenant        |
| **THERAPIST**    | Terapeuta credenciado pela MQV   | Múltiplos tenants (conforme vinculação) |
| **SUPER_ADMIN**  | Administrador da Maratona        | Acesso global a todos os tenants           |

---

# Parte III: Arquitetura e Stack Tecnológica

## Stack Tecnológica Obrigatória

| Camada                      | Tecnologia               |
| --------------------------- | ------------------------ |
| **Framework Backend** | Next.js - Latest         |
| **Banco de Dados**    | PostgreSQL 15+           |
| **ORM**               | Prisma                   |
| **API**               | REST com OpenAPI/Swagger |
| **Autenticação**    | Access Tok               |
| **Frontend**          | Next.js 14+ (App Router) |
| **Estilização**     | Tailwind CSS             |

## Bounded Contexts (Módulos)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARATONA QV WELLNESS HUB                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Authentication │  │     Tenant      │  │      User       │  │
│  │  & Authorization│  │   Management    │  │   Management    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    Therapist    │  │     Program     │  │    Location     │  │
│  │   Management    │  │   Management    │  │   Management    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Availability   │  │   Appointment   │  │   Reporting &   │  │
│  │   Management    │  │   Management    │  │    Analytics    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Padrões de Design

| Padrão                          | Aplicação                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| **Atomic Design**          | Componentes de UI (Atoms → Molecules → Organisms → Templates) |
| **Hexagonal Architecture** | Backend com Ports & Adapters                                     |
| **Repository Pattern**     | Acesso a dados isolado                                           |
| **Service Layer**          | Lógica de negócio encapsulada                                  |
| **Domain Events**          | Comunicação assíncrona entre contextos                        |

## Requisitos de Multi-Tenancy

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY STRATEGY                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. ISOLAMENTO DE DADOS                                       │
│     ├── tenant_id obrigatório em todas as tabelas            │
│     ├── Row-Level Security (RLS) no PostgreSQL               │
│     └── Filtro automático em todas as queries                │
│                                                               │
│  2. MIDDLEWARE DE VALIDAÇÃO                                   │
│     ├── Extração de tenant do token JWT                      │
│     ├── Validação de acesso em cada requisição               │
│     └── Bloqueio de cross-tenant access                      │
│                                                               │
│  3. IDENTIFICAÇÃO DE TENANT                                   │
│     ├── Via domínio do email (@empresa.com.br)               │
│     ├── Via header X-Tenant-ID (para admins)                 │
│     └── Via JWT claim (tenant_id)                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

# Parte IV: Design System

## Paleta de Cores (Regra 70-20-10)

| Proporção               | Hex         | Uso                         |
| ------------------------- | ----------- | --------------------------- |
| **70%** (Primary)   | `#efefef` | Backgrounds principais      |
| **20%** (Secondary) | `#444444` | Cards, botões secundários |
| **10%** (Accent)    | `#97181B` | Links, estados ativos, CTAs |

## Tipografia

```css
/* Font Stack */
font-family: "Varela Round", "Helvetica Neue", Helvetica, Arial, sans-serif;

/* Tamanhos */
--font-size-base: 16px;
--line-height: 1.5;

/* Pesos */
--font-weight-regular: 400;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## Espaçamento

| Token            | Valor | Uso                |
| ---------------- | ----- | ------------------ |
| `--spacing-sm` | 8px   | Gaps pequenos      |
| `--spacing-md` | 16px  | Padding padrão    |
| `--spacing-lg` | 32px  | Seções           |
| `--spacing-xl` | 64px  | Layouts principais |

## Border Radius

| Token           | Valor |
| --------------- | ----- |
| `--radius-sm` | 4px   |
| `--radius-md` | 8px   |
| `--radius-lg` | 16px  |
| `--radius-xl` | 32px  |

## Shadows

| Token           | Valor                                                          |
| --------------- | -------------------------------------------------------------- |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`     |
| `--shadow-md` | `0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)`     |
| `--shadow-lg` | `0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)`   |
| `--shadow-xl` | `0 15px 25px rgba(0,0,0,0.22), 0 10px 10px rgba(0,0,0,0.24)` |

---

# Parte V: Especificação de Páginas por Perfil

## 1. PÚBLICO (Não Autenticado)

### 1.1 Landing Page (`/`)

| Aspecto             | Especificação                                          |
| ------------------- | -------------------------------------------------------- |
| **Objetivo**  | Apresentar a plataforma e direcionar para login/cadastro |
| **Tipo**      | Server Component (SSG)                                   |
| **API Calls** | Nenhuma (página estática)                              |

**Componentes:**

- Hero section com proposta de valor
- Seções explicativas sobre o serviço
- Botões CTA: "Acessar Plataforma" → `/login`
- Botões CTA: "Primeiro Acesso" → `/signup`
- Footer com informações institucionais

---

### 1.2 Página de Login (`/login`)

| Aspecto            | Especificação                               |
| ------------------ | --------------------------------------------- |
| **Objetivo** | Autenticação de usuários (todos os perfis) |
| **Tipo**     | Client Component (interativo)                 |
| **Layout**   | AuthLayout                                    |

**Componentes:**

- FormField (email)
- FormField (senha)
- Button ("Entrar")
- Link ("Esqueci minha senha") → `/forgot-password`
- Link ("Primeiro acesso") → `/signup`

**API Route:**

```
POST /api/auth/login
```

| Campo        | Tipo   | Validação                 |
| ------------ | ------ | --------------------------- |
| `email`    | string | Email válido, obrigatório |
| `password` | string | Mínimo 8 caracteres        |

**Response (200):**

```json
{
  "token": "jwt_string",
  "user": {
    "id": "uuid",
    "email": "user@empresa.com",
    "name": "Nome Completo",
    "role": "EMPLOYEE | TENANT_ADMIN | THERAPIST | SUPER_ADMIN"
  },
  "tenant_id": "uuid | null"
}
```

**Fluxo de Redirecionamento:**

| Role             | Destino                     |
| ---------------- | --------------------------- |
| `SUPER_ADMIN`  | `/admin/dashboard`        |
| `TENANT_ADMIN` | `/tenant-admin/dashboard` |
| `EMPLOYEE`     | `/employee/dashboard`     |
| `THERAPIST`    | `/therapist/calendar`     |

**Estados:**

- `idle`: Formulário pronto para input
- `loading`: Durante autenticação
- `error`: Credenciais inválidas / conta inativa / limite de tentativas
- `success`: Redirecionamento em andamento

---

### 1.3 Primeiro Acesso - Step 1: Email (`/signup`)

| Aspecto            | Especificação                           |
| ------------------ | ----------------------------------------- |
| **Objetivo** | Validar email corporativo do funcionário |
| **Tipo**     | Client Component                          |

**Componentes:**

- FormField (email corporativo)
- Button ("Continuar")
- Text (mensagem explicativa sobre validação de domínio)
- Link ("Já tenho conta") → `/login`

**API Route:**

```
POST /api/auth/magic-link/request
```

| Campo     | Tipo   | Validação                                          |
| --------- | ------ | ---------------------------------------------------- |
| `email` | string | Formato email, domínio deve existir em tenant ativo |

**Lógica Backend:**

1. Extrair domínio do email
2. Buscar tenant por domínio
3. Verificar se tenant está ativo
4. Verificar se email não está cadastrado
5. Gerar token único (TTL: 15 minutos)
6. Enviar email com link/código
7. Armazenar token com hash

**Response (202):**

```json
{
  "message": "Email de verificação enviado",
  "expires_in_minutes": 15
}
```

**Erros:**

| Código | Mensagem                        |
| ------- | ------------------------------- |
| 400     | "Domínio não autorizado"      |
| 409     | "Email já cadastrado"          |
| 429     | "Limite de tentativas excedido" |

---

### 1.4 Primeiro Acesso - Step 2: Validação Token (`/signup/verify`)

| Aspecto                | Especificação                  |
| ---------------------- | -------------------------------- |
| **Objetivo**     | Validar token recebido por email |
| **Query Params** | `?token={TOKEN}`               |

**Componentes:**

- Input (código/token - ou leitura automática via query param)
- Timer (tempo de expiração restante)
- Button ("Reenviar código")
- Text (mensagem de validação)

**API Route:**

```
POST /api/auth/magic-link/verify
```

| Campo     | Tipo   | Validação                                  |
| --------- | ------ | -------------------------------------------- |
| `token` | string | Token válido, não expirado, não utilizado |

**Response (200):**

```json
{
  "valid": true,
  "email": "user@empresa.com",
  "tenant_id": "uuid",
  "tenant_name": "Empresa X"
}
```

**Fluxo:**

- Token válido → `/signup/complete?token={TOKEN}`
- Token expirado → Opção de solicitar novo

---

### 1.5 Primeiro Acesso - Step 3: Completar Cadastro (`/signup/complete`)

| Aspecto                | Especificação                             |
| ---------------------- | ------------------------------------------- |
| **Objetivo**     | Coletar dados do funcionário e criar conta |
| **Query Params** | `?token={TOKEN}`                          |

**Componentes:**

- FormField (nome completo)
- FormField (telefone)
- FormField (senha) com indicador de força
- FormField (confirmação de senha)
- Checkbox (aceite de termos)
- Button ("Finalizar Cadastro")

**API Route:**

```
POST /api/auth/complete-signup
```

| Campo         | Tipo   | Validação                            |
| ------------- | ------ | -------------------------------------- |
| `token`     | string | Token ainda válido                    |
| `full_name` | string | Mínimo 3 caracteres                   |
| `phone`     | string | Formato telefone brasileiro            |
| `password`  | string | Mínimo 8 chars, 1 número, 1 especial |

**Lógica Backend:**

1. Validar token ainda válido
2. Consumir token (marcar como usado)
3. Criar User com role EMPLOYEE
4. Vincular ao tenant do token
5. Hash da senha com bcrypt (cost 12)
6. Enviar email de boas-vindas

**Response (201):**

```json
{
  "success": true,
  "user_id": "uuid",
  "message": "Cadastro concluído com sucesso!"
}
```

**Fluxo Pós-Sucesso:**

- Redirect → `/login` com toast "Cadastro concluído! Faça login"

---

### 1.6 Recuperação de Senha (`/forgot-password`)

| Aspecto            | Especificação         |
| ------------------ | ----------------------- |
| **Objetivo** | Permitir reset de senha |

**API Routes:**

```
POST /api/auth/forgot-password
```

| Campo     | Tipo   |
| --------- | ------ |
| `email` | string |

```
POST /api/auth/reset-password
```

| Campo            | Tipo   |
| ---------------- | ------ |
| `token`        | string |
| `new_password` | string |

**Fluxo:**

1. Usuário insere email → sistema envia link
2. Link direciona para `/reset-password?token={TOKEN}`
3. Usuário define nova senha → redirect `/login`

---

## 2. FUNCIONÁRIO (EMPLOYEE)

### 2.1 Dashboard do Funcionário (`/employee/dashboard`)

| Aspecto              | Especificação                                 |
| -------------------- | ----------------------------------------------- |
| **Objetivo**   | Visão geral de agendamentos e ações rápidas |
| **Tipo**       | Server Component + Client Islands               |
| **Layout**     | DashboardLayout                                 |
| **Permissão** | `role: EMPLOYEE`                              |

**Componentes:**

- Text (Boas-vindas personalizadas)
- AppointmentCard (Próximo Agendamento - destaque)
- DataList (Agendamentos futuros - próximos 5)
- Button CTA ("Agendar Nova Sessão")
- StatsCard (Total de sessões, última sessão)
- NotificationList (alertas, cancelamentos, lembretes)

**API Route:**

```
GET /api/employee/dashboard
```

**Response:**

```json
{
  "user": { "name": "João Silva" },
  "next_appointment": {
    "id": "uuid",
    "date": "2026-02-05",
    "time": "10:00",
    "program": "Massagem Relaxante",
    "therapist": "Maria Santos",
    "location": "Sede Centro"
  },
  "upcoming_appointments": [...],
  "stats": {
    "total_sessions": 12,
    "last_session": "2026-01-28",
    "attendance_rate": 0.92
  },
  "notifications": [...]
}
```

**Fluxo de Navegação:**

- Click "Agendar" → `/employee/appointments/new`
- Click em agendamento → `/employee/appointments/{id}`
- Menu lateral → outras páginas

---

### 2.2 Novo Agendamento - Wizard

O fluxo de agendamento é um wizard de 4 steps:

#### Step 1: Escolher Modalidade (`/employee/appointments/new`)

**API Route:**

```
GET /api/employee/programs/available
```

**Response:**

```json
{
  "programs": [
    {
      "id": "uuid",
      "name": "Massagem Relaxante",
      "description": "Sessão de 30 minutos de massagem relaxante",
      "duration_minutes": 30,
      "category": "massagem"
    }
  ]
}
```

**Componentes:**

- Grid de ProgramCard (modalidades disponíveis)
- Filter (por categoria)

**Navegação:** Selecionar → `/employee/appointments/new/select-date?program={ID}`

---

#### Step 2: Escolher Data e Local (`/employee/appointments/new/select-date`)

**API Routes:**

```
GET /api/employee/locations
```

```
GET /api/employee/availability/dates?program_id={ID}&location_id={ID}
```

**Response (dates):**

```json
{
  "available_dates": ["2026-02-05", "2026-02-06", "2026-02-10"]
}
```

**Componentes:**

- Select (localização)
- Calendar (dias disponíveis destacados, indisponíveis desabilitados)
- Legend (status dos dias)

**Navegação:** Selecionar data → `/employee/appointments/new/select-time?program={ID}&location={ID}&date={DATE}`

---

#### Step 3: Escolher Horário e Terapeuta (`/employee/appointments/new/select-time`)

**API Route:**

```
GET /api/employee/availability/slots?program_id={ID}&location_id={ID}&date={DATE}
```

**Response:**

```json
{
  "slots": [
    {
      "time": "09:00",
      "available_spots": 2,
      "therapists": [
        {
          "id": "uuid",
          "name": "Maria Santos",
          "photo_url": "/avatars/maria.jpg",
          "specialties": ["relaxante", "shiatsu"],
          "rating": 4.8
        }
      ]
    }
  ]
}
```

**Componentes:**

- TimeSlotList (horários disponíveis)
- TherapistCard (para cada horário)
- Radio ("Sem preferência de terapeuta")
- Badge (vagas restantes)

**Navegação:** Selecionar → `/employee/appointments/new/confirm`

---

#### Step 4: Confirmação (`/employee/appointments/new/confirm`)

**API Route:**

```
POST /api/employee/appointments
```

**Request:**

```json
{
  "program_id": "uuid",
  "location_id": "uuid",
  "therapist_id": "uuid | null",
  "date": "2026-02-05",
  "time": "10:00"
}
```

**Validações Backend:**

1. ✓ Vaga ainda disponível (race condition check com lock otimista)
2. ✓ Funcionário não tem agendamento no mesmo dia
3. ✓ Horário não passou
4. ✓ Antecedência mínima (ex: 2 horas)
5. ✓ Funcionário não está bloqueado (por no-shows)

**Response (201):**

```json
{
  "appointment": {
    "id": "uuid",
    "confirmation_code": "MQV-2026-ABC123",
    "date": "2026-02-05",
    "time": "10:00",
    "end_time": "10:30",
    "program": "Massagem Relaxante",
    "therapist": "Maria Santos",
    "location": "Sede Centro"
  }
}
```

**Ações Pós-Criação:**

- Criar appointment no banco
- Atualizar availability (decrementar vaga)
- Registrar log de auditoria
- Enviar email ao funcionário (confirmação)
- Enviar notificação ao terapeuta

**Erros:**

| Código | Cenário                               |
| ------- | -------------------------------------- |
| 409     | Vaga não disponível (race condition) |
| 400     | Já possui agendamento no dia          |
| 403     | Funcionário bloqueado                 |

**Navegação Sucesso:** `/employee/appointments/{ID}` com toast de confirmação

---

### 2.3 Detalhes do Agendamento (`/employee/appointments/[id]`)

**API Route:**

```
GET /api/employee/appointments/{id}
```

**Componentes:**

- Badge (status: Confirmado/Cancelado/Concluído)
- AppointmentDetailCard (todos os detalhes)
- Text (código de confirmação)
- Button ("Adicionar ao Calendário") - download .ics
- Button ("Cancelar Agendamento") - condicional
- TherapistInfo (dados do terapeuta)

**Cancelamento:**

```
DELETE /api/employee/appointments/{id}
```

**Validações de Cancelamento:**

- Prazo mínimo (ex: 4 horas de antecedência)
- Registro de motivo opcional
- Atualização de availability
- Notificação ao terapeuta

---

### 2.4 Meus Agendamentos (`/employee/appointments`)

**API Route:**

```
GET /api/employee/appointments?status={upcoming|completed|cancelled}&page=1&limit=10
```

**Componentes:**

- Tabs ("Próximos" / "Histórico")
- AppointmentList (cards de agendamentos)
- Filter (data, modalidade, status)
- Pagination
- EmptyState (quando sem dados)

---

### 2.5 Perfil do Funcionário (`/employee/profile`)

**API Routes:**

```
GET /api/employee/profile
PATCH /api/employee/profile
POST /api/employee/change-password
```

**Componentes:**

- FormSection (Dados Pessoais: nome, telefone, foto)
- FormSection (Segurança: alterar senha)
- FormSection (Notificações: preferências)
- StatsCard (estatísticas pessoais)

---

## 3. TERAPEUTA (THERAPIST)

### 3.1 Calendário do Terapeuta (`/therapist/calendar`)

| Aspecto              | Especificação                                     |
| -------------------- | --------------------------------------------------- |
| **Objetivo**   | Visão geral de agendamentos em formato calendário |
| **Tipo**       | Client Component (interativo)                       |
| **Layout**     | DashboardLayout                                     |
| **Permissão** | `role: THERAPIST`                                 |

**API Route:**

```
GET /api/therapist/appointments?view={day|week|month}&date=2026-02&tenant_id={ID}&location_id={ID}
```

**Response:**

```json
{
  "appointments": [
    {
      "id": "uuid",
      "start_time": "2026-02-03T10:00:00",
      "end_time": "2026-02-03T10:30:00",
      "employee_name": "João Silva",
      "program": "Massagem Relaxante",
      "status": "CONFIRMED",
      "tenant": "Empresa X",
      "location": "Sede Centro"
    }
  ],
  "summary": {
    "total": 8,
    "completed": 3,
    "pending": 4,
    "no_shows": 1
  }
}
```

**Componentes:**

- Calendar (visualização dia/semana/mês)
- Filter (empresa, localização, modalidade, status)
- AppointmentEvent (cada agendamento no calendário)
- Sidebar (resumo do dia)
- Modal (detalhes ao clicar em evento)

**Cores por Status:**

| Status    | Cor             |
| --------- | --------------- |
| CONFIRMED | Verde           |
| PENDING   | Amarelo         |
| COMPLETED | Cinza           |
| CANCELLED | Vermelho        |
| NO_SHOW   | Vermelho escuro |

---

### 3.2 Registrar Presença (Modal ou `/therapist/appointments/[id]`)

**API Route:**

```
PATCH /api/therapist/appointments/{id}/check-in
```

**Request:**

```json
{
  "status": "PRESENT | NO_SHOW | LATE",
  "notes": "Observação opcional",
  "delay_minutes": 10
}
```

**Validações:**

1. Agendamento pertence ao terapeuta logado
2. Horário já passou ou está em tolerância
3. Não foi alterado nas últimas 24h

**Lógica de No-Show:**

1. Atualizar status do appointment
2. Incrementar contador de no-shows do funcionário
3. Se no-shows >= 3: bloquear funcionário por 15 dias
4. Notificar empresa (tenant_admin)
5. Enviar notificação ao funcionário

---

### 3.3 Lista do Dia (`/therapist/daily`)

**API Route:**

```
GET /api/therapist/daily?date=2026-02-03
```

**Componentes:**

- DateSelector
- AppointmentTimeline (lista cronológica)
- QuickAction (marcar presença inline)
- DaySummary (resumo no topo)

---

### 3.4 Configurar Disponibilidade (`/therapist/availability`)

**API Routes:**

```
GET /api/therapist/availability?tenant_id={ID}&location_id={ID}
PUT /api/therapist/availability
```

**Request (PUT):**

```json
{
  "tenant_id": "uuid",
  "location_id": "uuid",
  "weekly_schedule": {
    "monday": [
      { "start": "09:00", "end": "12:00" },
      { "start": "14:00", "end": "18:00" }
    ],
    "tuesday": [{ "start": "09:00", "end": "18:00" }]
  },
  "exceptions": [
    { "date": "2026-02-10", "available": false, "reason": "Férias" }
  ]
}
```

**Componentes:**

- TenantLocationSelector
- WeeklyScheduleGrid (grade semanal)
- ExceptionsList (datas específicas)
- ConflictWarning (validação)

---

### 3.5 Histórico de Atendimentos (`/therapist/history`)

**API Route:**

```
GET /api/therapist/history?from=2026-01-01&to=2026-02-03&page=1
```

**Componentes:**

- FilterPanel (período, tenant, localização, modalidade, status)
- DataTable (lista paginada)
- StatsCards (total, taxa de no-show, avaliação)
- ExportButton (PDF/Excel)
- PerformanceChart (atendimentos por mês)

---

### 3.6 Perfil do Terapeuta (`/therapist/profile`)

**Seções:**

- Dados Pessoais (nome, email, telefone, foto)
- Especialidades (lista editável)
- Certificações (upload de documentos)
- Vinculações (empresas e locais - somente visualização)
- Segurança (alterar senha)

---

## 4. ADMINISTRADOR DE TENANT (TENANT_ADMIN)

### 4.1 Dashboard do Tenant Admin (`/tenant-admin/dashboard`)

| Aspecto              | Especificação                         |
| -------------------- | --------------------------------------- |
| **Objetivo**   | Visão executiva de métricas do tenant |
| **Permissão** | `role: TENANT_ADMIN`                  |

**API Route:**

```
GET /api/tenant-admin/dashboard
```

**Response:**

```json
{
  "kpis": {
    "total_employees": 150,
    "total_appointments_month": 87,
    "utilization_rate": 0.72,
    "no_show_rate": 0.08,
    "upcoming_today": 5,
    "upcoming_week": 23
  },
  "charts": {
    "appointments_by_program": [...],
    "appointments_timeline": [...],
    "utilization_by_location": [...],
    "top_users": [...]
  },
  "recent_activity": [...]
}
```

**Componentes:**

- StatsCardGrid (KPIs principais)
- PieChart (agendamentos por modalidade)
- LineChart (agendamentos por período)
- BarChart (utilização por localização)
- TopUsersList
- NotificationList (alertas)
- QuickActions (Gerenciar Funcionários, Ver Relatório, Exportar)

---

### 4.2 Gerenciar Funcionários (`/tenant-admin/employees`)

**API Routes:**

```
GET /api/tenant-admin/employees?page=1&search=joao&status=active
POST /api/tenant-admin/employees
PATCH /api/tenant-admin/employees/{id}/toggle-status
POST /api/tenant-admin/employees/{id}/reset-password
```

**Componentes:**

- SearchBar
- Filter (status)
- DataTable (nome, email, telefone, status, último acesso)
- RowActions (ver, editar, ativar/desativar, resetar senha)
- Button ("Adicionar Funcionário")
- ExportButton (CSV)
- Pagination

---

### 4.3 Cadastrar Funcionário (`/tenant-admin/employees/new`)

**API Route:**

```
POST /api/tenant-admin/employees
```

**Request:**

```json
{
  "full_name": "Maria Silva",
  "email": "maria@empresa.com",
  "phone": "11999999999",
  "send_welcome_email": true
}
```

**Validações:**

- Email tem domínio do tenant
- Email não cadastrado

---

### 4.4 Relatórios e Análises (`/tenant-admin/reports`)

**API Routes:**

```
GET /api/tenant-admin/reports/monthly?month=2026-02
POST /api/tenant-admin/reports/generate-pdf
POST /api/tenant-admin/reports/schedule-email
```

**Tipos de Relatório:**

- Resumo Mensal
- Utilização por Funcionário
- Utilização por Modalidade
- Taxa de No-Show
- Comparativo Mensal

**Componentes:**

- ReportTypeSelector
- FilterPanel (período, localização)
- ReportViewer (tabelas e gráficos)
- Button ("Gerar PDF")
- Button ("Enviar por Email")
- ScheduleModal (envio recorrente)

---

### 4.5 Configurações do Tenant (`/tenant-admin/settings`)

**API Routes:**

```
GET /api/tenant-admin/settings
PATCH /api/tenant-admin/settings
```

**Seções:**

- Dados da Empresa (nome, logo, domínios)
- Localizações (lista - somente visualização)
- Notificações (preferências de emails)
- Políticas (antecedência mínima, limite de no-shows)

---

## 5. SUPER ADMINISTRADOR (SUPER_ADMIN)

### 5.1 Dashboard Global (`/admin/dashboard`)

| Aspecto              | Especificação                         |
| -------------------- | --------------------------------------- |
| **Objetivo**   | Visão consolidada de toda a plataforma |
| **Permissão** | `role: SUPER_ADMIN`                   |

**API Route:**

```
GET /api/admin/dashboard
```

**Response:**

```json
{
  "global_kpis": {
    "total_tenants": 12,
    "total_employees": 1500,
    "total_therapists": 45,
    "total_appointments_month": 890,
    "utilization_rate": 0.68
  },
  "charts": {
    "user_growth": [...],
    "appointments_by_tenant": [...],
    "geographic_distribution": [...]
  },
  "recent_tenants": [...],
  "alerts": [...]
}
```

**Componentes:**

- GlobalStatsGrid (KPIs)
- LineChart (crescimento de usuários)
- BarChart (agendamentos por tenant)
- MapChart (distribuição geográfica - opcional)
- SystemStatusCard (uptime, erros)
- TenantAlertsList
- QuickActions (Criar Tenant, Cadastrar Terapeuta, Ver Logs)

---

### 5.2 Gerenciar Tenants (`/admin/tenants`)

**API Routes:**

```
GET /api/admin/tenants?page=1&status=active
POST /api/admin/tenants
PATCH /api/admin/tenants/{id}/toggle-status
```

**Componentes:**

- SearchBar
- Filter (status)
- DataTable (nome, domínios, status, funcionários, agendamentos)
- RowActions (ver, editar, ativar/desativar)
- Button ("Criar Novo Tenant")
- Pagination

---

### 5.3 Criar Novo Tenant (`/admin/tenants/new`) - Wizard

**Steps:**

1. **Dados da Empresa**

   - Nome, CNPJ, endereço matriz
2. **Domínios de Email**

   - Lista de domínios autorizados
3. **Localizações**

   - Adicionar sedes
4. **Administrador Tenant**

   - Nome, email, telefone do primeiro TENANT_ADMIN
5. **Programas Contratados**

   - Selecionar modalidades disponíveis

**API Route:**

```
POST /api/admin/tenants
```

**Request:**

```json
{
  "company_data": {
    "name": "Empresa X",
    "cnpj": "12.345.678/0001-90",
    "address": {...}
  },
  "domains": ["empresa.com.br", "empresa.com"],
  "locations": [
    {"name": "Sede Centro", "address": {...}}
  ],
  "admin": {
    "name": "Admin da Empresa",
    "email": "admin@empresa.com",
    "phone": "11999999999"
  },
  "programs": ["uuid-programa-1", "uuid-programa-2"]
}
```

**Lógica Backend (Transação Atômica):**

1. Criar tenant
2. Criar domínios associados
3. Criar locations
4. Criar user com role TENANT_ADMIN
5. Vincular programs
6. Enviar email para admin com credenciais
7. Commit (ou rollback se falhar)

---

### 5.4 Detalhes do Tenant (`/admin/tenants/[id]`)

**Tabs:**

- **Visão Geral**: dados, estatísticas, status
- **Localizações**: CRUD de sedes
- **Funcionários**: lista com ações
- **Programas**: modalidades contratadas
- **Terapeutas Vinculados**: lista de terapeutas
- **Histórico de Agendamentos**: todos os appointments
- **Configurações**: políticas, limites

---

### 5.5 Gerenciar Terapeutas (`/admin/therapists`)

**API Routes:**

```
GET /api/admin/therapists?page=1&status=active&specialty=relaxante
POST /api/admin/therapists
```

**Componentes:**

- SearchBar
- Filter (status, especialidade, tenant vinculado)
- DataTable (nome, email, especialidades, status, tenants)
- RowActions (ver, editar, ativar/desativar)
- Button ("Cadastrar Terapeuta")
- Pagination

---

### 5.6 Cadastrar Terapeuta (`/admin/therapists/new`)

**API Route:**

```
POST /api/admin/therapists
```

**Request:**

```json
{
  "full_name": "Maria Santos",
  "email": "maria@terapeuta.com",
  "phone": "11999999999",
  "cpf": "123.456.789-00",
  "specialties": ["relaxante", "shiatsu", "quick massage"],
  "send_welcome_email": true
}
```

**Validações:**

- Email único
- CPF único e válido
- Especialidades existentes

---

### 5.7 Gerenciar Vinculações (`/admin/therapists/[id]/links`)

**API Routes:**

```
GET /api/admin/therapists/{id}/links
POST /api/admin/therapists/{id}/links
DELETE /api/admin/therapists/{id}/links/{link_id}
```

**Request (POST):**

```json
{
  "tenant_id": "uuid",
  "location_id": "uuid"
}
```

**Validações para DELETE:**

- Verificar agendamentos futuros
- Solicitar confirmação se houver

---

### 5.8 Gerenciar Programas/Modalidades (`/admin/programs`)

**API Routes:**

```
GET /api/admin/programs
POST /api/admin/programs
PATCH /api/admin/programs/{id}
DELETE /api/admin/programs/{id}
```

**Request (POST):**

```json
{
  "name": "Massagem Relaxante",
  "description": "Sessão de 30 minutos de massagem relaxante",
  "duration_minutes": 30,
  "category": "massagem"
}
```

---

### 5.9 Logs e Auditoria (`/admin/logs`)

**API Route:**

```
GET /api/admin/logs?page=1&action_type=create&from=2026-02-01
```

**Componentes:**

- FilterPanel (tipo de ação, usuário, período, recurso)
- SearchBar (texto livre)
- DataTable (timestamp, usuário, ação, recurso, detalhes)
- Pagination
- ExportButton

---

### 5.10 Configurações Globais (`/admin/settings`)

**Seções:**

- Email Templates
- Políticas Padrão (antecedência, no-shows, limites)
- Notificações (configurações de envio)
- Integrations (APIs externas, webhooks)
- Segurança (regras de senha, sessão, rate limiting)

---

# Parte VI: Componentes Compartilhados

## Atoms (Componentes Básicos)

| Componente   | Props                                            | Variantes                         |
| ------------ | ------------------------------------------------ | --------------------------------- |
| `Button`   | `variant`, `size`, `disabled`, `loading` | primary, secondary, danger, ghost |
| `Input`    | `type`, `error`, `disabled`                | text, email, password, tel        |
| `Select`   | `options`, `placeholder`                     | -                                 |
| `Checkbox` | `checked`, `label`                           | -                                 |
| `Radio`    | `checked`, `label`, `name`                 | -                                 |
| `Switch`   | `checked`, `label`                           | -                                 |
| `Badge`    | `variant`, `text`                            | success, warning, error, info     |
| `Avatar`   | `src`, `name`, `size`                      | sm, md, lg                        |
| `Spinner`  | `size`                                         | sm, md, lg                        |
| `Icon`     | `name`, `size`                               | (biblioteca Lucide)               |
| `Text`     | `variant`, `as`                              | h1-h6, p, span                    |

## Molecules (Combinações Simples)

| Componente     | Composição                             |
| -------------- | ---------------------------------------- |
| `FormField`  | Label + Input + ErrorMessage             |
| `Card`       | Container com shadow e padding           |
| `Modal`      | Overlay + conteúdo centralizado         |
| `Dropdown`   | Select + opções customizadas           |
| `DatePicker` | Input + Calendar popup                   |
| `TimePicker` | Input + Time selector                    |
| `SearchBar`  | Input + Icon de busca                    |
| `Pagination` | Buttons de navegação + info de página |
| `EmptyState` | Icon + mensagem + ação                 |
| `Toast`      | Icon + mensagem + close button           |

## Organisms (Componentes Complexos)

| Componente          | Descrição                                           |
| ------------------- | ----------------------------------------------------- |
| `Navbar`          | Navegação principal com logo, menu, perfil          |
| `Sidebar`         | Menu lateral com navegação por role                 |
| `Calendar`        | Calendário interativo (agendamentos/disponibilidade) |
| `AppointmentCard` | Card com detalhes completos de agendamento            |
| `TherapistCard`   | Card de terapeuta com foto, info, ações             |
| `DataTable`       | Tabela com sort, filter, pagination                   |
| `StatsCard`       | Card de KPI com valor e mini gráfico                 |
| `FilterPanel`     | Painel de filtros avançados                          |
| `Chart`           | Wrapper para gráficos (Recharts)                     |

## Templates (Layouts)

| Layout              | Uso                                            |
| ------------------- | ---------------------------------------------- |
| `AuthLayout`      | Páginas de login/signup (sem navegação)     |
| `DashboardLayout` | Páginas internas (navbar + sidebar + content) |
| `EmptyLayout`     | Páginas simples (sem sidebar)                 |

---

# Parte VII: API Routes e Endpoints

## Estrutura de Organização

```
/src/main/java/com/maratona/wellnesshub/
├── auth/
│   ├── controller/
│   │   └── AuthController.java
│   ├── service/
│   │   └── AuthService.java
│   └── dto/
├── tenant/
│   ├── controller/
│   ├── service/
│   └── dto/
├── employee/
├── therapist/
├── program/
├── location/
├── availability/
├── appointment/
└── report/
```

## Mapeamento de Endpoints

### Autenticação (`/api/auth`)

| Método | Endpoint                | Descrição                       |
| ------- | ----------------------- | --------------------------------- |
| POST    | `/magic-link/request` | Solicitar token (funcionário)    |
| POST    | `/magic-link/verify`  | Validar token                     |
| POST    | `/login`              | Login com senha (terapeuta/admin) |
| POST    | `/logout`             | Invalidar sessão                 |
| POST    | `/complete-signup`    | Completar cadastro                |
| POST    | `/forgot-password`    | Solicitar reset                   |
| POST    | `/reset-password`     | Redefinir senha                   |
| GET     | `/me`                 | Perfil do usuário logado         |

### Funcionário (`/api/employee`)

| Método | Endpoint                | Descrição              |
| ------- | ----------------------- | ------------------------ |
| GET     | `/dashboard`          | Dados do dashboard       |
| GET     | `/appointments`       | Lista de agendamentos    |
| POST    | `/appointments`       | Criar agendamento        |
| GET     | `/appointments/{id}`  | Detalhes do agendamento  |
| DELETE  | `/appointments/{id}`  | Cancelar agendamento     |
| GET     | `/programs/available` | Programas disponíveis   |
| GET     | `/locations`          | Localizações do tenant |
| GET     | `/availability/dates` | Datas disponíveis       |
| GET     | `/availability/slots` | Horários e terapeutas   |
| GET     | `/profile`            | Perfil do funcionário   |
| PATCH   | `/profile`            | Atualizar perfil         |
| POST    | `/change-password`    | Alterar senha            |

### Terapeuta (`/api/therapist`)

| Método | Endpoint                        | Descrição                 |
| ------- | ------------------------------- | --------------------------- |
| GET     | `/appointments`               | Agendamentos (calendário)  |
| GET     | `/appointments/{id}`          | Detalhes do agendamento     |
| PATCH   | `/appointments/{id}/check-in` | Registrar presença         |
| POST    | `/appointments/{id}/notes`    | Adicionar observação      |
| GET     | `/daily`                      | Agendamentos do dia         |
| GET     | `/availability`               | Disponibilidade configurada |
| PUT     | `/availability`               | Atualizar disponibilidade   |
| GET     | `/history`                    | Histórico de atendimentos  |
| GET     | `/profile`                    | Perfil do terapeuta         |
| PATCH   | `/profile`                    | Atualizar perfil            |

### Tenant Admin (`/api/tenant-admin`)

| Método | Endpoint                           | Descrição               |
| ------- | ---------------------------------- | ------------------------- |
| GET     | `/dashboard`                     | Métricas do tenant       |
| GET     | `/employees`                     | Lista de funcionários    |
| POST    | `/employees`                     | Cadastrar funcionário    |
| GET     | `/employees/{id}`                | Detalhes do funcionário  |
| PATCH   | `/employees/{id}`                | Atualizar funcionário    |
| PATCH   | `/employees/{id}/toggle-status`  | Ativar/desativar          |
| POST    | `/employees/{id}/reset-password` | Resetar senha             |
| GET     | `/reports/monthly`               | Relatório mensal         |
| POST    | `/reports/generate-pdf`          | Gerar PDF                 |
| POST    | `/reports/schedule-email`        | Agendar envio             |
| GET     | `/settings`                      | Configurações do tenant |
| PATCH   | `/settings`                      | Atualizar configurações |
| GET     | `/profile`                       | Perfil do admin           |
| PATCH   | `/profile`                       | Atualizar perfil          |

### Super Admin (`/api/admin`)

| Método | Endpoint                            | Descrição               |
| ------- | ----------------------------------- | ------------------------- |
| GET     | `/dashboard`                      | Métricas globais         |
| GET     | `/tenants`                        | Lista de tenants          |
| POST    | `/tenants`                        | Criar tenant              |
| GET     | `/tenants/{id}`                   | Detalhes do tenant        |
| PATCH   | `/tenants/{id}`                   | Atualizar tenant          |
| DELETE  | `/tenants/{id}`                   | Remover tenant (soft)     |
| PATCH   | `/tenants/{id}/toggle-status`     | Ativar/desativar          |
| POST    | `/tenants/{id}/locations`         | Criar localização       |
| PATCH   | `/locations/{id}`                 | Atualizar localização   |
| DELETE  | `/locations/{id}`                 | Remover localização     |
| GET     | `/therapists`                     | Lista de terapeutas       |
| POST    | `/therapists`                     | Cadastrar terapeuta       |
| GET     | `/therapists/{id}`                | Detalhes do terapeuta     |
| PATCH   | `/therapists/{id}`                | Atualizar terapeuta       |
| DELETE  | `/therapists/{id}`                | Remover terapeuta (soft)  |
| GET     | `/therapists/{id}/links`          | Vinculações             |
| POST    | `/therapists/{id}/links`          | Criar vinculação        |
| DELETE  | `/therapists/{id}/links/{linkId}` | Remover vinculação      |
| GET     | `/programs`                       | Lista de programas        |
| POST    | `/programs`                       | Criar programa            |
| PATCH   | `/programs/{id}`                  | Atualizar programa        |
| DELETE  | `/programs/{id}`                  | Remover programa          |
| GET     | `/logs`                           | Logs de auditoria         |
| GET     | `/settings`                       | Configurações globais   |
| PATCH   | `/settings`                       | Atualizar configurações |

---

# Parte VIII: Segurança e Multi-Tenancy

## Autenticação

| Aspecto                 | Implementação                        |
| ----------------------- | -------------------------------------- |
| **Mecanismo**     | JWT com Spring Security                |
| **TTL do Token**  | 30 minutos                             |
| **Refresh Token** | Implementar para manter sessão ativa  |
| **Rate Limiting** | 5 tentativas por minuto em `/auth/*` |

## Autorização

```java
// Middleware de validação de role
@PreAuthorize("hasRole('EMPLOYEE')")
@PreAuthorize("hasRole('TENANT_ADMIN') and #tenantId == authentication.principal.tenantId")
@PreAuthorize("hasRole('SUPER_ADMIN')")
```

## Isolamento Multi-Tenant

```java
// Filtro automático por tenant_id
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Appointment {
    // ...
}

// Em cada query (exceto SUPER_ADMIN)
entityManager.unwrap(Session.class)
    .enableFilter("tenantFilter")
    .setParameter("tenantId", currentUser.getTenantId());
```

## Validação de Ownership

```java
// Exemplo: funcionário só acessa seus próprios agendamentos
if (!appointment.getEmployeeId().equals(currentUser.getId())) {
    throw new ForbiddenException("Acesso negado");
}
```

## Proteções

| Proteção              | Implementação                       |
| ----------------------- | ------------------------------------- |
| **CSRF**          | Token em forms                        |
| **XSS**           | Sanitização de inputs               |
| **SQL Injection** | JPA/Hibernate com prepared statements |
| **Rate Limiting** | Bucket4j ou similar                   |
| **Password**      | bcrypt com cost 12                    |
| **Logs**          | Registrar tentativas suspeitas        |

---

# Parte IX: Roadmap de Implementação

## Fase 1: Fundação (Semanas 1-2)

- [ ] Setup Spring Boot + PostgreSQL + Security
- [ ] Configurar Prisma/JPA schema completo
- [ ] Implementar sistema de autenticação JWT
- [ ] Criar middleware de multi-tenancy
- [ ] Setup Next.js + Tailwind + TypeScript
- [ ] Criar componentes base (Atoms, Molecules)
- [ ] Implementar layouts principais (Auth, Dashboard)

## Fase 2: Módulo de Autenticação (Semana 3)

- [ ] Páginas: login, signup wizard, forgot-password
- [ ] API routes de autenticação
- [ ] Validação de domínio e tokens magic link
- [ ] Configurar serviço de email (SendGrid/SES)
- [ ] Testes de integração de auth

## Fase 3: Módulo Funcionário (Semanas 4-5)

- [ ] Dashboard do funcionário
- [ ] Wizard de agendamento (4 steps)
- [ ] Lista e detalhes de agendamentos
- [ ] Cancelamento com validações
- [ ] Perfil do funcionário
- [ ] API routes correspondentes
- [ ] Testes de fluxo de agendamento

## Fase 4: Módulo Terapeuta (Semana 6)

- [ ] Calendário de agendamentos
- [ ] Detalhes com check-in
- [ ] Configuração de disponibilidade
- [ ] Histórico de atendimentos
- [ ] Perfil do terapeuta
- [ ] API routes correspondentes

## Fase 5: Módulo Tenant Admin (Semanas 7-8)

- [ ] Dashboard com métricas
- [ ] CRUD de funcionários
- [ ] Geração de relatórios
- [ ] Export para PDF
- [ ] Configurações do tenant
- [ ] API routes correspondentes

## Fase 6: Módulo Super Admin (Semanas 9-10)

- [ ] Dashboard global
- [ ] CRUD de tenants (wizard)
- [ ] CRUD de terapeutas
- [ ] Gerenciamento de vinculações
- [ ] CRUD de programas
- [ ] Logs e auditoria
- [ ] Configurações globais
- [ ] API routes correspondentes

## Fase 7: Refinamento (Semanas 11-12)

- [ ] Otimização de performance (caching, lazy loading)
- [ ] Testes unitários e de integração
- [ ] Melhorias de UX/UI
- [ ] Acessibilidade (WCAG 2.1 AA)
- [ ] Responsividade mobile
- [ ] Documentação Swagger/OpenAPI

## Fase 8: Deploy e Monitoramento (Semana 13)

- [ ] Configurar CI/CD
- [ ] Deploy em produção
- [ ] Configurar monitoring (Sentry, etc.)
- [ ] Configurar backups de banco
- [ ] Testes de carga
- [ ] Documentação final

---

## Métricas de Sucesso

| Métrica                                       | Target             |
| ---------------------------------------------- | ------------------ |
| **Performance (LCP)**                    | < 3s               |
| **Interatividade (FID)**                 | < 100ms            |
| **Disponibilidade**                      | > 99.5%            |
| **Taxa de conclusão de agendamento**    | > 85%              |
| **Incidentes de vazamento cross-tenant** | Zero               |
| **Adoção (funcionários por tenant)**  | > 70% após 1 mês |

---

# User Stories Detalhadas
