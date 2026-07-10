# Login e cadastro via Google — design

## Contexto

O Lexo já tem login via Google restrito a usuários existentes (`src/lib/auth.ts`): o botão "Entrar com Google" na tela `/login` só autentica emails que já existem em `db.user`; caso contrário nega o login (tela padrão "Access Denied" do NextAuth).

Esse design estende o Google para os dois pontos de entrada onde hoje só existe fluxo por senha:

1. **`/registrar`** — criação de organização nova (trial), hoje via `registerOrganization()` (nome do escritório + nome + email + senha).
2. **`/convite/[token]`** — aceite de convite para organização já existente, hoje via `acceptInvite()` (define senha).

## Restrição de design (pedido explícito do usuário)

Não criar mecanismo de autenticação novo. Reaproveitar o que já existe e está validado no código:

- Provider `Google` do NextAuth (já usado no login).
- Provider `Credentials` com o padrão de token criptografado de uso único (já usado hoje para o segundo passo do 2FA via `pendingToken` em `authorize()`).
- `encryptSecret`/`decryptSecret` (`src/lib/crypto.ts`) — já usados para o cookie `pending_2fa`.
- Cookies httpOnly de curta duração — já usado (`pending_2fa`).

Nenhuma rota OAuth customizada nova, nenhuma URI de redirecionamento nova no Google Cloud Console além da que já existe para `/api/auth/callback/google`.

## Mudança de schema

`User.passwordHash` deixa de ser obrigatório: `String` → `String?`. Contas criadas via Google não têm senha. Login por senha continua idêntico para quem tem senha — todo `bcrypt.compare(password, user.passwordHash)` precisa de guarda para `passwordHash` nulo (trata como "credenciais inválidas", sem revelar que a conta é Google-only).

Nenhum outro campo novo — `passwordHash` nulo já é suficiente para diferenciar contas Google-only.

## Fluxo 1 — Registrar organização via Google

Problema central: criar uma `Organization` exige um dado que só o usuário sabe (nome do escritório), que não está disponível no momento em que o Google confirma a identidade. Logo a sessão completa (com `organizationId`) só pode existir depois que os dois dados — identidade Google + nome do escritório — estiverem juntos.

Passo a passo:

1. `/registrar` ganha um botão "Continuar com Google" (sem formulário de senha). Uma server action seta um cookie httpOnly curto (`google_signup=1`) e chama `signIn("google", { redirectTo: "/registrar/completar" })`.
2. No callback `signIn` de `auth.ts`: provider é `google`, email não existe em `db.user`, cookie `google_signup` presente →
   - **Não cria sessão.**
   - Criptografa `{ email, name, exp }` (TTL curto, ex. 10 min) com `encryptSecret` num novo cookie `pending_google_identity`.
   - Limpa o cookie `google_signup`.
   - Retorna a string de redirect `"/registrar/completar"` (NextAuth aceita string como retorno de `signIn` para redirecionar sem criar sessão, em vez de `true`/`false`).
3. Página `/registrar/completar` (nova): lê e decripta `pending_google_identity` no servidor.
   - Cookie ausente ou expirado → redireciona para `/registrar` (recomeça).
   - Válido → mostra "Continuando como {name} ({email})" (somente leitura) + único campo editável: nome do escritório.
4. Submissão (server action): decripta o cookie de novo (nunca confia em email vindo do client), confere que não existe usuário com esse email (guarda contra corrida), cria `Organization` + `User` (role `ADMIN`, `passwordHash: null`, `trialEndsAt` igual ao fluxo atual) numa transação, limpa o cookie `pending_google_identity`, gera `signupToken = encryptSecret(JSON.stringify({ userId, exp: Date.now() + 5*60*1000 }))` e chama `signIn("credentials", { signupToken, redirectTo: "/registrar/2fa" })`.
5. `authorize()` em `auth.ts` ganha um novo branch (ao lado do `pendingToken` de 2FA e do email/senha): se `credentials.signupToken` presente, decripta, confere expiração, busca `db.user.findUnique({ where: { id: payload.userId } })` e retorna o objeto de usuário completo (`id`, `name`, `email`, `organizationId`, `role`) — mesmo formato que os outros branches.

Esse é o único ponto do fluxo em que uma sessão de fato é criada — nunca existe um estado "logado mas sem organização".

6. Redireciona para `/registrar/2fa` — página existente, sem nenhuma alteração. 2FA continua obrigatório para todo mundo, independente de como logou (decisão confirmada com o usuário).

## Fluxo 2 — Aceitar convite via Google

Mais simples: o convite já carrega `email`, `name`, `role`, `organizationId` — nenhum dado extra precisa ser coletado depois do Google confirmar a identidade, então cabe tudo num único passo (sem tela intermediária).

1. `/convite/[token]` ganha um botão "Aceitar com Google" ao lado do formulário de senha existente. Server action seta cookie httpOnly curto `pending_invite_token=<token>` e chama `signIn("google", { redirectTo: "/processos" })`.
2. No callback `signIn`: provider `google`, email não existe em `db.user`, cookie `pending_invite_token` presente →
   - Busca o convite por token. Inválido, expirado ou já aceito → limpa o cookie e retorna redirect string `"/convite/" + token + "?error=convite_invalido"`.
   - Convite válido, mas `invite.email.toLowerCase() !== user.email.toLowerCase()` → limpa o cookie e retorna redirect string `"/convite/" + token + "?error=google_mismatch"` (mensagem: "a conta Google usada não corresponde ao email convidado").
   - Emails batem → dentro de uma transação: cria `User` (`name`/`role`/`organizationId` do convite, `passwordHash: null`) e marca `invite.acceptedAt`. Preenche `user.id`/`organizationId`/`role` no objeto retornado ao NextAuth. Limpa o cookie. Retorna `true` — sessão completa criada imediatamente (todos os dados já disponíveis, sem necessidade do token de `authorize()`).
3. A partir daqui o email já existe em `db.user` → **o botão "Entrar com Google" em `/login`, já implementado, funciona sem nenhuma mudança** para esse usuário em logins futuros.

## Tratamento de erro / UX

- `/convite/[token]` passa a ler `?error=convite_invalido` / `?error=google_mismatch` da URL e mostrar mensagem amigável (mesmo padrão visual do erro já usado no formulário de senha).
- Para o caso já existente de `/login` negar um Google login de email desconhecido (o "Access Denied" que o usuário viu na prática), `pages.error` em `authConfig` passa a apontar para `/login` (hoje não está definido, cai no default feio do NextAuth); `/login` passa a ler `?error=` da URL e mostrar mensagem amigável, reaproveitando o bloco de erro que o formulário de senha já tem.

## Fora de escopo (explicitamente adiado)

- Usuário Google-only "criar senha depois" (login híbrido) — decisão do usuário: contas Google não têm senha, ponto.
- Pular 2FA para quem entra via Google — decisão do usuário: 2FA continua obrigatório pra todo mundo.
- Linkar uma conta Google a uma conta que já tem senha (hoje são exclusivos: ou nasceu com senha, ou nasceu via Google).
