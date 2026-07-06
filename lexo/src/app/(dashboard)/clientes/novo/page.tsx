import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ClientFormWrapper } from "@/components/clientes/client-form-wrapper";
import { createClient } from "@/actions/clientes";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Novo cliente" />
      <ClientFormWrapper action={createClient} submitLabel="Criar cliente" />
    </div>
  );
}
