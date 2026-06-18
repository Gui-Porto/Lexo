import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Lazy proxy: o cliente Resend só é instanciado no primeiro uso (runtime),
// nunca na avaliação do módulo. Evita que o build de produção falhe ao coletar
// dados das rotas quando RESEND_API_KEY está ausente.
export const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    return Reflect.get(getResend(), prop, receiver);
  },
});

export function inviteEmailHtml({
  orgName,
  inviteeName,
  acceptUrl,
}: {
  orgName: string;
  inviteeName: string;
  acceptUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0d1017;font-family:sans-serif;color:#e2e8f0">
  <div style="max-width:560px;margin:40px auto;background:#161b25;border-radius:12px;overflow:hidden;border:1px solid #1e2535">
    <div style="padding:24px 32px;background:linear-gradient(135deg,#3730a3,#6366f1)">
      <h1 style="margin:0;font-size:22px;color:#fff">Lexo · Convite</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#c7d2fe">${orgName}</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;font-size:15px;color:#e2e8f0">Olá, <strong>${inviteeName}</strong>!</p>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8">Você foi convidado para acessar o Lexo como membro de <strong style="color:#e2e8f0">${orgName}</strong>. Clique no botão abaixo para criar sua senha e ativar sua conta.</p>
      <a href="${acceptUrl}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Ativar minha conta</a>
      <p style="margin:24px 0 0;font-size:12px;color:#475569">O link expira em 7 dias. Se você não esperava este convite, pode ignorar este email.</p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1e2535;font-size:12px;color:#475569">
      Lexo · Sistema de Gestão Jurídica
    </div>
  </div>
</body>
</html>`;
}

export function deadlineReminderHtml({
  orgName,
  deadlines,
}: {
  orgName: string;
  deadlines: { title: string; caseNumber: string; date: string; daysLeft: number }[];
}): string {
  const rows = deadlines
    .map(
      (d) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2d3e">${d.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2d3e">${d.caseNumber}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2d3e">${d.date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2d3e;color:${d.daysLeft <= 3 ? "#f87171" : "#facc15"}">${d.daysLeft} dia${d.daysLeft !== 1 ? "s" : ""}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0d1017;font-family:sans-serif;color:#e2e8f0">
  <div style="max-width:600px;margin:40px auto;background:#161b25;border-radius:12px;overflow:hidden;border:1px solid #1e2535">
    <div style="padding:24px 32px;background:linear-gradient(135deg,#3730a3,#6366f1)">
      <h1 style="margin:0;font-size:22px;color:#fff">Lexo · Avisos de Prazo</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#c7d2fe">${orgName}</p>
    </div>
    <div style="padding:24px 32px">
      <p style="margin:0 0 16px;color:#94a3b8">Os seguintes prazos vencem em breve:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#1e2535;text-align:left">
            <th style="padding:8px 12px;color:#6366f1">Prazo</th>
            <th style="padding:8px 12px;color:#6366f1">Processo</th>
            <th style="padding:8px 12px;color:#6366f1">Data</th>
            <th style="padding:8px 12px;color:#6366f1">Faltam</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1e2535;font-size:12px;color:#475569">
      Lexo · Sistema de Gestão Jurídica
    </div>
  </div>
</body>
</html>`;
}
