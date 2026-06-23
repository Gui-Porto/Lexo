import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSecret } from "otplib";
import QRCode from "qrcode";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { TwoFASetupForm } from "./TwoFASetupForm";

export default async function TwoFASetupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/registrar");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpPendingSecret: true, totpEnabled: true },
  });

  if (!user) redirect("/registrar");
  if (user.totpEnabled) redirect("/processos");

  let secret: string;
  if (user.totpPendingSecret) {
    secret = decryptSecret(user.totpPendingSecret);
  } else {
    secret = generateSecret();
    await db.user.update({
      where: { id: session.user.id },
      data: { totpPendingSecret: encryptSecret(secret) },
    });
  }

  const email = user.email ?? "";
  const otpauthUrl = `otpauth://totp/Lexo:${encodeURIComponent(email)}?secret=${secret}&issuer=Lexo`;
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 130,
    margin: 1,
    color: { dark: "#0b0b10", light: "#ffffff" },
  });
  return <TwoFASetupForm email={email} qrDataUrl={qrDataUrl} />;
}
