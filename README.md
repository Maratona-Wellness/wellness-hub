# Maratona QV - Wellness Hub

Plataforma SaaS multi-tenant para agendamento de serviços de bem-estar corporativo.

## 🎯 Visão Geral

O Wellness Hub permite que empresas (tenants) ofereçam aos seus colaboradores acesso a serviços como:

- Quick Massage
- Auriculoterapia
- Ginástica Laboral
- Outros programas de bem-estar

## 🏗️ Arquitetura

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript 5.3
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.10
- **Autenticação**: NextAuth.js 4.24
- **Estilização**: Tailwind CSS 3.4

Para detalhes arquiteturais, consulte a pasta [docs/architecture](./docs/architecture/).

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

## 🚀 Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd wellness-hub

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Execute as migrations do banco
npm run db:push

# Popule o banco com dados de teste
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🔧 Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wellness_hub"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
SMTP_HOST="smtp.exemplo.com"
SMTP_PORT=587
SMTP_USER="seu-email"
SMTP_PASS="sua-senha"
SMTP_FROM="noreply@maratonaqv.com.br"
```

## 🧪 Credenciais de Teste

Após executar o seed, use:

| Role         | Email                    | Senha       |
| ------------ | ------------------------ | ----------- |
| Super Admin  | admin@maratonaqv.com.br  | password123 |
| Tenant Admin | admin@demo.com           | password123 |
| Terapeuta    | maria.terapeuta@demo.com | password123 |
| Terapeuta    | joao.terapeuta@demo.com  | password123 |
| Colaborador  | funcionario1@demo.com    | password123 |
| Colaborador  | funcionario2@demo.com    | password123 |

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (pages e API routes)
│   ├── (auth)/             # Páginas de autenticação
│   ├── (dashboard)/        # Páginas do dashboard
│   └── api/                # API Routes
├── components/             # Componentes React
│   ├── ui/                 # Design System (Atomic Design)
│   ├── layouts/            # Layouts reutilizáveis
│   └── dashboards/         # Dashboards por role
├── lib/                    # Utilitários e configurações
│   ├── auth.ts             # Configuração NextAuth
│   ├── prisma.ts           # Cliente Prisma
│   ├── email.ts            # Envio de emails
│   └── utils.ts            # Funções utilitárias
└── types/                  # Tipos TypeScript
```

## 👥 Roles de Usuário

| Role         | Descrição           | Acesso                                            |
| ------------ | ------------------- | ------------------------------------------------- |
| EMPLOYEE     | Colaborador         | Agendar e gerenciar próprios agendamentos         |
| THERAPIST    | Terapeuta           | Ver agenda, confirmar check-ins                   |
| TENANT_ADMIN | Admin da empresa    | Gerenciar usuários, programas, locais, relatórios |
| SUPER_ADMIN  | Admin da plataforma | Gerenciar todos os tenants                        |

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Linting
npm run db:generate  # Gera cliente Prisma
npm run db:push      # Push schema para o banco
npm run db:migrate   # Cria migration
npm run db:seed      # Popula banco com dados de teste
npm run db:studio    # Abre Prisma Studio
```

## 🔒 Segurança

- Senhas hasheadas com bcrypt (12 rounds)
- Sessões JWT com expiração de 30 minutos
- Isolamento de dados por tenant
- Validação de domínio de email no cadastro
- Proteção CSRF built-in

## 📄 Licença

Proprietary - Maratona Qualidade de Vida
