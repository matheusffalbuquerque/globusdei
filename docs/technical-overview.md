# Visão Técnica — GlobusDei Platform

> **Última atualização:** Abril de 2026

---

## 1. O que é a GlobusDei

A **GlobusDei** é uma agência missionária cristã interdenominacional brasileira que apoia iniciativas individuais e coletivas de evangelização global. A plataforma digital serve como o sistema de gestão central da organização, conectando colaboradores internos, agentes de missão, investidores e empreendimentos missionários ao redor do mundo.

---

## 2. Visão Geral da Arquitetura

A plataforma é um **monorepo Nx** com arquitetura de **microsserviços**, onde cada serviço tem responsabilidade bem delimitada. Todos os serviços compartilham tipos e utilitários via bibliotecas internas (`shared/`).

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENTES                                    │
│   web-platform (Next.js)       mobile-app (React Native / Expo)      │
└──────────────┬───────────────────────────────┬───────────────────────┘
               │ HTTPS / JWT                   │ HTTPS / JWT
               ▼                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        KEYCLOAK (Auth Server)                        │
│          Realm: globusdei · Roles: agente | colaborador | admin      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ Bearer JWT
          ┌────────────────────────┼───────────────────────┐
          ▼                        ▼                       ▼
┌─────────────────┐   ┌──────────────────┐   ┌────────────────────────┐
│  main-service   │   │ finance-service  │   │ notification-service   │
│  (NestJS :3000) │   │  (NestJS :3001)  │   │   (NestJS :3002)       │
└────────┬────────┘   └────────┬─────────┘   └──────────┬─────────────┘
         │                     │                         │
         └─────────────────────┼─────────────────────────┘
                               │ Prisma ORM
                               ▼
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │  (porta 5435)    │
                    └──────────────────┘

         ┌──────────────┐    ┌─────────────────┐
         │ data-service │    │ report-service  │
         │ (Express)    │    │  (Express)      │
         └──────────────┘    └─────────────────┘

Infraestrutura transversal:
  RabbitMQ (mensageria) · Redis (cache) · MongoDB (dados não-relacionais)
```

### Aplicações do monorepo

| App | Tecnologia | Porta | Responsabilidade |
|---|---|---|---|
| `main-service` | NestJS + TypeScript | 3000 | Núcleo de negócios: agentes, empreendimentos, eventos, academia, onboarding, prayer requests, notificações internas |
| `finance-service` | NestJS + TypeScript | 3001 | Gestão financeira: investimentos, alocações, lançamentos, dashboard de recursos |
| `notification-service` | NestJS + TypeScript | 3002 | Central de notificações: inbox, e-mail (SMTP), WhatsApp, eventos assíncronos via RabbitMQ |
| `data-service` | Express + TypeScript | — | Análise e atualização de dados, agregações |
| `report-service` | Express + TypeScript | — | Geração de relatórios exportáveis |
| `web-platform` | Next.js 16 + Tailwind | — | Plataforma web para agentes e colaboradores |
| `mobile-app` | React Native + Expo | — | Aplicativo mobile para agentes |

---

## 3. Stack de Tecnologias

### Backend
| Camada | Tecnologia |
|---|---|
| Runtime | Node.js + TypeScript 5 |
| Framework principal | NestJS 11 |
| Framework secundário | Express (data/report services) |
| ORM | Prisma 6 (PostgreSQL) |
| Autenticação | Keycloak 24 + JWT (RS256) · `jwks-rsa` |
| Mensageria | RabbitMQ 3 (`amqplib` / `amqp-connection-manager`) |
| Cache | Redis 7 |
| Documentação de API | Swagger (`@nestjs/swagger`) |

### Frontend
| Camada | Tecnologia |
|---|---|
| Web | Next.js 16 + React 19 |
| Mobile | React Native 0.81 + Expo SDK 54 |
| Estilização | Tailwind CSS 3.4 |
| Componentes UI | Radix UI + shadcn/ui pattern |
| Ícones | Lucide React / Lucide React Native |

### Infra e DevOps
| Componente | Tecnologia |
|---|---|
| Orquestração local | Docker Compose |
| Build system | Nx 22 (monorepo) |
| Bundler (backend) | Webpack (via `@nx/webpack`) |
| Bundler (mobile) | Metro |
| Testes unitários | Jest 30 |
| Testes E2E (web) | Playwright |
| Banco principal | PostgreSQL 15 |
| Banco secundário | MongoDB 6 |
| Compilador | SWC (`@swc/core`) |

---

## 4. Domínios e Entidades Principais

### 4.1 Usuários e Papéis

#### Agent (Agente)
Qualquer pessoa envolvida em causas missionárias: missionários, pastores, evangelistas, estudantes de teologia, empresários cristãos, entre outros.

| Campo | Descrição |
|---|---|
| `status` | Ciclo de vida: `ENTERED → SUBMITTED → QUALIFIED → SCHEDULED → APPROVED / REJECTED` |
| `vocationType` | Tipo de vocação missionária |
| `publicBio` / `privateNotes` | Bio pública e notas internas |
| `authSubject` | Vinculação com o subject do Keycloak |

#### Collaborator (Colaborador)
Membros da equipe interna da GlobusDei. Possuem papéis funcionais:

| Papel | Acesso |
|---|---|
| `ADMIN` | Acesso total |
| `PEOPLE_MANAGER` | Gestão de pessoas e onboarding |
| `PROJECT_MANAGER` | Gestão de empreendimentos |
| `RESOURCE_MANAGER` | Gestão financeira |

---

### 4.2 Empreendimento

Representa uma iniciativa registrada na plataforma: igreja, ONG, projeto, escola, agência ou venture.

**Tipos:** `CHURCH | AGENCY | SCHOOL | PROJECT | VENTURE | ONG`  
**Categorias:** `EDUCATION | SPORTS | TECHNOLOGY | BUSINESS | HEALTH | SOCIAL | SCIENTIFICAL | CAPACITATION | SUPPORT`

Funcionalidades associadas:
- Membros com papéis (`OWNER | MANAGER | CONTRIBUTOR | VOLUNTEER`)
- Convites por e-mail via token
- Seguidores (follow)
- Logs de serviço registrados por colaboradores
- Recebimento de investimentos

---

### 4.3 Módulo Financeiro

Entidades do domínio financeiro geridas pelo `finance-service`:

| Entidade | Descrição |
|---|---|
| `Investment` | Doação/investimento recebido (de agente, colaborador ou anônimo) |
| `Allocation` | Alocação/distribuição de recursos para agente ou empreendimento |
| `FinancialEntry` | Lançamento no fluxo de caixa (INCOME / EXPENSE / ADJUSTMENT / TRANSFER) |
| `ExpenseCategory` | Categorias de despesa configuráveis |

---

### 4.4 Academia GlobusDei

Módulo de capacitação missionária:

| Entidade | Descrição |
|---|---|
| `AcademyModule` | Módulo de curso com ordem e instruções de trabalho |
| `Lesson` | Aula com vídeo (YouTube), materiais e perguntas |
| `LessonMaterial` | Material de apoio anexado à aula |
| `LessonProgress` | Progresso do agente por aula |
| `LessonQuestion` / `LessonAnswer` | Fórum de dúvidas por aula |
| `AgentModuleEnrollment` | Matrícula do agente no módulo |
| `FinalWork` / `FinalWorkReview` | Trabalho final e avaliação pelo colaborador |
| `AgentCertification` | Certificado emitido após aprovação |

---

### 4.5 Notificações

O `notification-service` gerencia uma central de notificações com múltiplos canais:

| Tipo | Descrição |
|---|---|
| `DIRECT_MESSAGE` | Mensagem direta entre usuários |
| `CONNECTION_REQUEST` | Solicitação de conexão entre agentes |
| `NEW_FOLLOWER` | Novo seguidor em empreendimento |
| `EVENT_REMINDER` | Lembrete de evento |
| `PROCESS_UPDATE` | Atualização de processo (onboarding, etc.) |
| `SYSTEM_ANNOUNCEMENT` | Comunicado da plataforma |

**Canais de entrega:** in-app (inbox), e-mail (SMTP), WhatsApp  
**Escopos:** `PERSONAL | INITIATIVE | PLATFORM`

---

### 4.6 Outras Entidades

| Entidade | Descrição |
|---|---|
| `Connection` | Rede de conexões entre agentes (estilo LinkedIn) |
| `Event` / `EventRsvp` | Eventos (presenciais ou online) com confirmação de presença |
| `ServiceRequest` | Solicitação de apoio categorizada (técnica, psicológica, médica, espiritual, etc.) |
| `ServiceLog` | Registro de atendimento por colaborador |
| `PrayerRequest` | Pedido de oração do agente, com resposta do colaborador |
| `Announcement` | Comunicado criado por colaborador |
| `Question` / `Answer` | Questionário de onboarding respondido pelo agente |
| `AvailabilitySlot` | Agenda de entrevistas dos colaboradores |
| `AuditLog` | Log de auditoria de ações sensíveis |

---

## 5. Fluxos Principais

### 5.1 Onboarding do Agente

```
Cadastro → ENTERED
    │
    ▼
Preenche questionário de onboarding → SUBMITTED
    │
    ▼
Colaborador (PEOPLE_MANAGER) analisa e qualifica → QUALIFIED
    │
    ▼
Agente agenda entrevista em slot disponível → SCHEDULED
    │
    ▼
Colaborador conduz entrevista e registra feedback
    │
    ├── Aprovado → APPROVED
    └── Reprovado → REJECTED
```

### 5.2 Fluxo Financeiro

```
Investimento / Doação
    │  ← registrado por colaborador (RESOURCE_MANAGER) OU
    │  ← auto-registrado por investidor na plataforma
    ▼
Investment criado → FinancialEntry (INCOME) gerado automaticamente
    │
    ▼
Dashboard consolidado: saldo, entradas, saídas, histórico por target

Alocação (Allocation) → FinancialEntry (EXPENSE/TRANSFER)
    → vinculada a Agent ou Empreendimento
```

### 5.3 Fluxo de Empreendimento

```
Agente cria Empreendimento → se torna OWNER
    │
    ├── Convida outros agentes por e-mail (token único)
    ├── Agentes aceitam → EmpreendimentoMember com papel (MANAGER/CONTRIBUTOR/VOLUNTEER)
    ├── Outros agentes podem seguir (EmpreendimentoFollow)
    └── Colaborador (PROJECT_MANAGER) monitora → registra ServiceLog
```

### 5.4 Fluxo de Notificação

```
Evento de negócio (ex: conexão aceita, novo lançamento)
    │
    ▼ via RabbitMQ ou chamada direta
notification-service
    │
    ├── Salva Notification + NotificationRecipient no banco
    ├── Envia e-mail via SMTP → NotificationEmailLog
    └── Envia via WhatsApp (quando aplicável)
```

### 5.5 Academia — Ciclo de Certificação

```
Agente se matricula no módulo (AgentModuleEnrollment)
    │
    ├── Acessa aulas → marca LessonProgress
    ├── Faz perguntas → LessonQuestion (respondida por colaborador)
    └── Envia trabalho final → FinalWork (PENDING)
            │
            ▼
    Colaborador avalia → FinalWorkReview
            │
            ├── approved: true  → AgentCertification emitida
            └── approved: false → Agente deve reenviar
```

---

## 6. Segurança

### Modelo de autenticação
- **Keycloak 24** como Identity Provider centralizado
- Protocolo: **OAuth2 / OIDC** com tokens **JWT RS256**
- Suporte a login social via **Google OAuth2** (configurado via script `configure-google-idp.sh`)
- Validação de tokens com **JWKS** (chaves públicas cacheadas)

### Papéis no Keycloak (Realm Roles)
- `agente` — usuário final missionário
- `colaborador` — membro da equipe interna
- `administrador` — acesso total

### RBAC / ABAC
- Guards NestJS: `KeycloakAuthGuard` (autenticação) + `PoliciesGuard` (autorização fina)
- Decoradores: `@RequireRealmRoles()`, `@RequireCollaboratorRoles()`
- Políticas por recurso: `canViewAgent`, `canManageInvestment`, `canEditEnterprise`

### Logs de segurança e auditoria
- **Log técnico:** exceções, latência, falhas de integração
- **Log de segurança:** login/logout, tentativas falhas, troca de senha, tokens inválidos
- **Log de auditoria** (`AuditLog`): quem viu dado sensível, quem aprovou investimento, quem alterou cadastro

---

## 7. Infraestrutura Docker

Todos os serviços de apoio rodam em contêineres orquestrados pelo `docker-compose.yml`:

| Serviço | Imagem | Porta local |
|---|---|---|
| PostgreSQL | `postgres:15-alpine` | 5435 |
| MongoDB | `mongo:6` | 27018 |
| Redis | `redis:7-alpine` | 6380 |
| RabbitMQ | `rabbitmq:3-management-alpine` | 5673 / 15673 (UI) |
| Keycloak | `keycloak:24.0` | 8085 |
| keycloak-config | `curlimages/curl` | — (config only) |

Todos os serviços estão na rede interna `globusdei-network` (bridge). Banco, Redis e RabbitMQ não são expostos à internet pública.

---

## 8. Estrutura do Monorepo (Nx)

```
globusdei/
├── apps/
│   ├── main-service/           # NestJS — núcleo de negócios
│   ├── finance-service/        # NestJS — finanças
│   ├── notification-service/   # NestJS — notificações
│   ├── data-service/           # Express — análise de dados
│   ├── report-service/         # Express — relatórios
│   ├── web-platform/           # Next.js — plataforma web
│   └── mobile-app/             # React Native Expo — app mobile
├── shared/
│   ├── auth/                   # Lib compartilhada de autenticação
│   ├── types/                  # Tipos TypeScript compartilhados
│   └── utils/                  # Utilitários compartilhados
├── prisma/
│   ├── schema.prisma           # Schema único compartilhado
│   └── migrations/             # Histórico de migrações
├── keycloak/
│   ├── realm-export.json       # Configuração do realm
│   └── configure-google-idp.sh # Script de integração Google
└── docker-compose.yml
```

### Domínios do `main-service`
```
src/
├── academy/        # Academia Globus Dei
├── agent/          # Gestão de agentes
├── announcement/   # Comunicados
├── audit/          # Auditoria
├── auth/           # Guards e decoradores de segurança
├── collaborator/   # Gestão de colaboradores
├── connection/     # Rede de conexões
├── empreendimento/ # Empreendimentos missionários
├── event/          # Eventos
├── notification/   # Gateway de notificações (WebSocket/broker)
├── onboarding/     # Fluxo de qualificação de agentes
├── platform/       # Dados gerais da plataforma
└── prayer-request/ # Pedidos de oração
```

---

## 9. Princípios de Desenvolvimento

- **DDD (Domain-Driven Design):** código organizado por domínios de negócio
- **SOLID:** responsabilidade única, inversão de dependência, injeção via NestJS IoC
- **Sem repetição de código:** lógica centralizada em services e repositórios; tipos em `shared/`
- **Testes:** cada service tem classe de testes correspondente; fluxos principais com testes de integração
- **Componentes reutilizáveis:** no frontend, componentes criados são reaproveitados em toda a plataforma
- **Segurança em camadas:** identidade centralizada → autorização por papel → proteção de dados → auditoria

---

## 10. Conformidade e Dados Sensíveis

A plataforma trata dados pessoais, financeiros e potencialmente sensíveis (saúde, contexto religioso/missionário), portanto segue diretrizes de:

- **LGPD** — Lei Geral de Proteção de Dados
- **RBAC/ABAC** — controle de acesso granular por papel e atributo
- Segregação de dados: `publicBio` vs. `privateNotes` no perfil do agente
- Criptografia de campos sensíveis e backups criptografados
- Controle de exportação de dados via log de auditoria
