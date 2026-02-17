# ADR-001: Next.js Monolith Architecture

## Status

Accepted

## Date

2024-01-15

## Context

O projeto Maratona QV Wellness Hub precisa de uma arquitetura que:

- Suporte multi-tenancy com isolamento de dados
- Seja escalável para múltiplas organizações (tenants)
- Tenha baixo custo inicial de desenvolvimento e operação
- Permita desenvolvimento ágil por uma equipe pequena

A especificação original do PRD sugeria uma arquitetura separada (Java Spring Boot para backend, Next.js para frontend), porém o usuário solicitou um monólito em Next.js.

## Decision Drivers

- **Time to Market**: Necessidade de entrega rápida
- **Tamanho da Equipe**: Equipe pequena, precisa minimizar complexidade
- **Custo Operacional**: Budget inicial limitado
- **Escalabilidade**: Precisa suportar crescimento gradual

## Considered Options

### Option 1: Microservices (Spring Boot + Next.js)

**Prós:**

- Separação clara de responsabilidades
- Escalabilidade independente de serviços
- Flexibilidade tecnológica

**Contras:**

- Maior complexidade operacional
- Custo de infraestrutura mais alto
- Overhead de comunicação entre serviços
- Necessidade de mais conhecimento da equipe

### Option 2: Next.js Monolith (Chosen)

**Prós:**

- Desenvolvimento mais rápido
- Menor custo de infraestrutura
- Codebase unificada
- Boa experiência de desenvolvimento
- Capacidades de SSR e API Routes nativas

**Contras:**

- Escalabilidade limitada inicialmente
- Todas as funcionalidades em um único deploy
- Potencial acoplamento entre domínios

### Option 3: Modular Monolith (Java)

**Prós:**

- Tipagem forte
- Ecossistema maduro para enterprise

**Contras:**

- Curva de aprendizado maior para frontend
- Necessidade de BFF ou API separada

## Decision

Adotar **Next.js 14+ como monólito fullstack** utilizando:

- **App Router** para rotas e layouts
- **API Routes** para endpoints REST
- **Prisma ORM** para acesso a dados
- **NextAuth.js** para autenticação
- **PostgreSQL** como banco de dados

## Consequences

### Positive

- Desenvolvimento mais ágil com uma única linguagem (TypeScript)
- Deploy simplificado (uma única aplicação)
- Menor custo de infraestrutura inicial
- Excelente DX (Developer Experience)
- SSR e performance otimizada nativamente

### Negative

- Necessidade de refatoração se escalar muito (>100k usuários ativos)
- Todas as APIs compartilham o mesmo processo Node.js
- Limitações de CPU-bound tasks (pode precisar de workers separados)

### Mitigations

1. **Estrutura modular interna** separando domínios em pastas
2. **Caching agressivo** com Redis (futuro) para reduzir carga
3. **API Rate Limiting** para proteger recursos
4. **Monitoramento** para identificar gargalos cedo
5. **Design preparado para extração** de serviços se necessário

## Technical Stack

| Layer      | Technology       | Justification                   |
| ---------- | ---------------- | ------------------------------- |
| Runtime    | Node.js 18+      | LTS, performance, ecosystem     |
| Framework  | Next.js 14+      | App Router, RSC, API Routes     |
| Language   | TypeScript 5.3   | Type safety, DX                 |
| ORM        | Prisma 5.10      | Type-safe queries, migrations   |
| Database   | PostgreSQL 15+   | ACID, JSON support, mature      |
| Auth       | NextAuth.js 4.24 | JWT, extensible, Next.js native |
| Styling    | Tailwind CSS 3.4 | Utility-first, performant       |
| Validation | Zod              | Runtime + static type inference |

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration)
