import { getGeminiApiKey, sendJson } from "./_lib.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  sendJson(res, 200, {
    configured: Boolean(getGeminiApiKey()),
    mode: getGeminiApiKey() ? "gemini_configurada" : "offline",
  });
}
