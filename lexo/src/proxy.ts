import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:mp4|webm|png|jpe?g|gif|svg|webp|ico|txt|xml|json|woff2?)$).*)",
  ],
};
