import { execFileSync } from "node:child_process";

export function getGeminiApiKey() {
  const directKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (directKey) return directKey;

  if (process.platform === "win32") {
    try {
      return execFileSync(
        "powershell.exe",
        ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('GEMINI_API_KEY','User')"],
        { encoding: "utf8", windowsHide: true },
      ).trim();
    } catch {
      return "";
    }
  }

  return "";
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export async function readPayload(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || "{}");
}

export function extractGeminiText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  if (typeof data?.outputText === "string") return data.outputText;

  const candidateText = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n");
  if (candidateText) return candidateText;

  const parts = [];
  for (const step of data?.steps || []) {
    const content = step?.modelOutput?.content || step?.model_output?.content || [];
    for (const item of content) {
      if (typeof item?.text === "string") parts.push(item.text);
      if (typeof item?.text?.text === "string") parts.push(item.text.text);
    }
  }
  return parts.join("\n").trim();
}

export function parseJsonObjectFromText(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Resposta da IA nao veio em JSON.");
  }
}

export async function generateGeminiText(prompt) {
  const apiKey = getGeminiApiKey();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Falha ao chamar Gemini API");
  }

  return extractGeminiText(data);
}

export function localTutorFeedback({ etapa, resposta }) {
  const hasBecause = /porque|pois|ja que|visto que|devido|por causa/i.test(resposta);
  return {
    offline: true,
    feedback: hasBecause
      ? `Modo offline: sua resposta ja tenta explicar o passo "${etapa}". Agora deixe mais claro qual e a pista, causa ou ideia principal.`
      : "Modo offline: sua resposta esta curta. Para melhorar, explique o motivo usando \"porque\".",
    melhorar: ["Use uma frase completa.", "Explique o motivo, nao apenas o resultado."],
    exemplo: "Exemplo: Eu procuraria a palavra-chave do comando e voltaria ao trecho do texto, porque a resposta precisa nascer de uma pista concreta.",
    podeConcluir: resposta.trim().split(/\s+/).length >= 8,
  };
}

export function localCorrection({ tema, texto }) {
  const words = texto.trim().split(/\s+/).filter(Boolean);
  const paragraphs = texto.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const hasIntervention = /governo|estado|minist[eé]rio|escola|m[ií]dia|fam[ií]lia|sociedade|ong|deve|por meio|a fim de|para que/i.test(texto);
  const hasConnectives = /portanto|ademais|entretanto|al[eé]m disso|nesse sentido|desse modo|contudo|logo|assim/i.test(texto);
  const hasTheme = tema ? tema.toLowerCase().split(/\s+/).filter((w) => w.length > 4).some((w) => texto.toLowerCase().includes(w)) : true;
  const base = Math.min(160, Math.max(80, Math.round(words.length / 2)));
  const c1 = base;
  const c2 = hasTheme ? base : 80;
  const c3 = paragraphs.length >= 4 ? base : 100;
  const c4 = hasConnectives ? 160 : 100;
  const c5 = hasIntervention ? 160 : 80;

  return {
    total: c1 + c2 + c3 + c4 + c5,
    competencias: [
      { id: "C1", nome: "Norma formal", nota: c1, comentario: "Modo offline: revise concordancia, pontuacao e periodos muito longos." },
      { id: "C2", nome: "Tema e repertorio", nota: c2, comentario: hasTheme ? "O texto parece dialogar com o tema." : "A relacao com o tema precisa ficar mais explicita." },
      { id: "C3", nome: "Argumentacao", nota: c3, comentario: "Use tese clara e dois argumentos desenvolvidos com causa, consequencia e exemplo." },
      { id: "C4", nome: "Coesao", nota: c4, comentario: hasConnectives ? "Ha conectivos, agora garanta que eles criem relacoes logicas." : "Inclua conectivos variados entre paragrafos e ideias." },
      { id: "C5", nome: "Intervencao", nota: c5, comentario: "Feche com agente, acao, meio, finalidade e detalhamento." },
    ],
    forcas: ["Voce ja tem material suficiente para iniciar uma correcao estrutural."],
    prioridades: ["Treinar projeto de texto", "Memorizar repertorios coringa", "Praticar intervencao completa"],
    planoAdaptado: ["Reescreva a introducao hoje.", "Faca um paragrafo de desenvolvimento amanha.", "Revise conectivos e proposta de intervencao em 48h."],
    reescrita: "Modelo de intervencao: Portanto, o Ministerio da Educacao deve promover campanhas e projetos escolares, por meio de aulas e materiais digitais, a fim de ampliar a conscientizacao social sobre o problema.",
  };
}
