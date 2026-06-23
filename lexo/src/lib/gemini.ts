import { GoogleGenAI } from "@google/genai";

// Modelo gratuito do Gemini (free tier do Google AI Studio).
export const GEMINI_MODEL = "gemini-2.5-flash";

let _genai: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!_genai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    _genai = new GoogleGenAI({ apiKey });
  }
  return _genai;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Streaming multi-turn — recebe histórico completo + nova mensagem do usuário.
 * Mapeia role "assistant" → "model" para o Gemini.
 */
export function streamChat(
  history: ChatMessage[],
  systemPrompt: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const abort = new AbortController();

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return new ReadableStream({
    async start(controller) {
      try {
        const ai = getGenAI();
        const response = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents,
          config: {
            abortSignal: abort.signal,
            systemInstruction: systemPrompt,
          },
        });
        for await (const chunk of response) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (e) {
        console.error("[gemini] erro no streaming de chat:", e);
        controller.error(new Error("Erro ao gerar conteúdo"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });
}

/**
 * Faz streaming de texto a partir de um prompt único e devolve um
 * ReadableStream web (text/plain), no mesmo formato que as rotas já consumiam.
 */
export function streamText(prompt: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const abort = new AbortController();

  return new ReadableStream({
    async start(controller) {
      try {
        const ai = getGenAI();
        const response = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { abortSignal: abort.signal },
        });
        for await (const chunk of response) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (e) {
        // 🔒 SEGURANÇA [VULN-7]: loga o erro real internamente; ao cliente, mensagem genérica.
        console.error("[gemini] erro no streaming de conteúdo:", e);
        controller.error(new Error("Erro ao gerar conteúdo"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });
}

/**
 * Geração one-shot a partir de um PDF (base64) + prompt. Devolve o texto bruto
 * da resposta para a rota fazer o parsing do JSON.
 */
export async function generateFromPdf(base64Pdf: string, prompt: string): Promise<string> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
      { text: prompt },
    ],
  });
  return response.text ?? "";
}
