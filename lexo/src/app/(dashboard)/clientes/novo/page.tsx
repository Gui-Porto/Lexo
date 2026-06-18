import { ClientFormWrapper } from "@/components/clientes/client-form-wrapper";
import { createClient } from "@/actions/clientes";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo cliente</h1>
      <ClientFormWrapper action={createClient} submitLabel="Criar cliente" />
    </div>
  );
}
