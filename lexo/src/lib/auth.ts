import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";
import { decryptSecret } from "@/lib/crypto";

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
      const dbUser = await db.user.findUnique({ where: { email: user.email ?? "" } });
      if (!dbUser) return false;
      user.id = dbUser.id;
      (user as { organizationId?: string; role?: string }).organizationId = dbUser.organizationId;
      (user as { organizationId?: string; role?: string }).role = dbUser.role;
      return true;
    },
  },
});
