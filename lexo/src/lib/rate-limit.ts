import { db } from "@/lib/db";

/**
 * 🔒 SEGURANÇA [VULN-3]: rate limiting de janela deslizante persistido no Postgres
 * (CWE-307 brute force, CWE-770 resource exhaustion). Protege login e rotas de IA
 * contra brute force de credenciais e exaustão da cota gratuita do Gemini/Resend.
 *
 * Não é estritamente atômico (count + create); sob burst pode liberar 1-2 a mais.
 * Isso é aceitável para rate limiting — falha de forma segura no lado de barrar abuso
 * sistemático, não em precisão exata por requisição.
 *
 * @returns true se a requisição está dentro do limite; false se deve ser bloqueada (429).
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSec: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowSec * 1000);

  try {
    // Limpa hits expirados desta chave para manter a tabela enxuta (índice [key, createdAt]).
    await db.rateHit.deleteMany({ where: { key, createdAt: { lt: since } } });

    const count = await db.rateHit.count({ where: { key, createdAt: { gte: since } } });
    if (count >= max) return false;

    await db.rateHit.create({ data: { key } });
    return true;
  } catch (e) {
    // Resiliência: se o store falhar (ex.: migration RateHit ainda não aplicada),
    // o rate limit é um controle secundário — falha ABERTO para não derrubar o login,
    // mas registra o incidente para diagnóstico. O controle volta a valer assim que a
    // tabela existir. NUNCA derrubar a autenticação por causa do limiter.
    console.error(`[rate-limit] store indisponível para "${key}", liberando requisição:`, e);
    return true;
  }
}

/** Extrai o IP do cliente respeitando o proxy do Render (x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
