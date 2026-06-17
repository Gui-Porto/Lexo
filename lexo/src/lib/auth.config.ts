import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/registrar"];

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p))) return true;
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
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
