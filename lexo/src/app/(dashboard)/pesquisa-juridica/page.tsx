import { auth } from "@/lib/auth";
import { LexoAIChat } from "./lexo-ai-chat";

export default async function LexoIAPage() {
  const session = await auth();
  return (
    <div style={{ margin: "-26px -28px", height: "calc(100% + 52px)" }}>
      <LexoAIChat userEmail={session?.user?.email ?? undefined} />
    </div>
  );
}
