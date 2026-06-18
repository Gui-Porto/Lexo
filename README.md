# Lexo

> Sistema de gestão para escritórios de advocacia — SaaS multi-tenant com IA integrada, focado em simplicidade e produtividade para advogados.

---

## A ideia

Escritórios de advocacia de pequeno e médio porte costumam gerenciar processos em planilhas, prazos em agendas físicas ou calendários genéricos, e honorários no improviso. O Lexo nasce para substituir tudo isso com uma plataforma centralizada, pensada especificamente para o fluxo de trabalho jurídico.

A proposta é ser o **sistema operacional do escritório**: você entra, vê seus processos ativos, sabe quais prazos vencem primeiro, acompanha o status financeiro dos honorários e tem o histórico completo de cada cliente — tudo em um só lugar, sem complexidade desnecessária.

O modelo é **multi-tenant**: cada escritório cria sua própria conta e acessa apenas seus próprios dados. Um único sistema serve vários escritórios de forma completamente isolada.

---

## Funcionalidades

### Processos
Cadastro e acompanhamento de processos judiciais com número, área do direito, status (Ativo / Suspenso / Arquivado / Encerrado), responsável e vínculo com cliente. Cada processo tem uma página de detalhe com prazos, honorários e acesso direto às ferramentas de IA.

### Clientes
Cadastro completo de clientes (pessoa física ou jurídica) com validação de CPF/CNPJ, email, telefone e observações. Navegação direta para todos os processos e cobranças do cliente.

### Agenda
Controle de prazos processuais, audiências, reuniões e outros compromissos. Cada item tem tipo, data e status — com **score de risco colorido** (urgente / atenção / normal) calculado automaticamente pela proximidade do vencimento.

### Financeiro
Registro de honorários com valor, vencimento, status (Pendente / Pago / Atrasado / Cancelado) e vínculo com cliente e processo. Inclui **relatório financeiro** com exportação em CSV e impressão em PDF, com resumo por período.

### Inteligência Artificial (Claude)
Ferramentas de IA integradas diretamente nos processos, via API da Anthropic:

- **Gerador de minutas** — gera petições e documentos jurídicos com base nos dados do processo
- **Extrator de documentos PDF** — extrai e estrutura informações de peças processuais em PDF
- **Resumo automático** — gera um resumo executivo do processo com pontos de atenção
- **Pesquisa jurídica** — busca e sintetiza jurisprudência e doutrina relevantes ao caso

### Gestão de equipe
Convite de usuários por email com link temporário. Papéis distintos: **Admin**, **Advogado** e **Secretaria**. Cada papel tem acesso adequado às funcionalidades do sistema.

### Segurança
- Autenticação com email e senha (bcrypt)
- **Autenticação de dois fatores (2FA/TOTP)** via app autenticador (Google Authenticator, Authy etc.)
- **Log de auditoria** completo para administradores — registra todas as ações sensíveis com usuário, IP e timestamp

### Notificações
Notificações automáticas de prazos por email via **Resend**, disparadas por cron job diário. Advogados recebem alerta dos prazos que vencem nos próximos 3 dias.

### Planos e billing
Integração com **Stripe** para gestão de assinaturas. Planos Essencial e Pro com trial de 14 dias. Banner de trial com contador de dias restantes e call-to-action para upgrade.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL via Prisma + adapter-pg |
| Autenticação | Auth.js v5 (next-auth) — JWT + Credentials + TOTP |
| UI | shadcn/ui sobre Base UI + Tailwind CSS v4 |
| IA | Anthropic Claude (via `@anthropic-ai/sdk`) |
| Email | Resend |
| Pagamentos | Stripe |
| Validação | Zod |
| Notificações | Sonner |
| Runtime | Node.js 20+ |

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/Gui-Porto/Lexo-Placeholder.git
cd Lexo-Placeholder/lexo

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env .env.local
# Edite o .env.local com seus valores locais (veja abaixo)

# 4. Gere o cliente Prisma e aplique as migrations
npx prisma generate
npx prisma migrate deploy

# 5. (Opcional) Popule o banco com dados de demonstração
npx tsx prisma/seed.ts

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse **http://localhost:3000** — você será redirecionado para `/login`.

- Para criar seu próprio escritório: acesse `/registrar`
- Para usar os dados de demo (após o seed): `admin@lexo.dev` / `senha123`

### Variáveis de ambiente (`.env.local`)

```env
# Banco de dados PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lexo_dev"

# Auth
AUTH_SECRET="qualquer-string-aleatória-longa"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic (funcionalidades de IA)
ANTHROPIC_API_KEY="sk-ant-..."

# Resend (notificações de email) — opcional para dev
RESEND_API_KEY="re_..."
RESEND_FROM="Lexo <noreply@seudominio.com>"

# Stripe (billing) — opcional para dev
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ESSENCIAL="price_..."
STRIPE_PRICE_PRO="price_..."

# Cron (proteção do endpoint de notificações)
CRON_SECRET="qualquer-string-aleatória"
```

---

## Estrutura do projeto

```
lexo/
├── prisma/
│   ├── schema.prisma          # modelos: Organization, User, Client, Case, Deadline, Invoice, ActivityLog, AuditLog, UserInvite
│   ├── migrations/
│   └── seed.ts                # dados de demonstração
├── src/
│   ├── actions/               # Server Actions (mutations por domínio)
│   │   ├── auth.ts            # registro de organização
│   │   ├── clientes.ts
│   │   ├── processos.ts
│   │   ├── agenda.ts
│   │   ├── financeiro.ts
│   │   ├── usuarios.ts        # gestão de equipe
│   │   ├── convite.ts         # convite por email
│   │   ├── totp.ts            # 2FA
│   │   └── billing.ts         # Stripe
│   ├── app/
│   │   ├── (dashboard)/       # rotas autenticadas com layout de sidebar
│   │   │   ├── processos/     # lista + detalhe + minutas + resumo
│   │   │   ├── clientes/
│   │   │   ├── agenda/
│   │   │   ├── financeiro/    # lista + relatório
│   │   │   ├── pesquisa-juridica/
│   │   │   ├── planos/
│   │   │   └── configuracoes/ # usuários + segurança (2FA) + auditoria
│   │   ├── api/
│   │   │   ├── gerar-minuta/
│   │   │   ├── extrair-documento/
│   │   │   ├── resumo-processo/
│   │   │   ├── pesquisa-juridica/
│   │   │   ├── relatorio/financeiro/
│   │   │   ├── cron/notify-deadlines/
│   │   │   └── webhooks/stripe/
│   │   ├── convite/[token]/   # aceite de convite por link
│   │   ├── login/
│   │   └── registrar/
│   ├── components/            # componentes de UI por domínio + shadcn/ui
│   ├── lib/
│   │   ├── auth.ts            # configuração NextAuth + TOTP
│   │   ├── db.ts              # instância Prisma singleton (pg adapter)
│   │   ├── session.ts         # requireSession()
│   │   ├── activity.ts        # log de atividades
│   │   ├── audit.ts           # log de auditoria
│   │   ├── billing.ts         # helpers Stripe
│   │   ├── document.ts        # extração de PDF
│   │   ├── resend.ts          # envio de emails
│   │   ├── risk.ts            # score de risco de prazo
│   │   └── stripe.ts          # cliente Stripe
│   └── proxy.ts               # middleware de autenticação
```

---

## Licença

Projeto em desenvolvimento. Todos os direitos reservados.
