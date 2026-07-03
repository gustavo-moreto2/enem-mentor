import http from "node:http";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function getGeminiApiKey() {
  const directKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  if (directKey) return directKey;

  if (process.platform === "win32") {
    try {
      return execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "[Environment]::GetEnvironmentVariable('GEMINI_API_KEY','User')",
        ],
        { encoding: "utf8", windowsHide: true },
      ).trim();
    } catch {
      return "";
    }
  }

  return "";
}

async function readRequestBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || "{}");
}

function extractGeminiText(data) {
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

function parseJsonObjectFromText(text) {
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

async function generateGeminiText(prompt) {
  const apiKey = getGeminiApiKey();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Falha ao chamar Gemini API");
  }

  return extractGeminiText(data);
}

async function callGeminiCorrection({ tema, texto, historico }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      offline: true,
      feedback: localCorrection({ tema, texto, historico }),
    };
  }

  const prompt = `
Você é um corretor e mentor de redação do ENEM. Corrija a redação abaixo usando a matriz de 5 competências do ENEM.

Regras:
- Responda em JSON válido, sem markdown.
- Seja rigoroso, mas pedagógico.
- Dê nota de 0 a 200 para cada competência e total de 0 a 1000.
- Aponte 3 prioridades de estudo adaptadas ao histórico do aluno.
- Sugira uma reescrita objetiva para tese, tópico frasal ou intervenção quando necessário.
- Não invente repertório específico se o texto não sustenta.

Tema: ${tema || "Tema não informado"}

Histórico recente do aluno:
${JSON.stringify(historico || [])}

Redação:
${texto}

Formato:
{
  "total": number,
  "competencias": [
    {"id":"C1","nome":"Norma formal","nota":number,"comentario":"string"},
    {"id":"C2","nome":"Tema e repertório","nota":number,"comentario":"string"},
    {"id":"C3","nome":"Argumentação","nota":number,"comentario":"string"},
    {"id":"C4","nome":"Coesão","nota":number,"comentario":"string"},
    {"id":"C5","nome":"Intervenção","nota":number,"comentario":"string"}
  ],
  "forcas":["string"],
  "prioridades":["string"],
  "planoAdaptado":["string"],
  "reescrita":"string"
}`;

  const raw = await generateGeminiText(prompt);
  return parseJsonObjectFromText(raw);
}

async function testGeminiConnection() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      active: false,
      mode: "offline",
      message: "A chave GEMINI_API_KEY ainda nao foi encontrada neste servidor.",
    };
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: "gemini-3.5-flash",
      input: "Responda em uma frase curta: Gemini ativa para corrigir redacoes do ENEM.",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      active: false,
      mode: "error",
      message: data?.error?.message || "A Gemini API recusou a chamada de teste.",
    };
  }

  return {
    active: true,
    mode: "gemini",
    message: extractGeminiText(data) || "Gemini respondeu ao teste.",
  };
}

async function callGeminiTutor({ etapa, titulo, aula, exercicio, resposta }) {
  const apiKey = getGeminiApiKey();
  if (!resposta || resposta.trim().length < 15) {
    return {
      offline: true,
      feedback: "Escreva pelo menos uma frase completa para eu conseguir te ajudar nesse passo.",
      exemplo: "Tente responder com: 'Eu procuraria...' ou 'Minha tese seria...'.",
      podeConcluir: false,
    };
  }

  if (!apiKey) {
    return localTutorFeedback({ etapa, resposta });
  }

  const prompt = `
Voce e um tutor de ENEM para um aluno que esta aprendendo redacao passo a passo antes de escrever a redacao completa.
Avalie exatamente o exercicio informado. Nao troque o assunto do exercicio por outro conteudo.
Se o aluno respondeu corretamente ao que o exercicio pediu, marque podeConcluir como true mesmo que ainda seja uma resposta simples.

Etapa: ${etapa}
Titulo da aula: ${titulo}
Resumo da aula: ${aula}
Exercicio: ${exercicio}
Resposta do aluno: ${resposta}

Responda em JSON valido, sem markdown:
{
  "feedback": "explique em linguagem simples o que o aluno acertou e o que faltou",
  "melhorar": ["acao objetiva 1", "acao objetiva 2"],
  "exemplo": "uma resposta melhor, curta, que o aluno possa imitar",
  "podeConcluir": boolean
}

Se a resposta estiver muito vaga, marque podeConcluir como false e ensine o proximo ajuste. Se estiver minimamente correta para iniciante, marque true.`;

  const raw = await generateGeminiText(prompt);
  try {
    return parseJsonObjectFromText(raw);
  } catch {
    return {
      feedback: raw || "A IA respondeu, mas nao no formato esperado. Tente novamente com uma resposta um pouco mais completa.",
      melhorar: ["Escreva uma frase completa.", "Explique o motivo da sua resposta."],
      exemplo: "Eu procuraria a palavra-chave do comando e voltaria ao trecho do texto, porque a resposta precisa estar sustentada por uma pista.",
      podeConcluir: resposta.trim().split(/\s+/).length >= 8,
    };
  }
}

function localTutorFeedback({ etapa, resposta }) {
  const hasBecause = /porque|pois|ja que|visto que|devido|por causa/i.test(resposta);
  return {
    offline: true,
    feedback: hasBecause
      ? `Modo offline: sua resposta ja tenta explicar o passo "${etapa}". Agora deixe mais claro qual e a pista, causa ou ideia principal.`
      : `Modo offline: sua resposta esta curta. Para melhorar, explique o motivo usando "porque".`,
    melhorar: ["Use uma frase completa.", "Explique o motivo, nao apenas o resultado."],
    exemplo: "Exemplo: Eu procuraria a palavra-chave do comando e voltaria ao trecho do texto, porque a resposta precisa nascer de uma pista concreta.",
    podeConcluir: resposta.trim().split(/\s+/).length >= 8,
  };
}

function localCorrection({ tema, texto }) {
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
      { id: "C1", nome: "Norma formal", nota: c1, comentario: "Modo offline: revise concordância, pontuação e períodos muito longos." },
      { id: "C2", nome: "Tema e repertório", nota: c2, comentario: hasTheme ? "O texto parece dialogar com o tema." : "A relação com o tema precisa ficar mais explícita." },
      { id: "C3", nome: "Argumentação", nota: c3, comentario: "Use tese clara e dois argumentos desenvolvidos com causa, consequência e exemplo." },
      { id: "C4", nome: "Coesão", nota: c4, comentario: hasConnectives ? "Há conectivos, agora garanta que eles criem relações lógicas." : "Inclua conectivos variados entre parágrafos e ideias." },
      { id: "C5", nome: "Intervenção", nota: c5, comentario: "Feche com agente, ação, meio, finalidade e detalhamento." },
    ],
    forcas: ["Você já tem material suficiente para iniciar uma correção estrutural."],
    prioridades: ["Treinar projeto de texto", "Memorizar repertórios coringa", "Praticar intervenção completa"],
    planoAdaptado: ["Reescreva a introdução hoje.", "Faça um parágrafo de desenvolvimento amanhã.", "Revise conectivos e proposta de intervenção em 48h."],
    reescrita: "Modelo de intervenção: Portanto, o Ministério da Educação deve promover campanhas e projetos escolares, por meio de aulas e materiais digitais, a fim de ampliar a conscientização social sobre o problema.",
  };
}

function offlineQuestionAnswer(pergunta) {
  return `Modo offline: sua pergunta foi "${pergunta}". Para estudar ENEM, tente transformar sua duvida em uma tarefa pequena: 1) identifique o assunto, 2) escreva o que voce ja entendeu, 3) resolva um exemplo, 4) confira o erro. Configure GEMINI_API_KEY para respostas completas da IA.`;
}

async function answerQuestion({ pergunta = "", historico = [] }) {
  if (!pergunta.trim() || pergunta.trim().length < 4) {
    return { error: "Escreva uma pergunta um pouco mais completa.", status: 400 };
  }

  if (!getGeminiApiKey()) {
    return { offline: true, resposta: offlineQuestionAnswer(pergunta) };
  }

  const prompt = `
Voce e um tutor de estudos para o ENEM, com foco em redacao, portugues, interpretacao de texto e organizacao de estudo.

Regras:
- Responda em portugues simples.
- Seja direto, didatico e encorajador.
- Se a pergunta for sobre redacao, conecte com as competencias do ENEM quando fizer sentido.
- Se o aluno pedir resposta pronta, explique o raciocinio antes.
- De um exemplo curto e uma tarefa pequena para o aluno praticar.
- Nao mencione ferramentas internas ou autoria tecnica.

Historico recente:
${JSON.stringify((historico || []).slice(-8))}

Pergunta do aluno:
${pergunta}
`;

  return { resposta: await generateGeminiText(prompt) };
}

async function handleApi(req, res) {
  try {
    const payload = await readRequestBody(req);
    if (!payload.texto || payload.texto.trim().length < 400) {
      sendJson(res, 400, { error: "Envie uma redação com pelo menos 400 caracteres para uma correção útil." });
      return;
    }
    const result = await callGeminiCorrection(payload);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erro inesperado na correção." });
  }
}

async function handleAiStatus(req, res) {
  sendJson(res, 200, {
    configured: Boolean(getGeminiApiKey()),
    mode: getGeminiApiKey() ? "gemini_configurada" : "offline",
  });
}

async function handleAiTest(req, res) {
  try {
    sendJson(res, 200, await testGeminiConnection());
  } catch (error) {
    sendJson(res, 500, {
      active: false,
      mode: "error",
      message: error.message || "Nao foi possivel testar a Gemini agora.",
    });
  }
}

async function handleTutor(req, res) {
  try {
    const payload = await readRequestBody(req);
    sendJson(res, 200, await callGeminiTutor(payload));
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Nao foi possivel pedir ajuda para a IA agora.",
    });
  }
}

async function handleQuestion(req, res) {
  try {
    const result = await answerQuestion(await readRequestBody(req));
    if (result.status) {
      sendJson(res, result.status, { error: result.error });
      return;
    }
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Nao foi possivel responder agora." });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  try {
    const file = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Arquivo não encontrado");
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/ia-status") {
    handleAiStatus(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/testar-ia") {
    handleAiTest(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/tutor-passo") {
    handleTutor(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/perguntar") {
    handleQuestion(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/corrigir") {
    handleApi(req, res);
    return;
  }
  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405);
  res.end();
});

server.listen(port, () => {
  console.log(`ENEM Mentor rodando em http://localhost:${port}`);
});
