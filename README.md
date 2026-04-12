# Globus Dei Platform

Plataforma de gestão e apoio missionário da **Globus Dei** — uma agência missionária cristã interdenominacional brasileira dedicada à evangelização global.

---

## Sobre a Organização

A Globus Dei é uma organização cristã que atua no apoio a iniciativas individuais e coletivas, formais e informais, nacionais e internacionais, com o objetivo de promover a evangelização global. Seu trabalho é integrar cristãos na missão global da Igreja, prestando suporte espiritual, integral (saúde física e mental) e financeiro a missionários, projetos e organizações.

---

## O que é esta plataforma

Esta plataforma é o sistema de gestão central da Globus Dei. Ela serve como elo entre a equipe interna da organização e todos os envolvidos nas iniciativas apoiadas. Em termos estratégicos, é onde a Globus Dei:

- **Acompanha e apoia agentes** — missionários, estudantes de teologia, profissionais em missão, empresários cristãos, pastores, líderes e outros perfis;
- **Gerencia empreendimentos** — projetos, organizações e igrejas apoiadas, com páginas próprias de apresentação;
- **Controla investimentos e financiamentos** — doações e aportes de qualquer pessoa (investidor anônimo ou cadastrado), com fluxo de caixa completo;
- **Conecta pessoas e iniciativas** — inspirada no LinkedIn, a plataforma forma uma rede global de agentes e empreendimentos alinhados com a causa da missão;
- **Forma líderes** — por meio da Academia Globus Dei, um LMS completo com módulos, aulas, trabalhos finais e certificações;
- **Comunica e notifica** — newsletters, avisos e eventos gerenciados diretamente pela plataforma.

---

## Perfis de Usuário

| Perfil | Descrição |
|---|---|
| **Agente** | Qualquer pessoa envolvida na missão (missionário, estudante, empresário, pastor, etc.) que utiliza a plataforma para acompanhar seus processos e acessar os serviços da organização |
| **Empreendimento** | Projeto, organização ou igreja cadastrada, vinculada a agentes participantes |
| **Colaborador** | Equipe interna e voluntários da Globus Dei, com papéis específicos: *gestor de recursos*, *gestor de projetos* e *gestor de pessoas* |
| **Administrador** | Colaborador com acesso total à plataforma |
| **Investidor** | Pessoa (anônima ou cadastrada) que realiza doações diretas a agentes, empreendimentos ou à organização |

---

## Funcionalidades Principais

### Para Agentes
- Onboarding e perfil detalhado
- Rede Global — conexão e descoberta de outros agentes e empreendimentos
- Academia Globus Dei — estudo de módulos, progresso de aulas, envio de trabalhos finais e certificações
- Solicitações de apoio espiritual, integral e financeiro
- Acompanhamento de pedidos de oração
- Participação em eventos (presenciais e online) com RSVP
- Histórico de investimentos recebidos
- Feed de conteúdo e comunicados

### Para Colaboradores
- Dashboard de gestão de agentes e empreendimentos
- Painel financeiro — fluxo de caixa, aportes, distribuição de recursos
- Gerenciamento da Academia — criação de módulos/aulas, avaliação de trabalhos, resposta a dúvidas
- Gestão de eventos
- Relatórios, dashboards e gráficos com dados atualizados
- Sistema de notificações e newsletters

---

## Arquitetura Técnica

O projeto é um **monorepo NX** com múltiplas aplicações e bibliotecas compartilhadas.

### Aplicações

| App | Tecnologia | Descrição |
|---|---|---|
| `main-service` | NestJS (TypeScript) | Serviço principal — regras de negócio centrais (porta 3001) |
| `finance-service` | NestJS (TypeScript) | Gestão financeira, doações e distribuições |
| `notification-service` | NestJS (TypeScript) | E-mails, avisos e comunicações |
| `data-service` | Express (TypeScript) | Atualização e análise de dados |
| `report-service` | Express (TypeScript) | Geração de relatórios |
| `web-platform` | Next.js 14 (App Router) | Portal web (agentes e colaboradores) |
| `mobile-app` | React Native + Expo | Aplicativo móvel |

### Bibliotecas Compartilhadas

```
shared/
  auth/    — helpers de autenticação e guards
  types/   — tipos TypeScript compartilhados entre apps
  utils/   — utilitários comuns
```

### Infraestrutura

| Componente | Tecnologia |
|---|---|
| Banco de dados | PostgreSQL (Prisma ORM) |
| Autenticação | Keycloak (JWT / OAuth2 / OIDC) |
| Mensageria | RabbitMQ |
| Cache | Redis |
| Estilização | Tailwind CSS + shadcn/ui |
| Conteinerização | Docker + Docker Compose |

---

## Segurança

A plataforma trata dados pessoais, financeiros e sensíveis (saúde, contexto religioso/missionário), seguindo os princípios da LGPD e boas práticas de segurança:

- **Identidade centralizada** via Keycloak
- **Autorização por papel e por recurso** (RBAC/ABAC com políticas finas por ação)
- **Logs em três camadas** — técnico (latência, falhas), segurança (login, tokens, anomalias) e auditoria (quem viu, alterou ou exportou dados sensíveis)
- **Secrets centralizados** em cofre de segredos
- **Containers seguros** — imagens mínimas, usuário não-root, redes segmentadas, portas expostas apenas quando necessário
- **Backups criptografados** com política de restore testada

---

## Como Executar Localmente

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- `npx nx` (via `npm install`)

### 1. Subir a infraestrutura
```bash
sudo docker compose up -d
```

### 2. Configurar o banco de dados
```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Iniciar os serviços
```bash
# Backend principal
npx nx serve main-service

# Frontend web
npx nx serve web-platform

# Outros serviços (opcional)
npx nx serve finance-service
npx nx serve notification-service
```

### 4. Acessar
- **Portal Web:** `http://localhost:3000`
- **API (Swagger):** `http://localhost:3001/api`
- **Keycloak:** `http://localhost:8080`

---

## Metodologia de Desenvolvimento

- **Domain-Driven Design (DDD)** — arquitetura modular por domínio
- **SOLID** — princípios aplicados em todas as camadas
- **Testes** — unitários para todos os métodos e testes de integração nos fluxos principais
- **Componentes reutilizáveis** — preferência a componentes já existentes na aplicação
- **Zero repetição de código** — shared libraries para lógica comum entre apps

---

## Licença

Projeto proprietário da **Globus Dei**. Todos os direitos reservados.
