"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Printer } from "lucide-react";

export function ExportReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function buildUrl(format: "csv" | "print") {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    if (format === "csv") return `/api/relatorio/financeiro?${params}`;
    return `/financeiro/relatorio?${params}`;
  }

  return (
    <div
      className="rounded-xl p-4 space-y-4"
      style={{ background: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)" }}
    >
      <p className="text-sm font-medium">Exportar relatório financeiro</p>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="startDate" className="text-xs">De</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endDate" className="text-xs">Até</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <a href={buildUrl("csv")} download>
          <Button variant="secondary" className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </a>
        <a href={buildUrl("print")} target="_blank" rel="noreferrer">
          <Button variant="secondary" className="gap-2">
            <Printer className="h-4 w-4" />
            PDF (imprimir)
          </Button>
        </a>
      </div>
    </div>
  );
}
