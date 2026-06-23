# Design Portfolio — Lexo Redesign 2026

Fonte: Claude Design — projectId `c48fe0bc-f6a8-461d-b9e2-50e60c6fbd90`
Telas analisadas em 2026-06-22.

---

## Visão geral

O redesign Lexo cobre 4 telas em sequência: Landing Page → Login → 2FA → App.
Todos os arquivos estão no projeto Claude Design com o projectId acima.

---

## 1. Landing Page — `Lexo - Landing Page.dc.html`

**Rota alvo:** `/` (hoje redireciona; precisa virar página pública)

### Seções

- **Nav sticky:** Logo + links âncora (Recursos, Lexo IA, Portal do Cliente, Preços) + "Área do Cliente" (→ /login) + "Agendar demo"
- **Hero:** Headline "O sistema que cuida do escritório enquanto você cuida da causa." + 2 CTAs + mockup do app com browser frame (window controls + URL bar)
- **Trust bar:** 5 logos de escritórios fictícios (Andrade Adv., Mendonça & Cruz, Vector Legal, Bittencourt Adv., Núcleo Jurídico)
- **Features grid 3×2:** 6 cards com ícones SVG e descrição:
  - Gestão de processos (existente)
  - Prazos & agenda (existente)
  - Lexo IA (NOVO)
  - Jurimetria (NOVO)
  - Financeiro & honorários (existente)
  - Portal do cliente (NOVO)
- **Seção Lexo IA:** 2 colunas — texto com 3 bullets (Resumo de autos, Prazos automáticos, Jurimetria) + demo de chat interativo mockado
- **Stats:** 4 métricas (+2.400 escritórios, 1,2 mi processos, 9h economizadas/advogado/semana, 99,9% SLA)
- **Seção Portal do Cliente:** mockup de portal + texto explicativo
- **Pricing:** 3 planos
  - Solo: R$ 79/usuário/mês — processos, prazos, agenda, financeiro básico, suporte por e-mail
  - Escritório: R$ 149/usuário/mês (MAIS POPULAR) — tudo do Solo + Lexo IA & Jurimetria + Portal do Cliente + Timesheet + Gestão de usuários
  - Enterprise: sob consulta — SSO, API, gerente de conta, SLA premium
- **CTA final:** "Pronto para tirar o escritório do caos?"
- **Footer:** "© 2026 Lexo Tecnologia Jurídica · LGPD & ISO 27001"

### Paleta e tipografia

- Background: `oklch(0.10 0.018 264)`
- Accent: `--ac: oklch(0.66 0.18 274)` / `--ac2: oklch(0.72 0.14 300)`
- Font: Geist (400/500/600/700/800) + Geist Mono
- Scroll behavior: smooth, custom scrollbar

### Implementação

Página estática pura, sem auth, sem DB. Componente: `app/page.tsx`.

---

## 2. Login — `Lexo - Login.dc.html`

**Rota alvo:** `/login` (redesign do existente)

### Layout

Split 2 colunas (1.05fr + 1fr):

**Coluna esquerda (brand panel):**
- Background: `radial-gradient(900px 600px at 20% 0%, ...)` + blob roxo decorativo no canto inferior direito
- Badge pill "ÁREA DO CLIENTE"
- H1: "Acompanhe seus processos com total transparência."
- P: "Veja andamentos, documentos, audiências e a situação financeira do seu caso em tempo real."
- 3 feature bullets com ícones:
  - Andamentos atualizados automaticamente
  - Documentos e contratos sempre à mão
  - Acesso seguro e protegido por LGPD

**Coluna direita (form panel):**
- Background: `oklch(0.115 0.018 264)`
- Link "Voltar ao site" (← /landing)
- H2: "Entrar na sua conta"
- Subtítulo: "Use o e-mail cadastrado pelo seu escritório."
- Campo e-mail (ícone envelope + input)
- Campo senha (ícone cadeado + toggle show/hide + link "Esqueci minha senha")
- Checkbox "Manter-me conectado neste dispositivo"
- Botão primário "Entrar →"
- Divisor "ou"
- Botão Google OAuth (logo colorido + "Continuar com Google") — noop no design
- Link "Primeiro acesso? Ative sua conta" (→ /registrar)
- Rodapé de segurança: "Conexão segura · seus dados protegidos por LGPD"

### Fluxo

Login bem-sucedido → `/configuracoes/seguranca` (se TOTP ativo) → `/dashboard`

### Decisões pendentes

- A cópia "Área do Cliente" é voltada ao cliente final, mas o login serve advogados e admins também. Manter assim ou tornar neutro?
- Google OAuth: implementar GoogleProvider ou manter como noop/"em breve"?

---

## 3. Verificação 2FA — `Lexo - Verificação 2FA.dc.html`

**Rota alvo:** `/login/2fa` (nova rota no fluxo de login)

### Layout

Card centralizado (`max-width: 440px`) sobre fundo com `radial-gradient` da brand.

### Elementos

- Link "← Voltar ao login"
- Card com `border-radius: 20px`, background `oklch(0.13 0.018 264)`, sombra profunda
- Ícone shield com gradiente da brand (`oklch(0.66 0.18 274)`)
- H2: "Verificação em duas etapas"
- P: "Abra o Google Authenticator e digite o código de 6 dígitos gerado para a sua conta Lexo."
- Chip Google Authenticator: ícone Google colorido + "Google Authenticator" + email + badge "Vinculado"
- 6 inputs OTP individuais:
  - Layout visual: `[0][1][2] – [3][4][5]`
  - Largura 48px × altura 58px cada
  - Foco automático ao digitar, navegação por backspace
  - Paste inteligente (paste do código completo preenche todos os campos)
  - Border e background da brand quando preenchido
- Checkbox "Confiar neste dispositivo por 30 dias"
- Botão "Verificar e entrar →" (desativado com opacity 0.5 até todos os 6 dígitos preenchidos)
- Contador: "Não recebeu? Reenviar código em M:SS" (30s → clickable "Reenviar código")
- Link "Sem acesso ao app? Usar um código de backup"

### Ambiguidade de design

O timer "reenviar código" usa linguagem de email OTP, mas o chip mostra Google Authenticator (TOTP). Em TOTP não há reenvio — o app gera o código sozinho. O timer de 30s pode representar o tempo de expiração do código TOTP atual.

### Decisão pendente

- A 2FA hoje é apenas configuração (`/configuracoes/seguranca`). O design quer que ela apareça automaticamente no fluxo de login quando o usuário tiver TOTP ativado. Isso requer mudança no middleware de auth.

---

## 4. App — `Lexo Expandido.dc.html`

**Rota alvo:** `/dashboard` e novas sub-rotas

### Sidebar nova (categorizada)

```
[Logo] Lexo  [PRO]

Dashboard
Processos
Clientes
Agenda
Financeiro

── IA & INTELIGÊNCIA ──
Lexo IA        [NOVO]
Jurimetria     [NOVO]

── PRODUTIVIDADE ──
Timesheet      [NOVO]
Tarefas        [NOVO]
Andamentos     [NOVO]

── RELACIONAMENTO ──
Portal Cliente [NOVO]
Usuários

[Avatar] Dr. Gui Andrade / Admin · Andrade Adv.
```

### Topbar

- Search bar "Buscar processo, cliente, prazo… ⌘K"
- Botão "Perguntar à Lexo IA" (com ícone sparkle, estilo brand)
- Sino de notificações com indicador laranja

### Dashboard expandido

**5 KPI cards:**
1. Processos ativos (148 | ↑ 12 este mês)
2. Prazos próximos (9 | 2 urgentes · 7 dias)
3. Horas faturáveis (312h | ↑ 8% vs. mês anterior) — NOVO, requer Timesheet
4. Taxa de êxito prevista (74% | carteira ativa · IA) — NOVO, requer Jurimetria
5. Faturas em aberto (R$ 86,4k | 5 faturas)

**Chart row (2 colunas, proporção 1.7:1):**
- Chart SVG "Faturamento × Horas trabalhadas" (12 meses, 2 linhas com gradiente)
- Painel "A Lexo IA sugere" com 3 cards de ação sugerida

**Bottom row (3 colunas, proporção 1:1:1.5):**
- Donut chart "Processos por área" (Cível 38%, Trabalhista 27%, Tributário 18%, Família 11%)
- Bar chart "Prazos por risco" (Baixo, Médio, Alto, Crítico)
- Feed "Andamentos recentes" com badge AUTO

### Novas telas

#### Lexo IA (`/lexo-ia`)
- Layout 3 colunas: lista de conversas (236px) | chat central | painel de contexto (260px)
- Lista: botão "Nova conversa" + histórico recente
- Chat: mensagens com citas de fontes (processo, PDF), action buttons inline
- Chips de sugestão: "Resumir processo", "Redigir petição", "Calcular prazo", "Buscar jurisprudência"
- Painel contexto: mostra quais fontes a IA está lendo (processo, documento, prazo)

#### Jurimetria (`/jurimetria`)
- Filtros: processo, vara, assunto
- 3 KPI cards: probabilidade de êxito (anel 74%), duração estimada (14-18 meses), valor provável (R$ 45-80k)
- Tabela de casos semelhantes: caso, resultado, duração, valor

#### Timesheet (`/timesheet`)
- Banner de timer ativo com cronômetro + processo vinculado + botão parar
- Log diário de entradas de horas

#### Tarefas (`/tarefas`)
- Gestão de tarefas por processo

#### Andamentos (`/andamentos`)
- Feed de movimentações dos processos

#### Portal Cliente (`/portal-cliente`)
- Gestão de acesso dos clientes ao portal externo

---

## Decisões de produto abertas

| # | Questão | Impacto |
|---|---------|---------|
| 1 | Cópia "Área do Cliente" no login serve advogados e clientes. Manter? | UX/copy |
| 2 | Google OAuth no login: implementar ou botão "em breve"? | Dev effort alto |
| 3 | 2FA como step obrigatório no login (não só configuração)? | Auth middleware |
| 4 | Timer 2FA: expiração TOTP (30s) ou remover "reenviar"? | UX clarity |

## Ordem de implementação sugerida

1. **Landing Page** — zero risco, zero DB, zero breaking changes
2. **Login redesign** — zero risco, apenas UI
3. **App: sidebar + dashboard** — cosmético, alto impacto visual
4. **2FA redesign** — depende da decisão sobre fluxo de login
5. **Novas páginas do app** em fases: Lexo IA → Jurimetria → Andamentos → Timesheet → Tarefas → Portal Cliente
