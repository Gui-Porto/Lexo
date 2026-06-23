import { redirect } from "next/navigation";

export default function SegurancaPage() {
  redirect("/configuracoes?tab=seguranca");
}
