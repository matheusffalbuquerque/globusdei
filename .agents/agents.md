# GlobusDei — Contexto do Projeto para Agentes de IA

> Este documento é a **fonte primária de orientação** para todos os agentes que atuam neste repositório.
> Leia-o integralmente antes de executar qualquer tarefa.

---

## 1. Identidade do Projeto

**GlobusDei** é uma plataforma de gestão para uma agência missionária cristã interdenominacional brasileira.
O sistema conecta colaboradores internos, agentes de missão e empreendimentos missionários.

**Repositório:** monorepo Nx em `/home/matheus/Documentos/DevProjects/gd/globusdei`  
**Branch principal:** `main`  
**Documentação técnica completa:** [`docs/technical-overview.md`](../docs/technical-overview.md)

---

## 2. Mapa do Monorepo

```
apps/
  main-service/          ← NestJS 11 · porta 3000 · NÚCLEO de negócios
  finance-service/       ← NestJS 11 · porta 3001 · gestão financeira
  notification-service/  ← NestJS 11 · porta 3002 · central de notificações
  data-service/          ← Express · análise e atualização de dados
  report-service/        ← Express · geração de relatórios
  web-platform/          ← Next.js 16 · plataforma web
  mobile-app/            ← React Native + Expo 54 · app mobile

shared/
  auth/                  ← lib compartilhada: guards, decoradores, interfaces
  types/                 ← tipos TypeScript globais
  utils/                 ← utilitários

prisma/
  schema.prisma          ← schema ÚNICO do PostgreSQL (fonte da verdade das entidades)
  migrations/            ← histórico de migrações (nunca edite manualmente)

.agents/
  skills/                ← habilidades especializadas dos agentes (architect, implementor, etc.)
  agents.md              ← ESTE ARQUIVO
```

---

## 3. Regras Absolutas (nunca viole)

1. **TypeScript estrito** em todos os arquivos. Sem `any` implícito.
2. **Schema Prisma é a fonte da verdade** para entidades. Alterações de modelo sempre começam pelo `schema.prisma` e são aplicadas via `npx prisma migrate dev`.
3. **Nunca duplique lógica** entre serviços. Use `shared/` para código reutilizável.
4. **Segurança obrigatória:** todo endpoint NestJS deve ter `@UseGuards(KeycloakAuthGuard, PoliciesGuard)` e os decoradores de papel apropriados.
5. **DDD obrigatório:** o código deve ser organizado por domínio. Cada domínio tem seu próprio módulo NestJS com `controller`, `service`, `repository` e `module`.
6. **Testes obrigatórios:** toda classe de `service` deve ter arquivo de testes correspondente (`.spec.ts`).
7. **Nx para tudo:** para rodar tarefas, use `nx run <app>:<target>`. Não execute scripts npm diretamente nos `apps/`.

---

## 4. Convenções de Código

### Backend (NestJS)
```
src/
  <dominio>/
    <dominio>.controller.ts   ← só recebe/valida HTTP, delega para o service
    <dominio>.service.ts      ← lógica de negócio, chama o repository
    <dominio>.repository.ts   ← acesso ao banco via PrismaService
    <dominio>.module.ts       ← configura e exporta o módulo NestJS
    dto/                      ← DTOs de entrada validados com class-validator
```

- **Injeção de dependência:** sempre via construtor e `@Injectable()`
- **Validação:** use `class-validator` nos DTOs (`@IsString()`, `@IsEnum()`, etc.)
- **Swagger:** todo controller deve ter `@ApiTags()` e `@ApiBearerAuth()`
- **Erros:** use as exceções padrão NestJS (`NotFoundException`, `ForbiddenException`, etc.)

### Frontend (Next.js)
```
src/
  app/
    (agente)/     ← rotas acessíveis ao agente
    (colaborador)/← rotas acessíveis ao colaborador
    api/          ← route handlers do Next.js
  components/     ← componentes React reutilizáveis
  lib/            ← funções utilitárias, clientes de API
```

- **Componentes:** sempre funcionais com TypeScript + props tipadas
- **Estilização:** Tailwind CSS + Radix UI / shadcn/ui. Sem CSS Modules para novos componentes
- **Reutilização:** antes de criar um componente, verifique se já existe em `components/`

### Mobile (React Native / Expo)
```
src/
  app/
    (auth)/       ← telas de autenticação
    (tabs)/       ← telas principais (index, actions, network, notifications, opportunities)
  components/     ← componentes reutilizáveis
  context/        ← providers de contexto React
```

---

## 5. Domínios de Negócio e Entidades Chave

### Usuários do sistema
| Entidade | Papel no Keycloak | Descrição |
|---|---|---|
| `Agent` | `agente` | Missionário, pastor, evangelista, etc. — usuário principal da plataforma |
| `Collaborator` | `colaborador` / `administrador` | Equipe interna da GlobusDei |

### Papéis dos Colaboradores
| Role | Permissão principal |
|---|---|
| `ADMIN` | Acesso irrestrito |
| `PEOPLE_MANAGER` | Onboarding, qualificação, entrevistas |
| `PROJECT_MANAGER` | Gestão de empreendimentos |
| `RESOURCE_MANAGER` | Gestão financeira, investimentos, alocações |

### Entidades centrais
| Entidade | Domínio | Serviço |
|---|---|---|
| `Agent` | Agente | `main-service` |
| `Collaborator` | Colaborador | `main-service` |
| `Empreendimento` | Empreendimento | `main-service` |
| `Connection` | Rede | `main-service` |
| `Event` / `EventRsvp` | Eventos | `main-service` |
| `ServiceRequest` | Apoio | `main-service` |
| `PrayerRequest` | Apoio espiritual | `main-service` |
| `AcademyModule` / `Lesson` | Academia | `main-service` |
| `Investment` / `Allocation` / `FinancialEntry` | Finanças | `finance-service` |
| `Notification` / `NotificationRecipient` | Notificações | `notification-service` |
| `AuditLog` | Auditoria | `main-service` |

### Status do ciclo de vida do Agente (onboarding)
```
ENTERED → SUBMITTED → QUALIFIED → SCHEDULED → APPROVED | REJECTED
```

---

## 6. Autenticação e Autorização

### Fluxo JWT
1. Usuário autentica no **Keycloak** (realm `globusdei`)
2. Recebe JWT RS256 assinado com as chaves do realm
3. Cada serviço valida o token via **JWKS** (`KeycloakAuthGuard`)
4. `PoliciesGuard` verifica papéis no token (`realm_access.roles`)

### Como proteger um endpoint
```typescript
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('colaborador', 'administrador')
@RequireCollaboratorRoles(CollaboratorRole.RESOURCE_MANAGER)
@Get('rota-protegida')
minhaRota(@CurrentUser() user: AuthenticatedUser) { ... }
```

### Dev bypass
O `KeycloakAuthGuard` aceita headers de desenvolvimento (`x-dev-user`, etc.) em ambiente local.
**Nunca use esse bypass em produção.**

---

## 7. Banco de Dados

### PostgreSQL (fonte principal)
- ORM: **Prisma 6**
- Schema: `prisma/schema.prisma` — contém TODOS os modelos
- Migrações: `npx prisma migrate dev --name <descricao>`
- Client: importar `PrismaService` (disponível como módulo compartilhado em cada app)

### MongoDB
- Uso: dados não-relacionais, analytics, eventos de log
- Ainda não implementado em produção; reservado para expansão futura

### Regra crítica
> Nunca faça `ALTER TABLE` manual. Sempre use `prisma migrate`.

---

## 8. Mensageria (RabbitMQ)

- Usado principalmente pelo `notification-service` para processamento assíncrono
- Padrão: `@EventPattern('nome.do.evento')` no consumer NestJS
- Porta: 5673 (local) | UI de gerenciamento: 15673
- Credenciais: via variáveis de ambiente (`RABBITMQ_USER`, `RABBITMQ_PASSWORD`)

---

## 9. Infraestrutura Local

### Subir a infra
```bash
docker compose up -d
```

Isso sobe: PostgreSQL, MongoDB, Redis, RabbitMQ e Keycloak (com import automático do realm).

### Comandos Nx úteis
```bash
# Rodar um serviço em desenvolvimento
nx serve main-service
nx serve finance-service
nx serve notification-service
nx serve web-platform

# Rodar todos os testes de um app
nx test main-service

# Rodar testes E2E
nx e2e web-platform-e2e

# Build de produção
nx build main-service
```

---

## 10. Segurança — Checklist para Implementações

Antes de considerar um feature completo, verifique:

- [ ] Endpoint protegido com `KeycloakAuthGuard` + `PoliciesGuard`
- [ ] Papéis verificados com `@RequireRealmRoles` e/ou `@RequireCollaboratorRoles`
- [ ] Dados sensíveis não expostos em respostas públicas
- [ ] Ação sensível registrada em `AuditLog`
- [ ] Validação de entrada via DTOs com `class-validator`
- [ ] Nenhum segredo hardcoded (usar `process.env`)

---

## 11. Habilidades dos Agentes Disponíveis

| Skill | Arquivo | Quando usar |
|---|---|---|
| `orchestrator` | `.agents/skills/orchestrator/SKILL.md` | Coordenação de fases e tarefas |
| `architect` | `.agents/skills/architect/SKILL.md` | Design de módulos, esquemas, limites de serviço |
| `implementor` | `.agents/skills/implementor/SKILL.md` | Escrita de código e scaffolding |
| `tester` | `.agents/skills/tester/SKILL.md` | Criação de testes unitários e de integração |
| `reviewer` | `.agents/skills/reviewer/SKILL.md` | Revisão de código e conformidade |

---

## 12. Anti-padrões — Nunca Faça

- ❌ Colocar lógica de negócio no Controller (vai no Service)
- ❌ Acessar o banco diretamente no Service (use o Repository)
- ❌ Criar tipos duplicados entre `apps/` (use `shared/types`)
- ❌ Usar `any` no TypeScript
- ❌ Editar arquivos dentro de `prisma/migrations/` manualmente
- ❌ Expor dados como `privateNotes`, `bankDetails` ou `internalNotes` em respostas públicas
- ❌ Criar componentes de UI sem verificar se já existe um equivalente em `components/`
- ❌ Subir código sem testes para serviços críticos (`main-service`, `finance-service`)
