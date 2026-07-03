import { generateGeminiText, getGeminiApiKey, localCorrection, parseJsonObjectFromText, readPayload, sendJson } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const payload = await readPayload(req);
    const { tema, texto, historico } = payload;
    if (!texto || texto.trim().length < 400) {
      sendJson(res, 400, { error: "Envie uma redacao com pelo menos 400 caracteres para uma correcao util." });
      return;
    }

    if (!getGeminiApiKey()) {
      sendJson(res, 200, {
        offline: true,
        feedback: localCorrection({ tema, texto, historico }),
      });
      return;
    }

    const prompt = `
Voce e um corretor e mentor de redacao do ENEM. Corrija a redacao abaixo usando a matriz de 5 competencias do ENEM.

Regras:
- Responda em JSON valido, sem markdown.
- Seja rigoroso, mas pedagogico.
- De nota de 0 a 200 para cada competencia e total de 0 a 1000.
- Aponte 3 prioridades de estudo adaptadas ao historico do aluno.
- Sugira uma reescrita objetiva para tese, topico frasal ou intervencao quando necessario.
- Nao invente repertorio especifico se o texto nao sustenta.

Tema: ${tema || "Tema nao informado"}
Historico recente do aluno:
${JSON.stringify(historico || [])}
Redacao:
${texto}

Formato:
{
  "total": number,
  "competencias": [
    {"id":"C1","nome":"Norma formal","nota":number,"comentario":"string"},
    {"id":"C2","nome":"Tema e repertorio","nota":number,"comentario":"string"},
    {"id":"C3","nome":"Argumentacao","nota":number,"comentario":"string"},
    {"id":"C4","nome":"Coesao","nota":number,"comentario":"string"},
    {"id":"C5","nome":"Intervencao","nota":number,"comentario":"string"}
  ],
  "forcas":["string"],
  "prioridades":["string"],
  "planoAdaptado":["string"],
  "reescrita":"string"
}`;

    const raw = await generateGeminiText(prompt);
    sendJson(res, 200, parseJsonObjectFromText(raw));
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erro inesperado na correcao." });
  }
}
