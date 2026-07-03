import { generateGeminiText, getGeminiApiKey, readPayload, sendJson } from "./_lib.js";

function offlineAnswer(pergunta) {
  return `Modo offline: sua pergunta foi "${pergunta}". Para estudar ENEM, tente transformar sua duvida em uma tarefa pequena: 1) identifique o assunto, 2) escreva o que voce ja entendeu, 3) resolva um exemplo, 4) confira o erro. Configure GEMINI_API_KEY para respostas completas da IA.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const { pergunta = "", historico = [] } = await readPayload(req);
    if (!pergunta.trim() || pergunta.trim().length < 4) {
      sendJson(res, 400, { error: "Escreva uma pergunta um pouco mais completa." });
      return;
    }

    if (!getGeminiApiKey()) {
      sendJson(res, 200, { offline: true, resposta: offlineAnswer(pergunta) });
      return;
    }

    const prompt = `
Voce e um tutor de estudos para o ENEM, com foco em redacao, portugues, interpretacao de texto e organizacao de estudo.

Regras:
- Responda em portugues simples.
- Seja direto, didatico e encorajador.
- Se a pergunta for sobre redacao, conecte com as competencias do ENEM quando fizer sentido.
- Se o aluno pedir resposta pronta, explique o raciocinio antes.
- Dê um exemplo curto e uma tarefa pequena para o aluno praticar.
- Nao mencione ferramentas internas ou autoria tecnica.

Historico recente:
${JSON.stringify((historico || []).slice(-8))}

Pergunta do aluno:
${pergunta}
`;

    const resposta = await generateGeminiText(prompt);
    sendJson(res, 200, { resposta });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Nao foi possivel responder agora." });
  }
}
