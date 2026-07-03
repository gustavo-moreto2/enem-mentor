import { extractGeminiText, getGeminiApiKey, sendJson } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    sendJson(res, 200, {
      active: false,
      mode: "offline",
      message: "A chave GEMINI_API_KEY ainda nao foi encontrada neste servidor.",
    });
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Responda em uma frase curta: Gemini ativa para corrigir redacoes do ENEM." }] }] }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "A Gemini API recusou a chamada de teste.");
    sendJson(res, 200, {
      active: true,
      mode: "gemini",
      message: extractGeminiText(data) || "Gemini respondeu ao teste.",
    });
  } catch (error) {
    sendJson(res, 500, {
      active: false,
      mode: "error",
      message: error.message || "Nao foi possivel testar a Gemini agora.",
    });
  }
}
