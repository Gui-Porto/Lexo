import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { PesquisaForm } from "./pesquisa-form";
import { ScaleIcon } from "lucide-react";

export default async function PesquisaJuridicaPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <PageHeader title="Pesquisa Jurisprudencial" icon={ScaleIcon} />
      <PesquisaForm />
    </div>
  );
}
