import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// 🔒 SEGURANÇA [VULN-6]: cifra de segredos TOTP em repouso com AES-256-GCM (CWE-312).
// A chave NÃO fica no banco — é derivada de TOTP_ENC_KEY (ou, na ausência dela, do
// AUTH_SECRET que já existe em produção). Assim, um vazamento do banco não entrega
// os seeds TOTP em claro. Cada valor cifrado carrega seu próprio IV aleatório.

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const secret = process.env.TOTP_ENC_KEY ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("TOTP_ENC_KEY/AUTH_SECRET não configurado — impossível cifrar segredo TOTP");
  }
  // Deriva 32 bytes determinísticos da chave (o IV por mensagem garante a aleatoriedade).
  return scryptSync(secret, "lexo-totp-kdf-v1", 32);
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":")
  );
}

export function decryptSecret(stored: string): string {
  // Compatibilidade: segredos legados (anteriores à cifra) ficam em texto puro e
  // continuam válidos até o usuário reconfigurar o 2FA, sem lockout.
  if (!isEncrypted(stored)) {
    return stored;
  }
  const [ivB64, tagB64, ctB64] = stored.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
