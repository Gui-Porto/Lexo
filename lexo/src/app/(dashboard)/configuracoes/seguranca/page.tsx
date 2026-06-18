import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { generateURI } from "otplib";
import QRCode from "qrcode";
import { initiateTwoFactor } from "@/actions/totp";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { ConfirmTwoFactorForm, DisableTwoFactorForm } from "./totp-forms";

export default async function SegurancaPage() {
  const session = await requireSession();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { totpEnabled: true, totpPendingSecret: true, email: true },
  });

  let qrDataUrl: string | null = null;
  let manualKey: string | null = null;

  if (user?.totpPendingSecret) {
    const uri = generateURI({ label: user.email ?? "", issuer: "Lexo", secret: user.totpPendingSecret });
    qrDataUrl = await QRCode.toDataURL(uri, { width: 200, margin: 2, color: { dark: "#e2e8f0", light: "#161b25" } });
    manualKey = user.totpPendingSecret;
  }

  return (
    <div className="space-y-8">
      <PageHeader icon={Shield} title="Segurança" />

      <div
        className="rounded-2xl p-6 max-w-lg space-y-5"
        style={{
          background: "oklch(0.14 0.016 264 / 0.6)",
          border: "1px solid oklch(1 0 0 / 0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          {user?.totpEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-400" />
          ) : (
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">Verificação em dois fatores (2FA)</p>
            <p className="text-sm text-muted-foreground">
              {user?.totpEnabled
                ? "Ativado — sua conta está protegida com TOTP."
                : "Desativado — adicione uma camada extra de segurança ao seu login."}
            </p>
          </div>
        </div>

        {user?.totpEnabled ? (
          <DisableTwoFactorForm />
        ) : user?.totpPendingSecret ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                1. Escaneie com Google Authenticator, Authy ou similar:
              </p>
              {qrDataUrl && (
                <div className="inline-block rounded-xl overflow-hidden border" style={{ borderColor: "oklch(1 0 0 / 0.1)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code 2FA" width={200} height={200} />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Ou insira a chave manualmente:</p>
              <code
                className="block rounded px-3 py-2 text-xs font-mono break-all"
                style={{
                  background: "oklch(0.11 0.016 264 / 0.8)",
                  color: "oklch(0.75 0.12 274)",
                  border: "1px solid oklch(0.66 0.18 274 / 0.2)",
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
    </div>
  );
}
