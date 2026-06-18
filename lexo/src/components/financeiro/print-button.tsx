"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
      style={{ background: "oklch(0.66 0.18 274)", color: "white" }}
    >
      <Printer className="h-4 w-4" />
      Imprimir / Salvar PDF
    </button>
  );
}
