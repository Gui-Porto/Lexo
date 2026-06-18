import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteForm } from "./accept-form";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db.userInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  const invalid = !invite || invite.acceptedAt || invite.expiresAt < new Date();

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
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
