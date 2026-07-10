# Login e cadastro via Google — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estender o login com Google (já existente e restrito a usuários cadastrados) para os dois pontos de entrada que hoje só têm fluxo por senha: `/registrar` (criação de organização) e `/convite/[token]` (aceite de convite).

**Architecture:** Reaproveita 100% da infraestrutura de auth existente — provider `Google` e `Credentials` do NextAuth, `encryptSecret`/`decryptSecret` (AES-256-GCM) e cookies httpOnly de curta duração, no mesmo padrão já usado pelo 2FA (`pending_2fa`). Nenhuma rota OAuth nova, nenhuma dependência nova. O callback `signIn` de `src/lib/auth.ts` ganha dois novos branches (convite e cadastro) ao lado do branch de login já existente; o `authorize()` da Credentials provider ganha um branch novo (`signupToken`) ao lado do já existente (`pendingToken` do 2FA).

**Tech Stack:** Next.js 16 App Router, NextAuth v5 (Auth.js), Prisma + PostgreSQL, bcryptjs, Zod, shadcn/ui (Base UI).

## Global Constraints

- Não criar mecanismo de autenticação novo — reaproveitar Google provider, Credentials provider, `encryptSecret`/`decryptSecret`, cookies httpOnly já existentes.
- Nenhuma rota OAuth customizada nova; a URI de callback do Google Cloud Console continua sendo só `/api/auth/callback/google`.
- `User.passwordHash` vira opcional (`String?`). Todo `bcrypt.compare(password, user.passwordHash)` precisa de guarda para `passwordHash` nulo, tratando como "credenciais inválidas" (nunca revelar que a conta é Google-only).
- 2FA continua obrigatório para todo mundo que passa pelo fluxo de registro de organização (Fluxo 1), independente de como logou. O fluxo de aceite de convite (Fluxo 2) não força 2FA — isso já é o comportamento atual do aceite por senha (`totpEnabled` nasce `false`), então não há mudança de postura aqui.
- Fora de escopo (não implementar): login híbrido "criar senha depois" para contas Google-only; pular 2FA no registro via Google; linkar conta Google a uma conta que já tem senha.
- Este projeto **não tem suite de testes** (confirmado em `CLAUDE.md`). A verificação de cada tarefa é: `npx tsc --noEmit` (typecheck) + passo manual no navegador com `npm run dev`. O baseline atual do `tsc --noEmit` já tem 1 erro pré-existente e não relacionado em `next.config.ts:8` (`'eslint' does not exist in type 'NextConfig'`) — ignore-o; o critério de sucesso é "nenhum erro novo nos arquivos tocados por esta tarefa".

---

### Task A: `passwordHash` opcional + guarda contra null

**Files:**
- Modify: `prisma/schema.prisma:84`
- Modify: `src/lib/auth.ts:68`
- Modify: `src/actions/login.ts:35`
- Migration: `prisma/migrations/<timestamp>_make_password_hash_optional/` (gerada pelo Prisma CLI)

**Interfaces:**
- Produces: `User.passwordHash: string | null` no client Prisma gerado (`src/generated/prisma`) — todo código subsequente que ler `user.passwordHash` deve tratar `null`.

- [ ] **Step 1: Tornar `passwordHash` opcional no schema**

Em `prisma/schema.prisma`, linha 84:

```diff
-  passwordHash          String
+  passwordHash          String?
```

- [ ] **Step 2: Gerar e aplicar a migration**

Rodar (a partir de `lexo/`):

```bash
npx prisma migrate dev --name make_password_hash_optional
```

Expected: Prisma detecta a mudança (`ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;`), cria a migration em `prisma/migrations/`, aplica no banco local e regenera o client em `src/generated/prisma`. Nenhuma linha existente é afetada (coluna vira nullable, dados atuais continuam válidos).

- [ ] **Step 3: Guardar `bcrypt.compare` contra `passwordHash` nulo em `src/lib/auth.ts`**

Linha 68, dentro do branch de email/senha do `authorize()`:

```diff
-        const valid = await bcrypt.compare(password, user.passwordHash);
+        const valid = user.passwordHash
+          ? await bcrypt.compare(password, user.passwordHash)
+          : false;
```

- [ ] **Step 4: Mesma guarda em `src/actions/login.ts`**

Linha 35:

```diff
-  const valid = await bcrypt.compare(password, user.passwordHash);
+  const valid = user.passwordHash
+    ? await bcrypt.compare(password, user.passwordHash)
+    : false;
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: mesmo único erro pré-existente de `next.config.ts:8`. Nenhum erro novo em `auth.ts`, `login.ts` ou `schema.prisma`/client gerado (o tipo `passwordHash: string | null` agora exigiria a guarda acima — sem ela, o `tsc` acusaria erro de tipo no argumento de `bcrypt.compare`).

- [ ] **Step 6: Verificação manual — login por senha continua funcionando**

```bash
npm run dev
```

Acessar `http://localhost:3000/login`, entrar com um usuário existente que tem senha (ex. `trial@lexo.dev` / `senha123`, conforme seed). Esperado: login continua funcionando normalmente, sem regressão.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/auth.ts src/actions/login.ts src/generated/prisma
git commit -m "feat(auth): torna passwordHash opcional para contas Google-only"
```

---

### Task B: Erro amigável no `/login` quando o Google nega (email desconhecido)

**Files:**
- Modify: `src/lib/auth.config.ts:9`
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: nenhum (independente das outras tasks).
- Produces: padrão de exibição de erro via `?error=` na URL de `/login`, reaproveitado por Task C e Task D quando redirecionam para lá com erro.

- [ ] **Step 1: Apontar `pages.error` para `/login`**

Em `src/lib/auth.config.ts`, linha 9:

```diff
-  pages: { signIn: "/login" },
+  pages: { signIn: "/login", error: "/login" },
```

- [ ] **Step 2: Ler `?error=` na página de login e mostrar mensagem amigável**

Em `src/app/login/page.tsx`, adicionar o import de `useSearchParams` (linha 3):

```diff
-import { useActionState, useState } from "react";
+import { useActionState, useState } from "react";
+import { useSearchParams } from "next/navigation";
```

Dentro do componente `LoginPage`, logo após a linha `const [showPass, setShowPass] = useState(false);` (linha 58), adicionar:

```tsx
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const oauthErrorMessage =
    oauthError === "AccessDenied"
      ? "Essa conta Google não está cadastrada. Peça um convite ao administrador do seu escritório."
      : oauthError
      ? "Não foi possível entrar com o Google. Tente novamente."
      : null;
```

Na seção de erro do formulário (linha 290, bloco `{state?.error && (...)}`), trocar a condição para também cobrir o erro do Google:

```diff
-            {state?.error && (
+            {(state?.error || oauthErrorMessage) && (
               <div style={{ background: "oklch(0.62 0.18 22 / 12%)", border: "1px solid oklch(0.62 0.18 22 / 28%)", borderRadius: 9, padding: "10px 14px", fontFamily: F, fontSize: 13, color: "oklch(0.78 0.14 22)" }}>
-                {state.error}
+                {state?.error ?? oauthErrorMessage}
               </div>
             )}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: mesmo único erro pré-existente de `next.config.ts:8`.

- [ ] **Step 4: Verificação manual**

```bash
npm run dev
```

Acessar `/login`, clicar em "Entrar com Google" e autenticar com uma conta Google cujo email **não** existe em `db.user`. Esperado: volta para `/login?error=AccessDenied` mostrando "Essa conta Google não está cadastrada..." em vez da tela padrão feia do NextAuth.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.config.ts src/app/login/page.tsx
git commit -m "feat(auth): mensagem amigavel quando login Google nega email desconhecido"
```

---

### Task C: Aceitar convite via Google

**Files:**
- Modify: `src/lib/auth.ts` (imports + `signIn` callback)
- Modify: `src/actions/convite.ts`
- Modify: `src/app/convite/[token]/page.tsx`

**Interfaces:**
- Consumes: `passwordHash: string | null` (Task A); padrão de erro `?error=` (Task B, mesmo estilo visual, página diferente).
- Produces: cookie httpOnly `pending_invite_token` (nome exato, usado só dentro deste task); `acceptInviteWithGoogle(token: string): Promise<void>` em `src/actions/convite.ts`, chamada via `.bind(null, token)` em formulário.

- [ ] **Step 1: Import de `cookies` em `src/lib/auth.ts`**

Linha 9, adicionar:

```diff
 import { decryptSecret } from "@/lib/crypto";
+import { cookies } from "next/headers";
```

- [ ] **Step 2: Estender o `signIn` callback com o branch de convite**

Substituir o callback inteiro (linhas 99-107) por:

```ts
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email ?? "";
      const dbUser = await db.user.findUnique({ where: { email } });
      if (dbUser) {
        user.id = dbUser.id;
        (user as { organizationId?: string; role?: string }).organizationId = dbUser.organizationId;
        (user as { organizationId?: string; role?: string }).role = dbUser.role;
        return true;
      }

      const cookieStore = await cookies();

      // Aceite de convite via Google: cria a conta se o convite for válido e o email bater.
      const inviteToken = cookieStore.get("pending_invite_token")?.value;
      if (inviteToken) {
        cookieStore.delete("pending_invite_token");
        const invite = await db.userInvite.findUnique({ where: { token: inviteToken } });
        if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
          return `/convite/${inviteToken}?error=convite_invalido`;
        }
        if (invite.email.toLowerCase() !== email.toLowerCase()) {
          return `/convite/${inviteToken}?error=google_mismatch`;
        }
        const newUser = await db.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              name: invite.name,
              email: invite.email,
              passwordHash: null,
              role: invite.role,
              organizationId: invite.organizationId,
            },
          });
          await tx.userInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
          return created;
        });
        user.id = newUser.id;
        (user as { organizationId?: string; role?: string }).organizationId = newUser.organizationId;
        (user as { organizationId?: string; role?: string }).role = newUser.role;
        return true;
      }

      return false;
    },
```

- [ ] **Step 3: Nova server action `acceptInviteWithGoogle` em `src/actions/convite.ts`**

Adicionar os imports no topo do arquivo:

```diff
 import { z } from "zod";
 import bcrypt from "bcryptjs";
 import { redirect } from "next/navigation";
 import { db } from "@/lib/db";
+import { cookies } from "next/headers";
+import { signIn } from "@/lib/auth";
```

Adicionar ao final do arquivo (depois de `acceptInvite`):

```ts
export async function acceptInviteWithGoogle(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("pending_invite_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  await signIn("google", { redirectTo: "/processos" });
}
```

- [ ] **Step 4: Botão "Aceitar com Google" + exibição de erro em `/convite/[token]`**

Em `src/app/convite/[token]/page.tsx`, atualizar a assinatura para ler `searchParams` e trocar os imports:

```diff
+import { acceptInviteWithGoogle } from "@/actions/convite";
 import { AcceptInviteForm } from "./accept-form";

 export default async function ConvitePage({
   params,
+  searchParams,
 }: {
   params: Promise<{ token: string }>;
+  searchParams: Promise<{ error?: string }>;
 }) {
   const { token } = await params;
+  const { error } = await searchParams;
```

Adicionar o mapeamento de mensagem logo abaixo de `const invalid = ...` (linha 23):

```ts
  const errorMessage =
    error === "convite_invalido"
      ? "Este convite não é mais válido."
      : error === "google_mismatch"
      ? "A conta Google usada não corresponde ao email convidado."
      : null;
```

Dentro do `<CardContent>` (depois de `<AcceptInviteForm token={token} />`, linha 50), adicionar:

```tsx
              {errorMessage && (
                <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
              )}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <form action={acceptInviteWithGoogle.bind(null, token)}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <svg width={16} height={16} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/>
                  </svg>
                  Aceitar com Google
                </button>
              </form>
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: mesmo único erro pré-existente de `next.config.ts:8`.

- [ ] **Step 6: Verificação manual**

```bash
npm run dev
```

Criar um convite de teste via Prisma Studio (`npx prisma studio` → tabela `UserInvite` → novo registro com `email` igual à sua conta Google de teste, `expiresAt` no futuro, `organizationId` de uma organização existente).

- Acessar `/convite/<token>`, clicar "Aceitar com Google", autenticar com a conta cujo email bate com o convite. Esperado: usuário criado, `invite.acceptedAt` preenchido, sessão criada, redireciona para `/processos`.
- Repetir com uma conta Google de email diferente do convite. Esperado: volta para `/convite/<token>?error=google_mismatch` mostrando a mensagem.
- Repetir com um token inexistente na URL. Esperado: `?error=convite_invalido`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/actions/convite.ts src/app/convite/[token]/page.tsx
git commit -m "feat(auth): aceitar convite via Google"
```

---

### Task D: Registrar organização via Google — parte 1 (confirmar identidade)

**Files:**
- Modify: `src/lib/auth.ts` (imports + `signIn` callback)
- Modify: `src/actions/auth.ts`
- Modify: `src/app/registrar/page.tsx`

**Interfaces:**
- Consumes: `cookies()` já importado em `auth.ts` (Task C).
- Produces: cookie httpOnly `google_signup` (setado por `signupWithGoogle`); cookie httpOnly `pending_google_identity` contendo JSON cifrado `{ email: string; name: string; exp: number }` — consumido por Task E na página `/registrar/completar`. `signupWithGoogle(): Promise<void>` em `src/actions/auth.ts`.

- [ ] **Step 1: Import de `encryptSecret` em `src/lib/auth.ts`**

Linha 9:

```diff
-import { decryptSecret } from "@/lib/crypto";
+import { decryptSecret, encryptSecret } from "@/lib/crypto";
```

- [ ] **Step 2: Estender o `signIn` callback com o branch de cadastro**

Dentro do `signIn` callback criado na Task C, logo antes do `return false;` final, adicionar:

```ts
      // Cadastro de organização via Google: ainda não existe Organization —
      // só confirma a identidade e manda completar o nome do escritório.
      const signupFlag = cookieStore.get("google_signup")?.value;
      if (signupFlag) {
        cookieStore.delete("google_signup");
        const payload = JSON.stringify({
          email,
          name: user.name ?? "",
          exp: Date.now() + 10 * 60 * 1000,
        });
        cookieStore.set("pending_google_identity", encryptSecret(payload), {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 600,
          secure: process.env.NODE_ENV === "production",
        });
        return "/registrar/completar";
      }

      return false;
```

- [ ] **Step 3: Nova server action `signupWithGoogle` em `src/actions/auth.ts`**

Adicionar os imports no topo do arquivo:

```diff
 import { z } from "zod";
 import bcrypt from "bcryptjs";
 import { db } from "@/lib/db";
 import { signIn } from "@/lib/auth";
+import { cookies } from "next/headers";
```

Adicionar ao final do arquivo:

```ts
export async function signupWithGoogle() {
  const cookieStore = await cookies();
  cookieStore.set("google_signup", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  await signIn("google", { redirectTo: "/registrar/completar" });
}
```

- [ ] **Step 4: Botão "Continuar com Google" em `/registrar`**

Em `src/app/registrar/page.tsx`, adicionar o import (linha 5):

```diff
 import { registerOrganization } from "@/actions/auth";
+import { signupWithGoogle } from "@/actions/auth";
```

(Ou combinar numa linha só: `import { registerOrganization, signupWithGoogle } from "@/actions/auth";`.)

Dentro do bloco do STEP 1 (`<div style={{ display: step === 1 ? "contents" : "none" }}>`, linhas 208-302), logo depois do botão "Avançar →" (fechamento em linha 301, antes do `</div>` de fechamento do bloco de step 1 em linha 302), adicionar:

```tsx
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 4px" }}>
                <div style={{ flex: 1, height: 1, background: "oklch(1 0 0 / 8%)" }} />
                <span style={{ font: `400 12px ${F}`, color: "oklch(0.48 0.02 264)" }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "oklch(1 0 0 / 8%)" }} />
              </div>

              <form action={signupWithGoogle}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 11,
                    background: "oklch(0.165 0.02 264)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    cursor: "pointer",
                    font: `600 14px ${F}`,
                    color: "oklch(0.90 0.01 264)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/>
                  </svg>
                  Continuar com Google
                </button>
              </form>
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: mesmo único erro pré-existente de `next.config.ts:8`.

- [ ] **Step 6: Verificação manual**

```bash
npm run dev
```

Acessar `/registrar`, clicar "Continuar com Google" (ainda no step 1, sem preencher nada), autenticar com uma conta Google cujo email **não** existe em `db.user`. Esperado: redireciona para `/registrar/completar` (página ainda não existe até a Task E — por enquanto confirme via `npx prisma studio` que **nenhum** `User`/`Organization` foi criado, e que a página quebra com 404, o que é esperado até a Task E).

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/actions/auth.ts src/app/registrar/page.tsx
git commit -m "feat(auth): confirmar identidade Google no fluxo de registro"
```

---

### Task E: Registrar organização via Google — parte 2 (completar cadastro)

**Files:**
- Modify: `src/lib/auth.ts` (`credentials` config + `authorize()`)
- Modify: `src/actions/auth.ts` (nova action `completeGoogleSignup`)
- Create: `src/app/registrar/completar/page.tsx`
- Create: `src/app/registrar/completar/complete-form.tsx`

**Interfaces:**
- Consumes: cookie `pending_google_identity` (Task D, JSON `{ email, name, exp }`); `RegisterResult`-like padrão de erro (`{ error: string } | undefined`).
- Produces: `CompleteSignupResult = { error: string } | undefined`; `completeGoogleSignup(_prevState: CompleteSignupResult, formData: FormData): Promise<CompleteSignupResult>`.

- [ ] **Step 1: Adicionar `signupToken` à Credentials provider e ao `authorize()` em `src/lib/auth.ts`**

No objeto `credentials` do provider `Credentials` (linhas 15-20):

```diff
       credentials: {
         email: {},
         password: {},
         totpCode: {},
         pendingToken: {},
+        signupToken: {},
       },
```

Dentro de `authorize`, logo depois do branch `pendingToken` (fecha na linha 51, antes de `const email = credentials?.email as string | undefined;`), adicionar:

```ts
        const signupToken = credentials?.signupToken as string | undefined;
        if (signupToken) {
          try {
            const payload = JSON.parse(decryptSecret(signupToken)) as {
              userId: string;
              exp: number;
            };
            if (Date.now() > payload.exp) return null;
            const user = await db.user.findUnique({ where: { id: payload.userId } });
            if (!user) return null;
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              organizationId: user.organizationId,
              role: user.role,
            };
          } catch {
            return null;
          }
        }
```

- [ ] **Step 2: Nova server action `completeGoogleSignup` em `src/actions/auth.ts`**

Adicionar os imports:

```diff
 import { db } from "@/lib/db";
 import { signIn } from "@/lib/auth";
 import { cookies } from "next/headers";
+import { decryptSecret, encryptSecret } from "@/lib/crypto";
```

Adicionar ao final do arquivo:

```ts
export type CompleteSignupResult = { error: string } | undefined;

export async function completeGoogleSignup(
  _prevState: CompleteSignupResult,
  formData: FormData
): Promise<CompleteSignupResult> {
  const organizationName = ((formData.get("organizationName") as string) ?? "").trim();
  if (organizationName.length < 2) {
    return { error: "Nome do escritório muito curto" };
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get("pending_google_identity")?.value;
  if (!raw) return { error: "Sessão expirada. Comece o cadastro novamente." };

  let identity: { email: string; name: string; exp: number };
  try {
    identity = JSON.parse(decryptSecret(raw)) as { email: string; name: string; exp: number };
  } catch {
    return { error: "Sessão expirada. Comece o cadastro novamente." };
  }
  if (Date.now() > identity.exp) {
    return { error: "Sessão expirada. Comece o cadastro novamente." };
  }

  const existingUser = await db.user.findUnique({ where: { email: identity.email } });
  if (existingUser) return { error: "Já existe um usuário com este email" };

  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let userId: string;
  try {
    const org = await db.organization.create({
      data: {
        name: organizationName,
        trialEndsAt,
        users: {
          create: {
            name: identity.name || identity.email,
            email: identity.email,
            passwordHash: null,
            role: "ADMIN",
          },
        },
      },
      include: { users: true },
    });
    userId = org.users[0].id;
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return { error: "Já existe um usuário com este email" };
    }
    console.error("[auth] erro ao registrar organização via Google:", e);
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  cookieStore.delete("pending_google_identity");

  const signupToken = encryptSecret(JSON.stringify({ userId, exp: Date.now() + 5 * 60 * 1000 }));
  await signIn("credentials", { signupToken, redirectTo: "/registrar/2fa" });
}
```

- [ ] **Step 3: Página `/registrar/completar`**

Criar `src/app/registrar/completar/page.tsx`:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSecret } from "@/lib/crypto";
import { CompleteSignupForm } from "./complete-form";

export default async function CompletarCadastroPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("pending_google_identity")?.value;
  if (!raw) redirect("/registrar");

  let identity: { email: string; name: string; exp: number };
  try {
    identity = JSON.parse(decryptSecret(raw)) as { email: string; name: string; exp: number };
  } catch {
    redirect("/registrar");
  }
  if (Date.now() > identity.exp) redirect("/registrar");

  return <CompleteSignupForm email={identity.email} name={identity.name} />;
}
```

- [ ] **Step 4: Formulário `complete-form.tsx`**

Criar `src/app/registrar/completar/complete-form.tsx`, reaproveitando a paleta visual das outras telas de auth:

```tsx
"use client";

import { useActionState } from "react";
import { completeGoogleSignup } from "@/actions/auth";

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";

export function CompleteSignupForm({ email, name }: { email: string; name: string }) {
  const [state, formAction, pending] = useActionState(completeGoogleSignup, undefined);

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "oklch(0.115 0.018 264)", fontFamily: F, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <p style={{ font: `400 13px ${F}`, color: "oklch(0.56 0.02 264)", margin: "0 0 6px" }}>
          Continuando como <strong style={{ color: "oklch(0.9 0.01 264)" }}>{name}</strong> ({email})
        </p>
        <h2 style={{ font: `700 24px ${F}`, letterSpacing: "-.6px", color: "oklch(0.98 0.008 264)", margin: "0 0 20px" }}>
          Como se chama seu escritório?
        </h2>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", font: `500 13px ${F}`, color: "oklch(0.76 0.01 264)", marginBottom: 7 }}>
              Nome do escritório
            </label>
            <input
              name="organizationName"
              type="text"
              required
              minLength={2}
              placeholder="Ex.: Andrade Advocacia"
              style={{
                width: "100%",
                height: 46,
                padding: "0 14px",
                border: "1px solid oklch(1 0 0 / 12%)",
                borderRadius: 11,
                background: "oklch(0.145 0.02 264)",
                color: "oklch(0.95 0.01 264)",
                font: `400 14px ${F}`,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {state?.error && (
            <div style={{ background: "oklch(0.62 0.18 22 / 12%)", border: "1px solid oklch(0.62 0.18 22 / 28%)", borderRadius: 9, padding: "10px 14px", font: `400 13px ${F}`, color: "oklch(0.78 0.14 22)" }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 11,
              border: "none",
              background: pending ? "oklch(0.45 0.05 274)" : `linear-gradient(135deg,${AC},${AC2})`,
              color: "#fff",
              font: `600 15px ${F}`,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Criando conta…" : "Criar conta do escritório"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: mesmo único erro pré-existente de `next.config.ts:8`.

- [ ] **Step 6: Verificação manual — fluxo completo**

```bash
npm run dev
```

1. Acessar `/registrar`, clicar "Continuar com Google", autenticar com uma conta Google cujo email não existe em `db.user`.
2. Esperado: cai em `/registrar/completar` mostrando "Continuando como {name} ({email})".
3. Preencher o nome do escritório e submeter.
4. Esperado: `Organization` + `User` (role `ADMIN`, `passwordHash: null`, `trialEndsAt` ~30 dias) criados numa transação (conferir via `npx prisma studio`); sessão criada; redireciona para `/registrar/2fa` (obrigatório, sem pular).
5. Completar o setup de 2FA normalmente (fluxo já existente, sem alterações) e confirmar que cai em `/processos`.
6. Fazer logout e entrar de novo em `/login` com "Entrar com Google" usando a mesma conta — deve logar direto (fluxo já existente, sem mudanças, pois agora o email já existe em `db.user`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/actions/auth.ts src/app/registrar/completar
git commit -m "feat(auth): completar cadastro de organizacao via Google"
```

---

## Self-Review

**Cobertura da spec:**
- Restrição de reaproveitar auth existente (sem rota OAuth nova) → nenhuma task cria providers/rotas novas, só estende `signIn`/`authorize` já existentes. ✓
- Mudança de schema `passwordHash` opcional + guarda em todo `bcrypt.compare` → Task A (únicos dois call sites no código, confirmado via grep). ✓
- Fluxo 1 completo (cookie `google_signup` → `pending_google_identity` → página completar → transação → `signupToken` → `authorize()` → `/registrar/2fa` obrigatório) → Tasks D + E. ✓
- Fluxo 2 completo (cookie `pending_invite_token` → validação de convite/email → criação direta → sessão imediata) → Task C. ✓
- Erro amigável em `/convite/[token]` (`convite_invalido`, `google_mismatch`) → Task C, Step 4. ✓
- Erro amigável em `/login` (`pages.error` + leitura de `?error=`) → Task B. ✓
- Fora de escopo (login híbrido, pular 2FA, linkar conta) → nenhuma task implementa isso. ✓

**Placeholders:** nenhum "TBD"/"similar to Task N" — todo código é completo e copiável.

**Consistência de tipos:** `passwordHash: string | null` usado igual nas duas guardas (Task A); payload de `pending_google_identity` (`{ email, name, exp }`) igual em Task D (escrita) e Task E (leitura); payload de `signupToken` (`{ userId, exp }`) igual em Task E authorize() e completeGoogleSignup(); nomes de cookies (`pending_invite_token`, `google_signup`, `pending_google_identity`) idênticos entre quem seta e quem lê.

## Execution Handoff

Plano completo e salvo em `lexo/docs/superpowers/plans/2026-07-10-login-google-design.md`. Duas opções de execução:

**1. Subagent-Driven (recomendado)** — dispatch de um subagent novo por task, review entre tasks, iteração rápida.

**2. Inline Execution** — execução das tasks nesta sessão via executing-plans, com checkpoints de review.

Qual abordagem?
