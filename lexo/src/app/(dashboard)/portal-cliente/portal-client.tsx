"use client";

import { useTransition } from "react";
import { enableClientPortal, disableClientPortal, regeneratePortalToken } from "@/actions/portal-cliente";

const AC = "oklch(0.66 0.18 274)";

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
          background: enabled ? "rgb(5 150 105 / 0.15)" : "oklch(0.18 0.018 264)",
          border: `1px solid ${enabled ? "rgb(5 150 105 / 0.35)" : "oklch(0.28 0.018 264)"}`,
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
            background: enabled ? "#34d399" : "oklch(0.35 0.018 264)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: enabled ? "#34d399" : "oklch(0.50 0.02 264)" }}>
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
              border: "1px solid oklch(0.28 0.018 264)",
              borderRadius: 8,
              padding: "5px 10px",
              cursor: isPending ? "not-allowed" : "pointer",
              fontSize: 12,
              color: "oklch(0.45 0.02 264)",
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
