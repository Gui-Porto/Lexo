import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { checkRateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        totpCode: {},
      },
      authorize: async (credentials) => {
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

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.totpEnabled && user.totpSecret) {
          if (!totpCode) return null;
          const totpResult = verifySync({ token: totpCode.trim(), secret: user.totpSecret });
          const totpValid = totpResult.valid;
          if (!totpValid) return null;
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
  ],
});
