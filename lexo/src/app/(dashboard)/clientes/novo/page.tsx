import { ClientForm } from "@/components/clientes/client-form";
import { createClient } from "@/actions/clientes";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo cliente</h1>
      <ClientForm action={createClient} submitLabel="Criar cliente" />
    </div>
  );
}
