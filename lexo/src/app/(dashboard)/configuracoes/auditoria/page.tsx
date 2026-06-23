import { redirect } from "next/navigation";

export default function AuditoriaPage() {
  redirect("/configuracoes?tab=auditoria");
}
