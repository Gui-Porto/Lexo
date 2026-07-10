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

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        totpCode: {},
        pendingToken: {},
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

        const valid = user.passwordHash
          ? await bcrypt.compare(password, user.passwordHash)
          : false;
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
    // Login via Google só p/ usuário já existente (email cadastrado por convite).
    // Sem criação de conta/organização por essa via.
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
    },
  },
});
