import { google } from "googleapis";

function createOAuth2(credentials?: { refresh_token: string }) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/google-calendar/callback`
  );
  if (credentials) {
    client.setCredentials(credentials);
  }
  return client;
}

export function getAuthUrl(): string {
  return createOAuth2().generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
  });
}

export async function exchangeCode(code: string) {
  const { tokens } = await createOAuth2().getToken(code);
  return tokens;
}

const TYPE_LABEL: Record<string, string> = {
  PRAZO: "Prazo",
  AUDIENCIA: "Audiência",
  REUNIAO: "Reunião",
  OUTRO: "Compromisso",
};

type DeadlineForSync = {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  type: string;
  googleEventId?: string | null;
};

export async function syncDeadlineToGoogle(
  refreshToken: string,
  deadline: DeadlineForSync
): Promise<string | null> {
  try {
    const auth = createOAuth2({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: "v3", auth });

    const dateStr = deadline.date.toISOString().split("T")[0];
    const event = {
      summary: `[${TYPE_LABEL[deadline.type] ?? "Prazo"}] ${deadline.title}`,
      description: deadline.description ?? "",
      start: { date: dateStr },
      end: { date: dateStr },
    };

    if (deadline.googleEventId) {
      await calendar.events.update({
        calendarId: "primary",
        eventId: deadline.googleEventId,
        requestBody: event,
      });
      return deadline.googleEventId;
    }

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    return res.data.id ?? null;
  } catch (e) {
    console.error("[google-calendar] sync error:", e);
    return null;
  }
}

export async function deleteGoogleEvent(
  refreshToken: string,
  eventId: string
): Promise<void> {
  try {
    const auth = createOAuth2({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (e) {
    console.error("[google-calendar] delete error:", e);
  }
}
