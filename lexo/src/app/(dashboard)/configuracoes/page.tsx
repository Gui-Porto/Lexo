import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { generateURI } from "otplib";
import QRCode from "qrcode";
import { initiateTwoFactor } from "@/actions/totp";
import { decryptSecret } from "@/lib/crypto";
import { formatDate } from "@/lib/format";
import { getPlanLimits, canInviteMoreUsers, usersRemainingInPlan } from "@/lib/plan-permissions";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { InviteUserForm } from "@/components/usuarios/invite-user-form";
import { UserRoleForm } from "@/components/usuarios/user-role-form";
import { removeUser, revokeInvite } from "@/actions/usuarios";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  ClipboardList,
  Settings,
  Lock,
  UserCog,
  Crown,
  Mail,
  Clock,
  Link2,
  Link2Off,
} from "lucide-react";
import { ConfirmTwoFactorForm, DisableTwoFactorForm } from "./seguranca/totp-forms";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "seguranca",    label: "Segurança",     icon: Lock,          adminOnly: false },
  { key: "integracoes",  label: "Integrações",   icon: Link2,         adminOnly: false },
  { key: "usuarios",     label: "Usuários",      icon: UserCog,       adminOnly: true  },
  { key: "auditoria",    label: "Auditoria",     icon: ClipboardList, adminOnly: true  },
] as const;

type Tab = (typeof TABS)[number]["key"];

// ─── Usuários helpers ──────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ADVOGADO: "Advogado",
  SECRETARIA: "Secretaria",
};

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  ADMIN:     { bg: "#cef79e24", color: "#cef79e", border: "#cef79e4d" },
  ADVOGADO:  { bg: "oklch(0.72 0.15 150 / 12%)", color: "oklch(0.72 0.15 150)", border: "oklch(0.72 0.15 150 / 25%)" },
  SECRETARIA:{ bg: "oklch(0.75 0.16 80 / 12%)",  color: "oklch(0.75 0.16 80)",  border: "oklch(0.75 0.16 80 / 25%)"  },
};

const AVATAR_GRADIENTS = [
  ["#2c3b3c", "#2c3b3c"],
  ["#283738", "#283738"],
  ["#6d7f78", "#6d7f78"],
  ["#4d5757", "#4d5757"],
  ["#8fae94", "#8fae94"],
  ["#1a2425", "#1a2425"],
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const PAGE_SIZE = 50;

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    rawTab === "usuarios"   && isAdmin ? "usuarios"   :
    rawTab === "auditoria"  && isAdmin ? "auditoria"  :
    rawTab === "integracoes"           ? "integracoes":
    "seguranca";

  // --- Dados de Segurança + Integrações (sempre carrega) ---
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { totpEnabled: true, totpPendingSecret: true, email: true, googleCalendarEnabled: true },
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

  // --- Dados de Usuários (só para admin na aba certa) ---
  let users: Awaited<ReturnType<typeof db.user.findMany>> = [];
  let pendingInvites: Awaited<ReturnType<typeof db.userInvite.findMany>> = [];
  let org: { plan: string } | null = null;

  if (isAdmin && activeTab === "usuarios") {
    [users, pendingInvites, org] = await Promise.all([
      db.user.findMany({
        where: { organizationId: session.user.organizationId },
        orderBy: { createdAt: "asc" },
      }),
      db.userInvite.findMany({
        where: {
          organizationId: session.user.organizationId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { plan: true },
      }),
    ]);
  }

  const plan = org?.plan ?? "trial";
  const limits = getPlanLimits(plan);
  const canInvite = canInviteMoreUsers(plan, users.length);
  const remaining = usersRemainingInPlan(plan, users.length);
  const isAtLimit = !canInvite;
  const hasLimit = limits.maxUsers !== Infinity;

  // --- Dados de Auditoria (só para admin na aba certa) ---
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

  const AC = "#cef79e";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "#cef79e24",
            border: "1px solid #cef79e40",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Settings size={18} color="#cef79e" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.4px", margin: 0 }}>
            Configurações
          </h1>
          <p style={{ fontSize: 13, color: "#93a09f", marginTop: 2 }}>
            Segurança, usuários e logs de auditoria
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex", gap: 4,
          background: "#222f30",
          border: "1px solid #4d5757",
          borderRadius: 12, padding: 4,
          width: "fit-content", maxWidth: "100%", overflowX: "auto",
        }}
      >
        {TABS.filter((t) => !t.adminOnly || isAdmin).map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <a
              key={key}
              href={`/configuracoes?tab=${key}`}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 9,
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                background: isActive ? "#222f30" : "transparent",
                color: isActive ? "#ffffff" : "#93a09f",
                border: isActive ? "1px solid #4d5757" : "1px solid transparent",
                boxShadow: isActive ? "0 1px 4px oklch(0 0 0 / 20%)" : "none",
              }}
            >
              <Icon size={14} />
              {label}
            </a>
          );
        })}
      </div>

      {/* ─── Aba: Segurança ────────────────────────────────────────────────── */}
      {activeTab === "seguranca" && (
        <div
          style={{
            background: "#222f3099",
            border: "1px solid #4d5757",
            borderRadius: 18, padding: 24, maxWidth: 520,
            display: "flex", flexDirection: "column", gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: user?.totpEnabled ? "oklch(0.72 0.15 150 / 14%)" : "#283738",
                border: `1px solid ${user?.totpEnabled ? "oklch(0.72 0.15 150 / 25%)" : "#4d5757"}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              {user?.totpEnabled
                ? <ShieldCheck size={20} color="oklch(0.72 0.15 150)" />
                : <ShieldOff size={20} color="#93a09f" />}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                Verificação em dois fatores (2FA)
              </p>
              <p style={{ fontSize: 13, color: "#93a09f", marginTop: 3 }}>
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
                <p style={{ fontSize: 13, fontWeight: 600, color: "#93a09f", marginBottom: 10 }}>
                  1. Escaneie com Google Authenticator, Authy ou similar:
                </p>
                {qrDataUrl && (
                  <div style={{ display: "inline-block", borderRadius: 12, overflow: "hidden", border: "1px solid #4d5757" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR Code 2FA" width={200} height={200} />
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#93a09f", marginBottom: 8 }}>
                  Ou insira a chave manualmente:
                </p>
                <code
                  style={{
                    display: "block", borderRadius: 8, padding: "10px 14px",
                    fontSize: 12, fontFamily: "monospace", wordBreak: "break-all",
                    background: "#222f30cc",
                    color: "#cef79e",
                    border: "1px solid #cef79e33",
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

      {/* ─── Aba: Integrações ─────────────────────────────────────────────── */}
      {activeTab === "integracoes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
          {/* Google Calendar card */}
          {/* FIXME(theme): hue 145 (verde "conectado") não está na lista de hues excluídos (22/150/80),
              mas é claramente semântico (mesma família do success 150). Deixado inalterado por julgamento. */}
          <div
            style={{
              background: "#222f3099",
              border: "1px solid #4d5757",
              borderRadius: 18, padding: 24,
              display: "flex", flexDirection: "column", gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Google Calendar colorful icon */}
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: user?.googleCalendarEnabled ? "oklch(0.55 0.18 145 / 15%)" : "#283738",
                  border: `1px solid ${user?.googleCalendarEnabled ? "oklch(0.55 0.18 145 / 30%)" : "#4d5757"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {user?.googleCalendarEnabled
                  ? <Link2 size={20} color="oklch(0.65 0.18 145)" />
                  : <Link2Off size={20} color="#93a09f" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                  Google Agenda
                </p>
                <p style={{ fontSize: 13, color: "#93a09f", marginTop: 3 }}>
                  {user?.googleCalendarEnabled
                    ? "Conectado — prazos são sincronizados automaticamente."
                    : "Desconectado — conecte para sincronizar prazos e audiências."}
                </p>
              </div>
              {user?.googleCalendarEnabled && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: "oklch(0.55 0.18 145 / 14%)",
                  color: "oklch(0.68 0.16 145)",
                  border: "1px solid oklch(0.55 0.18 145 / 28%)",
                  borderRadius: 99, padding: "3px 10px", flexShrink: 0,
                }}>
                  Ativo
                </span>
              )}
            </div>

            {/* What gets synced */}
            <div style={{ background: "#222f30b3", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                O que é sincronizado
              </p>
              {[
                { icon: "⏰", text: "Prazos processuais" },
                { icon: "⚖️", text: "Audiências e sessões" },
                { icon: "🤝", text: "Reuniões agendadas" },
                { icon: "📌", text: "Outros compromissos" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "#93a09f" }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Action button */}
            {user?.googleCalendarEnabled ? (
              <form
                action="/api/google-calendar/disconnect"
                method="POST"
              >
                <button
                  type="submit"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "oklch(0.75 0.16 80 / 10%)",
                    color: "oklch(0.75 0.16 80)",
                    border: "1px solid oklch(0.75 0.16 80 / 25%)",
                    borderRadius: 10, padding: "10px 18px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <Link2Off size={14} />
                  Desconectar Google Agenda
                </button>
              </form>
            ) : (
              <a
                href="/api/google-calendar/connect"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "#cef79e",
                  color: "#222f30",
                  borderRadius: 10, padding: "11px 20px",
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                  width: "fit-content",
                }}
              >
                {/* Google "G" logo */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Conectar Google Agenda
              </a>
            )}

            {!user?.googleCalendarEnabled && (
              <p style={{ fontSize: 12, color: "#93a09f", margin: 0 }}>
                Você será redirecionado para a página de autorização do Google.
                Nenhuma senha do Google é armazenada no Lexo.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── Aba: Usuários ─────────────────────────────────────────────────── */}
      {activeTab === "usuarios" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Cabeçalho da aba */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <p style={{ fontSize: 13, color: "#93a09f", margin: 0 }}>
              {users.length} membro{users.length !== 1 ? "s" : ""} ativos
            </p>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: isAtLimit ? "oklch(0.75 0.16 80 / 10%)" : "#cef79e14",
                border: `1px solid ${isAtLimit ? "oklch(0.75 0.16 80 / 25%)" : "#cef79e33"}`,
                borderRadius: 9, padding: "6px 12px",
              }}
            >
              <Crown size={12} color={isAtLimit ? "oklch(0.75 0.16 80)" : AC} />
              <span style={{ fontSize: 12, fontWeight: 600, color: isAtLimit ? "oklch(0.75 0.16 80)" : "#cef79e" }}>
                {hasLimit
                  ? `${users.length} / ${limits.maxUsers} · Plano ${limits.label}`
                  : `Plano ${limits.label} · ilimitado`}
              </span>
            </div>
          </div>

          {/* Aviso de limite */}
          {isAtLimit && (
            <div
              style={{
                background: "oklch(0.75 0.16 80 / 9%)",
                border: "1px solid oklch(0.75 0.16 80 / 25%)",
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.75 0.16 80)", margin: 0 }}>
                  Limite de usuários atingido
                </p>
                <p style={{ fontSize: 12, color: "oklch(0.75 0.16 80)", marginTop: 2 }}>
                  O plano {limits.label} permite até {limits.maxUsers} usuários.{" "}
                  <a href="/planos" style={{ color: AC, textDecoration: "underline" }}>
                    Faça upgrade para adicionar mais.
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Lista de membros */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Membros ativos
            </p>
            {users.map((u, i) => {
              const [c1, c2] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
              const roleStyle = ROLE_COLORS[u.role] ?? ROLE_COLORS.ADVOGADO;
              const isMe = u.id === session.user.id;
              return (
                <div
                  key={u.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "#222f30",
                    border: `1px solid ${isMe ? "#cef79e33" : "#4d5757"}`,
                    borderRadius: 14, padding: "13px 16px",
                  }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c1}, ${c2})`,
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Geist', sans-serif",
                    }}
                  >
                    {initials(u.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>{u.name}</span>
                      {isMe && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: "#cef79e24", color: AC, border: "1px solid #cef79e40", borderRadius: 99, padding: "2px 8px" }}>
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                      <Mail size={11} color="#93a09f" />
                      <span style={{ fontSize: 12, color: "#93a09f" }}>{u.email}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {isMe ? (
                      <span style={{ fontSize: 11, fontWeight: 600, background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`, borderRadius: 8, padding: "4px 10px" }}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    ) : (
                      <UserRoleForm userId={u.id} currentRole={u.role} />
                    )}
                  </div>
                  {!isMe && (
                    <div style={{ flexShrink: 0 }}>
                      <DeleteButton action={removeUser.bind(null, u.id)} label="Remover" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Convites pendentes */}
          {pendingInvites.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Convites pendentes
              </p>
              {pendingInvites.map((invite) => {
                const roleStyle = ROLE_COLORS[invite.role] ?? ROLE_COLORS.ADVOGADO;
                return (
                  <div
                    key={invite.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      background: "#222f30",
                      border: "1px dashed #4d5757",
                      borderRadius: 14, padding: "13px 16px",
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#283738", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={15} color="#93a09f" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#93a09f" }}>{invite.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <Mail size={11} color="#93a09f" />
                        <span style={{ fontSize: 12, color: "#93a09f" }}>{invite.email}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`, borderRadius: 8, padding: "4px 10px", flexShrink: 0 }}>
                      {ROLE_LABELS[invite.role]}
                    </span>
                    <span style={{ fontSize: 11, color: "#93a09f", flexShrink: 0, whiteSpace: "nowrap" }}>
                      expira {formatDate(invite.expiresAt)}
                    </span>
                    <div style={{ flexShrink: 0 }}>
                      <DeleteButton action={revokeInvite.bind(null, invite.id)} label="Revogar" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Convidar usuário */}
          <div
            style={{
              background: canInvite ? "#222f30" : "#222f30",
              border: canInvite ? "1px solid #4d5757" : "1px solid #4d5757",
              borderRadius: 16, padding: "20px 22px", maxWidth: 460,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: canInvite ? "#ffffff" : "#93a09f", margin: 0 }}>
                Convidar usuário
              </h3>
              {hasLimit && !isAtLimit && (
                <span style={{ fontSize: 11, color: "#93a09f" }}>
                  {remaining === Infinity ? "" : `${remaining} vaga${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}`}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "#93a09f", marginBottom: 16 }}>
              {canInvite
                ? "Um email será enviado com o link para o usuário criar sua senha."
                : "Limite atingido. Faça upgrade para convidar mais pessoas."}
            </p>
            {canInvite ? (
              <InviteUserForm />
            ) : (
              <a
                href="/planos"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: "#cef79e",
                  color: "#222f30", borderRadius: 10, padding: "10px 18px",
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                }}
              >
                ⚡ Ver planos e fazer upgrade
              </a>
            )}
          </div>
        </div>
      )}

      {/* ─── Aba: Auditoria ────────────────────────────────────────────────── */}
      {activeTab === "auditoria" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#93a09f", margin: 0 }}>
            {auditTotal} registro{auditTotal !== 1 ? "s" : ""} de auditoria
          </p>

          {auditLogs.length === 0 ? (
            <div style={{ padding: "60px 32px", textAlign: "center", background: "#222f30", border: "1px dashed #4d5757", borderRadius: 16 }}>
              <p style={{ fontSize: 14, color: "#93a09f", margin: 0 }}>
                Nenhuma ação registrada ainda.
              </p>
            </div>
          ) : (
            <div className="r-tablewrap" style={{ background: "#222f30", border: "1px solid #4d5757", borderRadius: 16, overflow: "hidden" }}>
              <div className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "160px 150px 180px 1fr", padding: "10px 20px", background: "#222f30", borderBottom: "1px solid #4d5757" }}>
                {["Data", "Usuário", "Ação", "Descrição"].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {h}
                  </span>
                ))}
              </div>
              {auditLogs.map((log, i) => (
                <div key={log.id} className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "160px 150px 180px 1fr", padding: "12px 20px", borderBottom: i < auditLogs.length - 1 ? "1px solid #4d5757" : "none", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#93a09f", fontVariantNumeric: "tabular-nums" }}>{formatDate(log.createdAt)}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#93a09f" }}>{log.userName}</span>
                  <span>
                    <span style={{ borderRadius: 6, padding: "3px 8px", fontSize: 11, fontFamily: "monospace", fontWeight: 600, background: "#cef79e1a", color: "#cef79e", border: "1px solid #cef79e33" }}>
                      {log.action}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: "#93a09f" }}>{log.description}</span>
                </div>
              ))}
            </div>
          )}

          {auditTotalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
              <span style={{ fontSize: 13, color: "#93a09f" }}>
                Página {auditPage} de {auditTotalPages} · {auditTotal} registros
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {auditPage > 1 && (
                  <a href={`?tab=auditoria&page=${auditPage - 1}`} style={{ fontSize: 13, color: AC, textDecoration: "none", fontWeight: 500 }}>← Anterior</a>
                )}
                {auditPage < auditTotalPages && (
                  <a href={`?tab=auditoria&page=${auditPage + 1}`} style={{ fontSize: 13, color: AC, textDecoration: "none", fontWeight: 500 }}>Próxima →</a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
