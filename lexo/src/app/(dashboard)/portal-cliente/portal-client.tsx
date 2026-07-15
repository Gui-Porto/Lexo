"use client";

import { useTransition } from "react";
import { enableClientPortal, disableClientPortal, regeneratePortalToken } from "@/actions/portal-cliente";

const AC = "#cef79e";

export function PortalToggle({
  clientId,
  enabled,
  token,
  baseUrl,
}: {
  clientId: string;
  enabled: boolean;
  token: string | null;
  baseUrl: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      if (enabled) {
        await disableClientPortal(clientId);
      } else {
        await enableClientPortal(clientId);
      }
    });
  }

  function handleRegenerate() {
    if (!confirm("Gerar novo link? O link atual será invalidado.")) return;
    startTransition(async () => {
      await regeneratePortalToken(clientId);
    });
  }

  function handleCopy() {
    if (token) navigator.clipboard.writeText(`${baseUrl}/portal/${token}`);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {/* Toggle */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: enabled ? "rgb(5 150 105 / 0.15)" : "#222f30",
          border: `1px solid ${enabled ? "rgb(5 150 105 / 0.35)" : "#4d5757"}`,
          borderRadius: 20,
          padding: "5px 14px",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.5 : 1,
          transition: "all 0.2s",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: enabled ? "#34d399" : "#93a09f",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: enabled ? "#34d399" : "#93a09f" }}>
          {isPending ? "…" : enabled ? "Ativo" : "Inativo"}
        </span>
      </button>

      {/* Copy link */}
      {enabled && token && (
        <>
          <button
            onClick={handleCopy}
            title={`${baseUrl}/portal/${token}`}
            style={{
              background: `${AC}12`,
              border: `1px solid ${AC}25`,
              borderRadius: 8,
              padding: "5px 12px",
              cursor: "pointer",
              fontSize: 12,
              color: AC,
              fontWeight: 500,
            }}
          >
            🔗 Copiar link
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isPending}
            style={{
              background: "none",
              border: "1px solid #4d5757",
              borderRadius: 8,
              padding: "5px 10px",
              cursor: isPending ? "not-allowed" : "pointer",
              fontSize: 12,
              color: "#93a09f",
              opacity: isPending ? 0.5 : 1,
            }}
          >
            ↻
          </button>
        </>
      )}
    </div>
  );
}
