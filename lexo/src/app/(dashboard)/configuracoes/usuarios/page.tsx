import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InviteUserForm } from "@/components/usuarios/invite-user-form";
import { UserRoleForm } from "@/components/usuarios/user-role-form";
import { DeleteButton } from "@/components/delete-button";
import { removeUser } from "@/actions/usuarios";
import { Badge } from "@/components/ui/badge";
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

  const users = await db.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });

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

      <div className="rounded-xl border p-6 space-y-4 max-w-md">
        <h2 className="text-lg font-medium">Adicionar usuário</h2>
        <InviteUserForm />
      </div>
    </div>
  );
}
