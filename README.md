# Lexo

> Sistema de gestão para escritórios de advocacia — SaaS multi-tenant, focado em simplicidade e produtividade para advogados.

---

## A ideia

Escritórios de advocacia de pequeno e médio porte costumam gerenciar processos em planilhas, prazos em agendas físicas ou calendários genéricos, e honorários no improviso. O Lexo nasce para substituir tudo isso com uma plataforma centralizada, pensada especificamente para o fluxo de trabalho jurídico.

A proposta é ser o **sistema operacional do escritório**: você entra, vê seus processos ativos, sabe quais prazos vencem primeiro, acompanha o status financeiro dos honorários e tem o histórico completo de cada cliente — tudo em um só lugar, sem complexidade desnecessária.

O modelo é **multi-tenant**: cada escritório cria sua própria conta e acessa apenas seus próprios dados. Um único sistema serve vários escritórios de forma completamente isolada.

---

## Funcionalidades

### Processos
Cadastro e acompanhamento de processos judiciais com número, área do direito, status (Ativo / Suspenso / Arquivado / Encerrado) e vínculo com cliente. Cada processo tem uma página de detalhe que concentra seus prazos e honorários relacionados.

### Clientes
Cadastro completo de clientes (pessoa física ou jurídica) com CPF/CNPJ, email, telefone e observações. A partir do cliente é possível navegar para todos os processos e cobranças associados.

### Agenda
Controle de prazos processuais, audiências, reuniões e outros compromissos vinculados a um processo. Cada item tem tipo, data e status (Pendente / Concluído / Perdido) — o advogado marca como concluído diretamente na lista.

### Financeiro
Registro de honorários com valor, vencimento, status (Pendente / Pago / Atrasado / Cancelado) e vínculo com cliente e processo. Botão de marcar como pago direto na tabela, com formatação em Real (R$).

### Autenticação e multi-tenancy
Cadastro de escritório cria automaticamente a organização e o primeiro usuário administrador. Login com email e senha. Todos os dados são isolados por `organizationId` — nenhum escritório acessa dados de outro.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| Banco de dados | SQLite via Prisma + better-sqlite3 |
| Autenticação | Auth.js v5 (next-auth) — JWT + Credentials |
| UI | shadcn/ui sobre Base UI + Tailwind CSS v4 |
| Validação | Zod |
| Notificações | Sonner |
| Runtime | Node.js |

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- npm

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/Gui-Porto/Lexo-Placeholder.git
cd Lexo-Placeholder/lexo

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com seus valores (veja a seção abaixo)

# 4. Crie o banco de dados e aplique as migrations
npx prisma migrate deploy
npx prisma generate

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse **http://localhost:3000** — você será redirecionado para `/login`. Crie sua conta em `/registrar`.

### Variáveis de ambiente

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="qualquer-string-aleatória-longa"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Estrutura do projeto

```
lexo/
├── prisma/
│   ├── schema.prisma        # modelos: Organization, User, Client, Case, Deadline, Invoice
│   └── migrations/
├── src/
│   ├── actions/             # Server Actions (mutations por domínio)
│   │   ├── auth.ts          # registro de organização
│   │   ├── clientes.ts
│   │   ├── processos.ts
│   │   ├── agenda.ts
│   │   └── financeiro.ts
│   ├── app/
│   │   ├── (dashboard)/     # rotas autenticadas com layout de sidebar
│   │   │   ├── processos/
│   │   │   ├── clientes/
│   │   │   ├── agenda/
│   │   │   └── financeiro/
│   │   ├── login/
│   │   └── registrar/
│   ├── components/          # componentes de UI por domínio + shadcn/ui
│   ├── lib/
│   │   ├── auth.ts          # configuração NextAuth
│   │   ├── db.ts            # instância Prisma (singleton)
│   │   ├── session.ts       # requireSession()
│   │   └── format.ts        # formatDate(), formatCurrency()
│   └── proxy.ts             # middleware de autenticação
```

---

## Roadmap (ideias futuras)

- [ ] Dashboard com métricas (processos ativos, prazos próximos, receita do mês)
- [ ] Gestão de equipe — convidar advogados e secretárias com papéis (Admin / Advogado / Secretaria)
- [ ] Atribuição de responsável por processo
- [ ] Filtros e busca nas listagens
- [ ] Exportação de relatórios financeiros (PDF / CSV)
- [ ] Notificações de prazos por email
- [ ] Planos e billing (trial → plano pago)
- [ ] Upload de documentos por processo

---

## Licença

Projeto em desenvolvimento. Todos os direitos reservados.
