import { google } from "googleapis";
import { isAllDayUTC } from "@/lib/agenda-date";

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

// ponytail: escritório é BR; sem timezone por usuário/org no schema ainda.
const TIMEZONE = "America/Sao_Paulo";

/**
 * O app guarda hora local (BR) nos getters UTC do Date (ver agenda-date.ts).
 * Serializa pro Google sem "Z" + timeZone explícito, senão o Google acha
 * que é hora UTC de verdade e mostra 3h a menos na tela.
 */
function toWallClockDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`;
}

/** Inverso: instante real (vindo do Google) → Date com hora local BR nos campos UTC. */
function fromGoogleDateTime(iso: string): Date {
  const real = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(real);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const hour = Number(get("hour")) % 24; // Intl pode devolver "24" pra meia-noite
  return new Date(Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day")), hour, Number(get("minute")), Number(get("second"))));
}

function parseGoogleStart(start: { date?: string | null; dateTime?: string | null }): Date | null {
  if (start.date) return new Date(`${start.date}T00:00:00.000Z`);
  if (start.dateTime) return fromGoogleDateTime(start.dateTime);
  return null;
}

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

    const allDay = isAllDayUTC(deadline.date);
    const dateStr = deadline.date.toISOString().split("T")[0];
    // ponytail: sem campo de duração no schema; evento com hora usa 1h fixa como padrão.
    const event = allDay
      ? {
          summary: `[${TYPE_LABEL[deadline.type] ?? "Prazo"}] ${deadline.title}`,
          description: deadline.description ?? "",
          start: { date: dateStr },
          end:   { date: dateStr },
        }
      : {
          summary: `[${TYPE_LABEL[deadline.type] ?? "Prazo"}] ${deadline.title}`,
          description: deadline.description ?? "",
          start: { dateTime: toWallClockDateTime(deadline.date), timeZone: TIMEZONE },
          end:   { dateTime: toWallClockDateTime(new Date(deadline.date.getTime() + 60 * 60 * 1000)), timeZone: TIMEZONE },
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

export type GoogleEventSummary = {
  googleEventId: string;
  title: string;
  description: string | null;
  date: Date;
};

export async function listUpcomingEvents(refreshToken: string): Promise<GoogleEventSummary[]> {
  try {
    const auth = createOAuth2({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: "v3", auth });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const twelveMonthsAhead = new Date();
    twelveMonthsAhead.setMonth(twelveMonthsAhead.getMonth() + 12);

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: sixMonthsAgo.toISOString(),
      timeMax: twelveMonthsAhead.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (res.data.items ?? [])
      .filter((e) => e.id && (e.start?.date || e.start?.dateTime))
      .map((e) => ({
        googleEventId: e.id!,
        title: e.summary ?? "Compromisso",
        description: e.description ?? null,
        date: parseGoogleStart(e.start!)!,
      }));
  } catch (e) {
    console.error("[google-calendar] list error:", e);
    return [];
  }
}

export type GoogleEventChange = {
  googleEventId: string;
  cancelled: boolean;
  title: string;
  description: string | null;
  date: Date | null;
};

/** Eventos alterados/criados/excluídos no Google desde `updatedMin`. */
export async function listChangedEvents(
  refreshToken: string,
  updatedMin: Date
): Promise<GoogleEventChange[]> {
  try {
    const auth = createOAuth2({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: "v3", auth });

    // ponytail: sem paginação — 250 mudanças por minuto é teto folgado pra um escritório
    const res = await calendar.events.list({
      calendarId: "primary",
      updatedMin: updatedMin.toISOString(),
      showDeleted: true,
      singleEvents: true,
      maxResults: 250,
    });

    return (res.data.items ?? [])
      .filter((e) => e.id)
      .map((e) => ({
        googleEventId: e.id!,
        cancelled: e.status === "cancelled",
        title: e.summary ?? "Compromisso",
        description: e.description ?? null,
        date: e.start ? parseGoogleStart(e.start) : null,
      }));
  } catch (e) {
    console.error("[google-calendar] changes error:", e);
    return [];
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
