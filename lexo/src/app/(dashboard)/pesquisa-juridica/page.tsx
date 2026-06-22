import { auth } from "@/lib/auth";
import { LexoAIChat } from "./lexo-ai-chat";

export default async function LexoIAPage() {
  const session = await auth();
  return <LexoAIChat userEmail={session?.user?.email ?? undefined} />;
}
