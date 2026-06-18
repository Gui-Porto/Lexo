"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparklesIcon, Loader2Icon, CopyIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  caseId: string;
  caseNumber: string;
}

export function ResumoGenerator({ caseId, caseNumber }: Props) {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const didGenerate = useRef(false);

  async function generate() {
    setIsLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/resumo-processo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error ?? "Erro ao gerar resumo");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!didGenerate.current) {
      didGenerate.current = true;
      generate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    toast.success("Copiado para a área de transferência");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Resumo — {caseNumber}
          </CardTitle>
          <div className="flex gap-2">
            {output && !isLoading && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <CopyIcon />Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={generate} disabled={isLoading}>
                  <RefreshCwIcon />Regenerar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !output && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Analisando o processo...
          </div>
        )}
        <div
          ref={outputRef}
          className="max-h-[70vh] overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap"
        >
          {output}
          {isLoading && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
