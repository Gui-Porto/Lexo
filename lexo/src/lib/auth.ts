import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { cookies } from "next/headers";

// Hash bcrypt "morto" (nunca bate com senha real), usado quando passwordHash é
// null (conta só-Google) — sem isso, pular o bcrypt.compare vira um timing
// oracle que revela se um email é conta-com-senha ou conta-só-Google.
const DUMMY_PASSWORD_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uQxTmrjOWMoQR7ExY9BR9YKvGYNrGwoO";

export async function verifyPassword(passwordHash: string | null, password: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash ?? DUMMY_PASSWORD_HASH);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        totpCode: {},
        pendingToken: {},
        signupToken: {},
      },
      authorize: async (credentials) => {
        const pendingToken = credentials?.pendingToken as string | undefined;

        // 2FA second step: verify encrypted pending token + TOTP code
        if (pendingToken) {
          const totpCode = credentials?.totpCode as string | undefined;
          if (!totpCode) return null;
          try {
            const payload = JSON.parse(decryptSecret(pendingToken)) as {
              userId: string;
              exp: number;
            };
            if (Date.now() > payload.exp) return null;
            const user = await db.user.findUnique({ where: { id: payload.userId } });
            if (!user?.totpEnabled || !user.totpSecret) return null;
            const result = verifySync({
              token: totpCode.trim(),
              secret: decryptSecret(user.totpSecret),
            });
            if (!result.valid) return null;
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

        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const totpCode = credentials?.totpCode as string | undefined;
        if (!email || !password) return null;

        // 🔒 SEGURANÇA [VULN-3]: trava brute force/credential stuffing por email
        // (CWE-307). 10 tentativas / 15 min. Retorna null (mesma resposta de credencial
        // inválida) para não revelar o estado de bloqueio.
        if (!(await checkRateLimit(`login:${email.toLowerCase()}`, 10, 15 * 60))) {
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await verifyPassword(user.passwordHash, password);
        if (!valid) return null;

        if (user.totpEnabled && user.totpSecret) {
          if (!totpCode) return null;
          // 🔒 SEGURANÇA [VULN-6]: decifra o segredo TOTP para validar o código.
          const totpResult = verifySync({
            token: totpCode.trim(),
            secret: decryptSecret(user.totpSecret),
          });
          if (!totpResult.valid) return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Login via Google: usuário já existente entra direto; convite pendente cria
    // a conta do convidado; sinalização de cadastro cria uma nova Organization+ADMIN.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      // ponytail: debug temporário pra rastrear bug de "conta não cadastrada" em prod
      // sem acesso a logs — remover depois de diagnosticado.
      try {
      if (profile?.email_verified === false) return "/login?error=AccessDenied&debug=email_unverified";

      const email = (user.email ?? "").toLowerCase();

      const cookieStore = await cookies();
      // Lê e limpa TODOS os cookies de fluxo pendente de uma vez, antes de decidir
      // o branch — evita que um cookie órfão de um fluxo abandonado (ex: signup
      // cancelado no meio do consentimento do Google) vaze pra um login seguinte.
      const inviteToken = cookieStore.get("pending_invite_token")?.value;
      const signupFlag = cookieStore.get("google_signup")?.value;
      if (inviteToken) cookieStore.delete("pending_invite_token");
      if (signupFlag) cookieStore.delete("google_signup");

      const dbUser = await db.user.findUnique({ where: { email } });
      if (dbUser) {
        user.id = dbUser.id;
        (user as { organizationId?: string; role?: string }).organizationId = dbUser.organizationId;
        (user as { organizationId?: string; role?: string }).role = dbUser.role;
        return true;
      }

      // Aceite de convite via Google: cria a conta se o convite for válido e o email bater.
      if (inviteToken) {
        const invite = await db.userInvite.findUnique({ where: { token: inviteToken } });
        if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
          return `/convite/${inviteToken}?error=convite_invalido`;
        }
        if (invite.email.toLowerCase() !== email) {
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
          await tx.userInvite.updateMany({
            where: { id: invite.id, organizationId: invite.organizationId },
            data: { acceptedAt: new Date() },
          });
          return created;
        });
        user.id = newUser.id;
        (user as { organizationId?: string; role?: string }).organizationId = newUser.organizationId;
        (user as { organizationId?: string; role?: string }).role = newUser.role;
        return true;
      }

      // Cadastro de organização via Google: ainda não existe Organization —
      // só confirma a identidade e manda completar o nome do escritório.
      if (signupFlag) {
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

      const cookieNames = cookieStore.getAll().map((c) => c.name).join(",") || "none";
      return `/login?error=AccessDenied&debug=nobranch|cookies:${encodeURIComponent(cookieNames)}`;
      } catch (e) {
        const msg = e instanceof Error ? `${e.name}:${e.message}` : String(e);
        return `/login?error=AccessDenied&debug=${encodeURIComponent("EXCEPTION|" + msg)}`;
      }
    },
  },
});
