import { generateGeminiText, getGeminiApiKey, localTutorFeedback, parseJsonObjectFromText, readPayload, sendJson } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const { etapa, titulo, aula, exercicio, resposta = "" } = await readPayload(req);
    if (!resposta || resposta.trim().length < 15) {
      sendJson(res, 200, {
        offline: true,
        feedback: "Escreva pelo menos uma frase completa para eu conseguir te ajudar nesse passo.",
        exemplo: "Tente responder com: 'Eu procuraria...' ou 'Minha tese seria...'.",
        podeConcluir: false,
      });
      return;
    }

    if (!getGeminiApiKey()) {
      sendJson(res, 200, localTutorFeedback({ etapa, resposta }));
      return;
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
}`;

    const raw = await generateGeminiText(prompt);
    try {
      sendJson(res, 200, parseJsonObjectFromText(raw));
    } catch {
      sendJson(res, 200, {
        feedback: raw || "A IA respondeu, mas nao no formato esperado.",
        melhorar: ["Escreva uma frase completa.", "Explique o motivo da sua resposta."],
        exemplo: "Eu procuraria a palavra-chave do comando e voltaria ao trecho do texto, porque a resposta precisa estar sustentada por uma pista.",
        podeConcluir: resposta.trim().split(/\s+/).length >= 8,
      });
    }
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Nao foi possivel pedir ajuda para a IA agora." });
  }
}
