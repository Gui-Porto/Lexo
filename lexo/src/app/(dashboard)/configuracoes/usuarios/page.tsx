import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InviteUserForm } from "@/components/usuarios/invite-user-form";
import { UserRoleForm } from "@/components/usuarios/user-role-form";
import { DeleteButton } from "@/components/delete-button";
import { removeUser, revokeInvite } from "@/actions/usuarios";
import { formatDate } from "@/lib/format";
import { getPlanLimits, canInviteMoreUsers, usersRemainingInPlan } from "@/lib/plan-permissions";
import { UserCog, Crown, Clock, Mail, Shield } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ADVOGADO: "Advogado",
  SECRETARIA: "Secretaria",
};

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  ADMIN: {
    bg: "oklch(0.66 0.18 274 / 14%)",
    color: "oklch(0.75 0.14 274)",
    border: "oklch(0.66 0.18 274 / 30%)",
  },
  ADVOGADO: {
    bg: "oklch(0.72 0.15 150 / 12%)",
    color: "oklch(0.72 0.15 150)",
    border: "oklch(0.72 0.15 150 / 25%)",
  },
  SECRETARIA: {
    bg: "oklch(0.70 0.16 50 / 12%)",
    color: "oklch(0.80 0.14 50)",
    border: "oklch(0.70 0.16 50 / 25%)",
  },
};

const AVATAR_GRADIENTS = [
  ["oklch(0.45 0.10 274)", "oklch(0.35 0.08 300)"],
  ["oklch(0.42 0.12 200)", "oklch(0.32 0.09 240)"],
  ["oklch(0.40 0.12 150)", "oklch(0.30 0.09 170)"],
  ["oklch(0.45 0.10 80)",  "oklch(0.35 0.08 60)"],
  ["oklch(0.45 0.10 300)", "oklch(0.35 0.08 320)"],
  ["oklch(0.42 0.10 30)",  "oklch(0.32 0.07 20)"],
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default async function UsuariosPage() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, pendingInvites, org] = await Promise.all([
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

  const plan = org?.plan ?? "trial";
  const limits = getPlanLimits(plan);
  const canInvite = canInviteMoreUsers(plan, users.length);
  const remaining = usersRemainingInPlan(plan, users.length);
  const isAtLimit = !canInvite;
  const hasLimit = limits.maxUsers !== Infinity;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
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
            <UserCog size={18} color="oklch(0.75 0.14 274)" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "oklch(0.97 0.008 264)", letterSpacing: "-0.4px", margin: 0 }}>
              Usuários
            </h1>
            <p style={{ fontSize: 13, color: "oklch(0.55 0.02 264)", marginTop: 2 }}>
              Gerencie quem tem acesso ao escritório
            </p>
          </div>
        </div>

        {/* Plano / limite */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: isAtLimit
              ? "oklch(0.70 0.18 30 / 10%)"
              : "oklch(0.66 0.18 274 / 8%)",
            border: `1px solid ${isAtLimit ? "oklch(0.70 0.18 30 / 25%)" : "oklch(0.66 0.18 274 / 20%)"}`,
            borderRadius: 10,
            padding: "8px 14px",
          }}
        >
          <Crown size={13} color={isAtLimit ? "oklch(0.70 0.18 30)" : "oklch(0.66 0.18 274)"} />
          <span style={{ fontSize: 12, fontWeight: 600, color: isAtLimit ? "oklch(0.75 0.14 30)" : "oklch(0.72 0.12 274)" }}>
            {hasLimit
              ? `${users.length} / ${limits.maxUsers} usuários · Plano ${limits.label}`
              : `${users.length} usuários · Plano ${limits.label} (ilimitado)`}
          </span>
        </div>
      </div>

      {/* Aviso de limite */}
      {isAtLimit && (
        <div
          style={{
            background: "oklch(0.70 0.18 30 / 9%)",
            border: "1px solid oklch(0.70 0.18 30 / 25%)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.82 0.14 50)", margin: 0 }}>
              Limite de usuários atingido
            </p>
            <p style={{ fontSize: 12, color: "oklch(0.65 0.10 50)", marginTop: 2 }}>
              O plano {limits.label} permite até {limits.maxUsers} usuários.{" "}
              <a href="/planos" style={{ color: "oklch(0.75 0.14 274)", textDecoration: "underline" }}>
                Faça upgrade para adicionar mais.
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.45 0.02 264)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          Membros ativos
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((user, i) => {
            const [c1, c2] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
            const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS.ADVOGADO;
            const isMe = user.id === session.user.id;

            return (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "oklch(0.155 0.02 264)",
                  border: `1px solid ${isMe ? "oklch(0.66 0.18 274 / 20%)" : "oklch(1 0 0 / 7%)"}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Geist', sans-serif",
                  }}
                >
                  {initials(user.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.94 0.01 264)" }}>
                      {user.name}
                    </span>
                    {isMe && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "oklch(0.66 0.18 274 / 14%)",
                          color: "oklch(0.75 0.14 274)",
                          border: "1px solid oklch(0.66 0.18 274 / 25%)",
                          borderRadius: 99,
                          padding: "2px 8px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        VOCÊ
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <Mail size={11} color="oklch(0.45 0.02 264)" />
                    <span style={{ fontSize: 12, color: "oklch(0.55 0.02 264)" }}>{user.email}</span>
                  </div>
                </div>

                {/* Papel */}
                <div style={{ flexShrink: 0 }}>
                  {isMe ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        borderRadius: 8,
                        padding: "4px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Shield size={11} />
                      {ROLE_LABELS[user.role]}
                    </span>
                  ) : (
                    <UserRoleForm userId={user.id} currentRole={user.role} />
                  )}
                </div>

                {/* Remover */}
                {!isMe && (
                  <div style={{ flexShrink: 0 }}>
                    <DeleteButton
                      action={removeUser.bind(null, user.id)}
                      label="Remover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Convites pendentes */}
      {pendingInvites.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.45 0.02 264)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Convites pendentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingInvites.map((invite) => {
              const roleStyle = ROLE_COLORS[invite.role] ?? ROLE_COLORS.ADVOGADO;
              return (
                <div
                  key={invite.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "oklch(0.135 0.016 264)",
                    border: "1px dashed oklch(1 0 0 / 10%)",
                    borderRadius: 14,
                    padding: "14px 16px",
                  }}
                >
                  {/* Avatar placeholder */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "oklch(0.22 0.018 264)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock size={16} color="oklch(0.45 0.02 264)" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "oklch(0.72 0.01 264)" }}>
                      {invite.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <Mail size={11} color="oklch(0.40 0.02 264)" />
                      <span style={{ fontSize: 12, color: "oklch(0.48 0.02 264)" }}>{invite.email}</span>
                    </div>
                  </div>

                  {/* Papel */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: roleStyle.bg,
                      color: roleStyle.color,
                      border: `1px solid ${roleStyle.border}`,
                      borderRadius: 8,
                      padding: "4px 10px",
                      flexShrink: 0,
                    }}
                  >
                    {ROLE_LABELS[invite.role]}
                  </span>

                  {/* Expira em */}
                  <span style={{ fontSize: 11, color: "oklch(0.45 0.02 264)", flexShrink: 0, whiteSpace: "nowrap" }}>
                    expira {formatDate(invite.expiresAt)}
                  </span>

                  {/* Revogar */}
                  <div style={{ flexShrink: 0 }}>
                    <DeleteButton
                      action={revokeInvite.bind(null, invite.id)}
                      label="Revogar"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Convidar usuário */}
      <div
        style={{
          background: canInvite
            ? "oklch(0.135 0.018 264)"
            : "oklch(0.11 0.014 264)",
          border: canInvite
            ? "1px solid oklch(1 0 0 / 7%)"
            : "1px solid oklch(1 0 0 / 5%)",
          borderRadius: 16,
          padding: "22px 24px",
          maxWidth: 480,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: canInvite ? "oklch(0.92 0.01 264)" : "oklch(0.45 0.02 264)", margin: 0 }}>
            Convidar usuário
          </h2>
          {hasLimit && !isAtLimit && (
            <span style={{ fontSize: 11, color: "oklch(0.55 0.02 264)" }}>
              {remaining === Infinity ? "" : `${remaining} vaga${remaining !== 1 ? "s" : ""} restante${remaining !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "oklch(0.50 0.02 264)", marginBottom: 18 }}>
          {canInvite
            ? "Um email será enviado com o link para o usuário criar sua senha."
            : "Limite de usuários atingido. Faça upgrade do plano para convidar mais pessoas."}
        </p>
        {canInvite ? (
          <InviteUserForm />
        ) : (
          <a
            href="/planos"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "linear-gradient(135deg, oklch(0.66 0.18 274), oklch(0.55 0.2 290))",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px oklch(0.66 0.18 274 / 35%)",
            }}
          >
            ⚡ Ver planos e fazer upgrade
          </a>
        )}
      </div>
    </div>
  );
}
