"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparklesIcon, CopyIcon, PrinterIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

const TIPOS_DOCUMENTO = [
  "Petição Inicial",
  "Contestação",
  "Réplica",
  "Apelação",
  "Agravo de Instrumento",
  "Habeas Corpus",
  "Mandado de Segurança",
  "Memoriais",
  "Recurso Especial",
  "Recurso Extraordinário",
  "Embargos de Declaração",
  "Contrarrazões",
  "Exceção de Incompetência",
  "Impugnação ao Valor da Causa",
];

interface Props {
  caseId: string;
  caseNumber: string;
  clientName: string;
  area: string | null;
  description: string | null;
}

export function MinutaGenerator({ caseId, caseNumber, clientName, area, description }: Props) {
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [instrucoes, setInstrucoes] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    if (!tipoDocumento) {
      toast.error("Selecione o tipo de documento");
      return;
    }
    setIsLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/gerar-minuta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, tipoDocumento, instrucoes }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error ?? "Erro ao gerar minuta");
        return;
      }

      if (!res.body) {
        toast.error("Resposta sem conteúdo");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setOutput((prev) => prev + chunk);
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }

      toast.success("Minuta gerada com sucesso");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success("Copiado para a área de transferência");
  }

  function handlePrint() {
    if (!output) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${tipoDocumento} — Processo ${caseNumber}</title>
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.8; margin: 3cm 2.5cm; color: #000; }
    pre { white-space: pre-wrap; font-family: inherit; font-size: inherit; }
  </style>
</head>
<body><pre>${output.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body>
</html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Configurar documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Processo</Label>
            <p className="text-sm text-muted-foreground">
              {caseNumber} — {clientName}
              {area && ` · ${area}`}
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tipo">Tipo de documento</Label>
            <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v ?? "")}>
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue placeholder="Selecione o tipo de peça..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="instrucoes">Instruções adicionais (opcional)</Label>
            <Textarea
              id="instrucoes"
              placeholder="Ex.: incluir pedido de tutela de urgência, mencionar o prazo de 15 dias, usar tese X..."
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <SparklesIcon />
                Gerar minuta
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {(output || isLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {tipoDocumento || "Minuta"}
              </CardTitle>
              {output && !isLoading && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <CopyIcon />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <PrinterIcon />
                    Imprimir
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && !output && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Claude está redigindo a peça...
              </div>
            )}
            <div
              ref={outputRef}
              className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/30 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap"
            >
              {output}
              {isLoading && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
