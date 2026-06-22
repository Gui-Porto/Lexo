import type { NextAuthConfig } from "next-auth";

const PUBLIC_EXACT = ["/"];
const PUBLIC_PREFIX = ["/login", "/registrar", "/convite", "/portal"];

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        PUBLIC_EXACT.includes(nextUrl.pathname) ||
        PUBLIC_PREFIX.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublic) return true;
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));

      const role = (auth?.user as { role?: string })?.role;

      if (role === "SECRETARIA" && nextUrl.pathname.startsWith("/financeiro")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (
        role !== "ADMIN" &&
        nextUrl.pathname.startsWith("/configuracoes")
      ) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.organizationId = (user as any).organizationId;
        token.role = (user as any).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (!token.sub || !token.organizationId) return session;
      if (session.user) {
        session.user.id = token.sub;
        session.user.organizationId = token.organizationId as string;
        session.user.role = (token.role as any) ?? "ADVOGADO";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
