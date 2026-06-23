import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { generateURI } from "otplib";
import QRCode from "qrcode";
import { initiateTwoFactor } from "@/actions/totp";
import { decryptSecret } from "@/lib/crypto";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  ClipboardList,
  Settings,
  Lock,
} from "lucide-react";
import { ConfirmTwoFactorForm, DisableTwoFactorForm } from "./seguranca/totp-forms";

const TABS = [
  { key: "seguranca", label: "Segurança", icon: Lock },
  { key: "auditoria", label: "Auditoria", icon: ClipboardList, adminOnly: true },
] as const;

type Tab = (typeof TABS)[number]["key"];

const PAGE_SIZE = 50;

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const isAdmin = session.user.role === "ADMIN";

  const rawTab = sp.tab ?? "seguranca";
  const activeTab: Tab =
    rawTab === "auditoria" && isAdmin ? "auditoria" : "seguranca";

  // --- Dados de Segurança ---
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { totpEnabled: true, totpPendingSecret: true, email: true },
  });

  let qrDataUrl: string | null = null;
  let manualKey: string | null = null;

  if (user?.totpPendingSecret) {
    const plainSecret = decryptSecret(user.totpPendingSecret);
    const uri = generateURI({ label: user.email ?? "", issuer: "Lexo", secret: plainSecret });
    qrDataUrl = await QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: { dark: "#e2e8f0", light: "#161b25" },
    });
    manualKey = plainSecret;
  }

  // --- Dados de Auditoria (só carrega se for admin na aba certa) ---
  let auditLogs: Awaited<ReturnType<typeof db.auditLog.findMany>> = [];
  let auditTotal = 0;
  let auditTotalPages = 0;
  const auditPage = Math.max(1, Number(sp.page ?? 1));

  if (isAdmin && activeTab === "auditoria") {
    [auditLogs, auditTotal] = await Promise.all([
      db.auditLog.findMany({
        where: { organizationId: session.user.organizationId },
        orderBy: { createdAt: "desc" },
        skip: (auditPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.auditLog.count({
        where: { organizationId: session.user.organizationId },
      }),
    ]);
    auditTotalPages = Math.ceil(auditTotal / PAGE_SIZE);
  }

  const AC = "oklch(0.66 0.18 274)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "oklch(0.66 0.18 274 / 14%)",
            border: "1px solid oklch(0.66 0.18 274 / 25%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings size={18} color="oklch(0.75 0.14 274)" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-0.4px", margin: 0 }}>
            Configurações
          </h1>
          <p style={{ fontSize: 13, color: "oklch(0.55 0.02 264)", marginTop: 2 }}>
            Segurança da conta e logs de auditoria
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "oklch(0.11 0.016 264)",
          border: "1px solid oklch(1 0 0 / 7%)",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
        }}
      >
        {TABS.filter((t) => !t.adminOnly || isAdmin).map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <a
              key={key}
              href={`/configuracoes?tab=${key}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.15s",
                background: isActive ? "oklch(0.155 0.02 264)" : "transparent",
                color: isActive ? "oklch(0.92 0.01 264)" : "oklch(0.50 0.02 264)",
                border: isActive ? "1px solid oklch(1 0 0 / 8%)" : "1px solid transparent",
                boxShadow: isActive ? "0 1px 4px oklch(0 0 0 / 20%)" : "none",
              }}
            >
              <Icon size={14} />
              {label}
            </a>
          );
        })}
      </div>

      {/* Aba: Segurança */}
      {activeTab === "seguranca" && (
        <div
          style={{
            background: "oklch(0.14 0.016 264 / 0.6)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: 18,
            padding: 24,
            maxWidth: 520,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: user?.totpEnabled
                  ? "oklch(0.72 0.15 150 / 14%)"
                  : "oklch(0.22 0.018 264)",
                border: `1px solid ${user?.totpEnabled ? "oklch(0.72 0.15 150 / 25%)" : "oklch(1 0 0 / 7%)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {user?.totpEnabled ? (
                <ShieldCheck size={20} color="oklch(0.72 0.15 150)" />
              ) : (
                <ShieldOff size={20} color="oklch(0.45 0.02 264)" />
              )}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "oklch(0.92 0.01 264)", margin: 0 }}>
                Verificação em dois fatores (2FA)
              </p>
              <p style={{ fontSize: 13, color: "oklch(0.55 0.02 264)", marginTop: 3 }}>
                {user?.totpEnabled
                  ? "Ativado — sua conta está protegida com TOTP."
                  : "Desativado — adicione uma camada extra de segurança."}
              </p>
            </div>
          </div>

          {user?.totpEnabled ? (
            <DisableTwoFactorForm />
          ) : user?.totpPendingSecret ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.85 0.01 264)", marginBottom: 10 }}>
                  1. Escaneie com Google Authenticator, Authy ou similar:
                </p>
                {qrDataUrl && (
                  <div
                    style={{
                      display: "inline-block",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid oklch(1 0 0 / 10%)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR Code 2FA" width={200} height={200} />
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.85 0.01 264)", marginBottom: 8 }}>
                  Ou insira a chave manualmente:
                </p>
                <code
                  style={{
                    display: "block",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    background: "oklch(0.11 0.016 264 / 0.8)",
                    color: "oklch(0.75 0.12 274)",
                    border: "1px solid oklch(0.66 0.18 274 / 20%)",
                  }}
                >
                  {manualKey}
                </code>
              </div>
              <ConfirmTwoFactorForm />
            </div>
          ) : (
            <form action={initiateTwoFactor}>
              <Button type="submit">Configurar 2FA</Button>
            </form>
          )}
        </div>
      )}

      {/* Aba: Auditoria */}
      {activeTab === "auditoria" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: "oklch(0.55 0.02 264)", margin: 0 }}>
              {auditTotal} registro{auditTotal !== 1 ? "s" : ""} de auditoria
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <div
              style={{
                padding: "60px 32px",
                textAlign: "center",
                background: "oklch(0.115 0.018 264)",
                border: "1px dashed oklch(0.25 0.018 264)",
                borderRadius: 16,
              }}
            >
              <p style={{ fontSize: 14, color: "oklch(0.45 0.02 264)", margin: 0 }}>
                Nenhuma ação registrada ainda.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "oklch(0.115 0.018 264)",
                border: "1px solid oklch(1 0 0 / 7%)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Cabeçalho */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 150px 180px 1fr",
                  gap: 0,
                  padding: "10px 20px",
                  background: "oklch(0.11 0.016 264)",
                  borderBottom: "1px solid oklch(1 0 0 / 7%)",
                }}
              >
                {["Data", "Usuário", "Ação", "Descrição"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "oklch(0.40 0.02 264)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Linhas */}
              {auditLogs.map((log, i) => (
                <div
                  key={log.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 150px 180px 1fr",
                    gap: 0,
                    padding: "12px 20px",
                    borderBottom: i < auditLogs.length - 1 ? "1px solid oklch(1 0 0 / 5%)" : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: "oklch(0.45 0.02 264)", fontVariantNumeric: "tabular-nums" }}>
                    {formatDate(log.createdAt)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "oklch(0.82 0.01 264)" }}>
                    {log.userName}
                  </span>
                  <span>
                    <span
                      style={{
                        borderRadius: 6,
                        padding: "3px 8px",
                        fontSize: 11,
                        fontFamily: "monospace",
                        fontWeight: 600,
                        background: "oklch(0.66 0.18 274 / 10%)",
                        color: "oklch(0.75 0.12 274)",
                        border: "1px solid oklch(0.66 0.18 274 / 20%)",
                      }}
                    >
                      {log.action}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: "oklch(0.55 0.02 264)" }}>
                    {log.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {auditTotalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
              <span style={{ fontSize: 13, color: "oklch(0.45 0.02 264)" }}>
                Página {auditPage} de {auditTotalPages} · {auditTotal} registros
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {auditPage > 1 && (
                  <a
                    href={`?tab=auditoria&page=${auditPage - 1}`}
                    style={{ fontSize: 13, color: AC, textDecoration: "none", fontWeight: 500 }}
                  >
                    ← Anterior
                  </a>
                )}
                {auditPage < auditTotalPages && (
                  <a
                    href={`?tab=auditoria&page=${auditPage + 1}`}
                    style={{ fontSize: 13, color: AC, textDecoration: "none", fontWeight: 500 }}
                  >
                    Próxima →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
