import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSecret } from "@/lib/crypto";
import { CompleteSignupForm } from "./complete-form";

export default async function CompletarCadastroPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("pending_google_identity")?.value;
  if (!raw) redirect("/registrar");

  let identity: { email: string; name: string; exp: number };
  try {
    identity = JSON.parse(decryptSecret(raw)) as { email: string; name: string; exp: number };
  } catch {
    redirect("/registrar");
  }
  if (Date.now() > identity.exp) redirect("/registrar");

  return <CompleteSignupForm email={identity.email} name={identity.name} />;
}
