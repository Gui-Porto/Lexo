import { type DefaultSession } from "next-auth";

type Role = "ADMIN" | "ADVOGADO" | "SECRETARIA";

declare module "next-auth" {
  interface User {
    organizationId: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    role?: Role;
  }
}
