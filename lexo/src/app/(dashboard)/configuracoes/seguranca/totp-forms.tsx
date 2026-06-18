"use client";

import { useActionState } from "react";
import { confirmTwoFactor, disableTwoFactor } from "@/actions/totp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConfirmTwoFactorForm() {
  const [state, formAction, pending] = useActionState(confirmTwoFactor, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-xs">
      <div className="space-y-2">
        <Label htmlFor="totp-confirm">Código do aplicativo</Label>
        <Input
          id="totp-confirm"
          name="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          required
        />
        <p className="text-xs text-muted-foreground">
          Escaneie o QR code e insira o código de 6 dígitos para confirmar.
        </p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Verificando..." : "Confirmar e ativar 2FA"}
      </Button>
    </form>
  );
}

export function DisableTwoFactorForm() {
  const [state, formAction, pending] = useActionState(disableTwoFactor, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-xs">
      <div className="space-y-2">
        <Label htmlFor="totp-disable">Código atual do aplicativo</Label>
        <Input
          id="totp-disable"
          name="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          required
        />
        <p className="text-xs text-muted-foreground">
          Insira um código válido para confirmar a desativação.
        </p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Desativando..." : "Desativar 2FA"}
      </Button>
    </form>
  );
}
