import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InviteUserForm } from "@/components/usuarios/invite-user-form";
import { UserRoleForm } from "@/components/usuarios/user-role-form";
import { DeleteButton } from "@/components/delete-button";
import { removeUser, revokeInvite } from "@/actions/usuarios";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ADVOGADO: "Advogado",
  SECRETARIA: "Secretaria",
};

export default async function UsuariosPage() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, pendingInvites] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Gerenciamento de usuários</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                {user.id === session.user.id ? (
                  <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                ) : (
                  <UserRoleForm userId={user.id} currentRole={user.role} />
                )}
              </TableCell>
              <TableCell className="text-right">
                {user.id !== session.user.id && (
                  <DeleteButton
                    action={removeUser.bind(null, user.id)}
                    label="Remover"
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-medium text-muted-foreground">Convites pendentes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.name}</TableCell>
                  <TableCell className="text-muted-foreground">{invite.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[invite.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(invite.expiresAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteButton
                      action={revokeInvite.bind(null, invite.id)}
                      label="Revogar"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="rounded-xl border p-6 space-y-4 max-w-md">
        <h2 className="text-lg font-medium">Convidar usuário</h2>
        <p className="text-sm text-muted-foreground">
          Um email será enviado com o link para o usuário criar sua senha.
        </p>
        <InviteUserForm />
      </div>
    </div>
  );
}
