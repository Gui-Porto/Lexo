"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SparklesIcon, FileTextIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  tipo: "cliente" | "processo";
  onExtract: (data: Record<string, string | null>) => void;
}

export function PdfExtractor({ tipo, onExtract }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 10 MB)");
      return;
    }

    setFileName(file.name);
    setIsLoading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("tipo", tipo);

    try {
      const res = await fetch("/api/extrair-documento", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao extrair dados");
        return;
      }

      onExtract(json);
      toast.success("Dados extraídos e preenchidos automaticamente");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div
      className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {isLoading ? (
          <>
            <Loader2Icon className="size-4 animate-spin text-primary" />
            <span>Lendo o documento com IA...</span>
          </>
        ) : fileName ? (
          <>
            <FileTextIcon className="size-4 text-primary" />
            <span className="max-w-[200px] truncate">{fileName}</span>
          </>
        ) : (
          <>
            <SparklesIcon className="size-4 text-primary" />
            <span>Preencher automaticamente via PDF</span>
          </>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon />
        {fileName ? "Trocar arquivo" : "Importar PDF"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
