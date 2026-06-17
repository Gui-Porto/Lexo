import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }
  return session!;
}
