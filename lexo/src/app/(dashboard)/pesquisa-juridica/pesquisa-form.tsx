"use client";

import { useRef, useState } from "react";
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
import { SearchIcon, Loader2Icon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

const AREAS = [
  "Cível", "Trabalhista", "Criminal", "Família",
  "Previdenciário", "Tributário", "Administrativo",
  "Imobiliário", "Empresarial", "Consumidor",
];

const TRIBUNAIS = [
  "Todos os tribunais",
  "STF — Supremo Tribunal Federal",
  "STJ — Superior Tribunal de Justiça",
  "TST — Tribunal Superior do Trabalho",
  "TSE — Tribunal Superior Eleitoral",
  "TJ — Tribunais de Justiça",
  "TRF — Tribunais Regionais Federais",
  "TRT — Tribunais Regionais do Trabalho",
];

const EXEMPLOS = [
  "Responsabilidade civil por danos morais em relação de consumo",
  "Usucapião urbana — requisitos e jurisprudência recente",
  "Horas extras em teletrabalho após reforma trabalhista",
  "Alimentos gravídicos — legitimidade e quantum",
  "Prisão preventiva — excesso de prazo razoável",
];

export function PesquisaForm() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) {
      toast.error("Digite uma consulta");
      return;
    }
    setIsLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/pesquisa-juridica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          area: area || undefined,
          tribunal: tribunal && tribunal !== "Todos os tribunais" ? tribunal : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error ?? "Erro na pesquisa");
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

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    toast.success("Copiado para a área de transferência");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-1.5">
            <Label htmlFor="query">Consulta jurisprudencial</Label>
            <Textarea
              id="query"
              placeholder="Ex.: Responsabilidade civil por danos morais em relação de consumo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Ctrl+Enter para pesquisar</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Área jurídica (opcional)</Label>
              <Select value={area} onValueChange={(v) => setArea(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Tribunal (opcional)</Label>
              <Select value={tribunal} onValueChange={(v) => setTribunal(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os tribunais" />
                </SelectTrigger>
                <SelectContent>
                  {TRIBUNAIS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            {isLoading ? (
              <><Loader2Icon className="animate-spin" />Pesquisando...</>
            ) : (
              <><SearchIcon />Pesquisar jurisprudência</>
            )}
          </Button>

          {!output && !isLoading && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Exemplos de consulta</p>
              <div className="flex flex-wrap gap-2">
                {EXEMPLOS.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setQuery(ex)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(output || isLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resultado da pesquisa</CardTitle>
              {output && !isLoading && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <CopyIcon />Copiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && !output && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Consultando jurisprudência...
              </div>
            )}
            <div
              ref={outputRef}
              className="max-h-[65vh] overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap"
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
