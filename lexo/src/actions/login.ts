"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginResult = { error: string } | undefined;

export async function login(
  _prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      totpCode: formData.get("totpCode") ?? "",
      redirectTo: "/processos",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    throw error;
  }
}
