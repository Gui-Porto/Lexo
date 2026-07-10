import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { acceptInviteWithGoogle } from "@/actions/convite";
import { AcceptInviteForm } from "./accept-form";

export default async function ConvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const invite = await db.userInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  const invalid = !invite || invite.acceptedAt || invite.expiresAt < new Date();

  const errorMessage =
    error === "convite_invalido"
      ? "Este convite não é mais válido."
      : error === "google_mismatch"
      ? "A conta Google usada não corresponde ao email convidado."
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/15 p-4">
      <Card className="w-full max-w-sm">
        {invalid ? (
          <>
            <CardHeader>
              <CardTitle>Convite inválido</CardTitle>
              <CardDescription>
                Este link de convite é inválido ou expirou. Peça ao administrador do escritório que envie um novo convite.
              </CardDescription>
            </CardHeader>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Bem-vindo ao Lexo</CardTitle>
              <CardDescription>
                Você foi convidado para <strong>{invite.organization.name}</strong> como{" "}
                <strong>{invite.name}</strong>. Crie uma senha para ativar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Conta: <span className="text-foreground">{invite.email}</span>
              </p>
              <AcceptInviteForm token={token} />
              {errorMessage && (
                <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
              )}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <form action={acceptInviteWithGoogle.bind(null, token)}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <svg width={16} height={16} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/>
                  </svg>
                  Aceitar com Google
                </button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
