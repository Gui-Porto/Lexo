import { redirect } from "next/navigation";

export default function UsuariosPage() {
  redirect("/configuracoes?tab=usuarios");
}
