const firstExam = new Date("2026-11-01T00:00:00-03:00");
const secondExam = new Date("2026-11-08T00:00:00-03:00");
const historyKey = "enemEssayHistory";
const stepsKey = "enemLessonProgressV2";

const daysFirst = document.querySelector("#daysFirst");
const daysSecond = document.querySelector("#daysSecond");
const essayAverage = document.querySelector("#essayAverage");
const form = document.querySelector("#essayForm");
const essayInput = document.querySelector("#essayInput");
const themeInput = document.querySelector("#themeInput");
const wordCount = document.querySelector("#wordCount");
const scoreTotal = document.querySelector("#scoreTotal");
const feedbackState = document.querySelector("#feedbackState");
const competencies = document.querySelector("#competencies");
const adaptiveAdvice = document.querySelector("#adaptiveAdvice");
const aiStatusDot = document.querySelector("#aiStatusDot");
const aiStatusText = document.querySelector("#aiStatusText");
const aiStatusDetail = document.querySelector("#aiStatusDetail");
const testAiButton = document.querySelector("#testAiButton");
const pageSections = Array.from(document.querySelectorAll(".page-section"));
const navLinks = Array.from(document.querySelectorAll(".topbar nav a"));
const courseButtons = Array.from(document.querySelectorAll("[data-lesson]"));
const pathProgressText = document.querySelector("#pathProgressText");
const pathProgressBar = document.querySelector("#pathProgressBar");
const pathNextAction = document.querySelector("#pathNextAction");
const goEssayButton = document.querySelector("#goEssayButton");
const essayAccessButton = document.querySelector("#essayAccessButton");
const lessonBadge = document.querySelector("#lessonBadge");
const lessonTitle = document.querySelector("#lessonTitle");
const lessonIntro = document.querySelector("#lessonIntro");
const lessonBody = document.querySelector("#lessonBody");
const lessonPractice = document.querySelector("#lessonPractice");
const lessonAnswer = document.querySelector("#lessonAnswer");
const finishLessonButton = document.querySelector("#finishLessonButton");
const nextLessonButton = document.querySelector("#nextLessonButton");
const lessonStudentAnswer = document.querySelector("#lessonStudentAnswer");
const askTutorButton = document.querySelector("#askTutorButton");
const tutorFeedback = document.querySelector("#tutorFeedback");

const pageIds = pageSections.map((section) => section.id);
const lessons = [
  {
    id: "interpretacao",
    badge: "Passo 1",
    title: "Interpretar o comando",
    intro: "Antes de responder, voce precisa descobrir exatamente o que a questao quer. No ENEM, muita gente erra porque responde o tema geral, nao o comando.",
    blocks: [
      ["O que procurar", "Procure palavras como ideia central, finalidade, critica, efeito de sentido, inferir, de acordo com o texto. Elas dizem qual operacao mental voce deve fazer."],
      ["Como fazer", "Leia primeiro a pergunta. Depois leia o texto procurando pistas para aquela pergunta. Se a alternativa nao conversa com o comando, ela esta fora."],
      ["Armadilha comum", "Alternativa bonita, mas ampla demais. Se fala algo verdadeiro sobre o tema, mas nao responde ao comando, marque como errada."],
    ],
    practice: "Comando: 'No texto, a palavra embora estabelece relacao de...'. O que voce deve procurar?",
    answer: "Voce deve procurar uma relacao de oposicao/concessao. 'Embora' indica contraste entre duas ideias. Antes de pensar no tema, identifique a funcao da palavra no trecho.",
  },
  {
    id: "tema",
    badge: "Passo 2",
    title: "Entender o tema",
    intro: "Tema nao e titulo bonito. Tema e o problema social que voce precisa discutir. Para entender, transforme em pergunta.",
    blocks: [
      ["Formula simples", "Pegue o tema e pergunte: qual e o problema, quem sofre com ele, por que ele acontece e quais consequencias ele gera?"],
      ["Exemplo", "'Desafios para democratizar a educacao' vira: por que nem todos acessam educacao de qualidade? Respostas possiveis: desigualdade social e falha de politicas publicas."],
      ["Limite do tema", "Nao fuja para outro assunto. Se o tema e educacao, tecnologia pode entrar como causa ou solucao, mas nao pode virar o centro sozinho."],
    ],
    practice: "Tema: 'Desafios para combater a desinformacao no Brasil'. Transforme em duas perguntas.",
    answer: "Perguntas boas: por que a desinformacao se espalha? Quem deve agir para reduzir esse problema? A partir disso, voce pode defender causas como baixa educacao midiática e falta de responsabilizacao das plataformas.",
  },
  {
    id: "repertorio",
    badge: "Passo 3",
    title: "Usar repertorio",
    intro: "Repertorio nao e decorar nome dificil. Ele serve para provar sua ideia. Cite, explique e conecte ao tema.",
    blocks: [
      ["Modelo de uso", "Segundo X, existe Y. Isso se relaciona ao tema porque Z. Portanto, o problema permanece devido a W."],
      ["Repertorios coringa", "Constituicao de 1988 para direitos; Paulo Freire para educacao; Bauman para fragilidade das relacoes; ONU para direitos humanos e desenvolvimento."],
      ["Erro comum", "Soltar o repertorio e abandonar. Exemplo ruim: 'Segundo Paulo Freire, a educacao muda o mundo'. E dai? Explique como isso prova sua tese."],
    ],
    practice: "Use a Constituicao de 1988 em um tema sobre acesso a saude.",
    answer: "A Constituicao de 1988 garante a saude como direito social. Entretanto, quando parte da populacao nao acessa atendimento adequado, percebe-se distancia entre o direito previsto e a realidade brasileira.",
  },
  {
    id: "tese",
    badge: "Passo 4",
    title: "Montar tese",
    intro: "Tese e sua resposta para o problema. Ela precisa deixar claro o que voce vai defender nos dois desenvolvimentos.",
    blocks: [
      ["Forma pronta", "O problema ocorre, principalmente, por causa de CAUSA 1 e CAUSA 2."],
      ["Exemplo", "A democratizacao da educacao e dificultada pela desigualdade socioeconomica e pela insuficiencia de politicas publicas inclusivas."],
      ["Por que funciona", "Cada causa vira um paragrafo: D1 fala da desigualdade; D2 fala das politicas publicas. Assim sua redacao fica organizada."],
    ],
    practice: "Monte uma tese para o tema: desafios da saude mental entre jovens.",
    answer: "Exemplo: A promocao da saude mental entre jovens e dificultada pelo uso excessivo das redes sociais e pela falta de acolhimento psicologico nas escolas.",
  },
  {
    id: "paragrafo",
    badge: "Passo 5",
    title: "Fazer paragrafo",
    intro: "Antes da redacao inteira, treine um paragrafo. Um bom desenvolvimento tem ideia principal, explicacao, exemplo/repertorio e fechamento.",
    blocks: [
      ["Estrutura", "Topico frasal: diga a causa. Explicacao: mostre como ela gera o problema. Repertorio/exemplo: prove. Fechamento: ligue de volta ao tema."],
      ["Mini-modelo", "Em primeiro plano, a desigualdade social intensifica o problema. Isso ocorre porque... Dessa forma..."],
      ["Objetivo", "Se voce sabe fazer dois bons paragrafos, a redacao completa fica muito menos assustadora."],
    ],
    practice: "Escreva mentalmente um topico frasal para: desigualdade digital na educacao.",
    answer: "Exemplo: Em primeiro plano, a desigualdade digital impede que muitos estudantes acompanhem plenamente as atividades escolares. Depois disso, explique falta de internet, equipamentos e apoio.",
  },
];
let currentLessonIndex = 0;
let currentTutorApproval = false;

function daysUntil(date) {
  const today = new Date();
  const diff = date.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(historyKey) || "[]");
  } catch {
    return [];
  }
}

function getSavedSteps() {
  try {
    return JSON.parse(localStorage.getItem(stepsKey) || "{}");
  } catch {
    return {};
  }
}

function saveSteps(steps) {
  localStorage.setItem(stepsKey, JSON.stringify(steps));
}

function allStepsDone() {
  const saved = getSavedSteps();
  return lessons.every((lesson) => Boolean(saved[lesson.id]));
}

function showPage(pageId) {
  let targetId = pageIds.includes(pageId) ? pageId : "inicio";
  if (targetId === "redacao" && !allStepsDone()) {
    targetId = "passos";
  }
  pageSections.forEach((section) => {
    section.classList.toggle("active-page", section.id === targetId);
  });
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${targetId}`);
  });
  if (location.hash !== `#${targetId}`) {
    history.replaceState(null, "", `#${targetId}`);
  }
  window.scrollTo(0, 0);
}

function openHashPage() {
  showPage(location.hash.replace("#", "") || "inicio");
}

function saveHistory(entry) {
  const history = [entry, ...getHistory()].slice(0, 12);
  localStorage.setItem(historyKey, JSON.stringify(history));
  renderAverage();
}

function renderAverage() {
  const history = getHistory();
  if (!history.length) {
    essayAverage.textContent = "--";
    return;
  }
  const average = Math.round(history.reduce((sum, item) => sum + Number(item.total || 0), 0) / history.length);
  essayAverage.textContent = average;
}

function updateWordCount() {
  const total = essayInput.value.trim().split(/\s+/).filter(Boolean).length;
  wordCount.textContent = `${total} ${total === 1 ? "palavra" : "palavras"}`;
}

function updateLegacyStepProgress() {
  const saved = getSavedSteps();
  stepInputs.forEach((input) => {
    input.checked = Boolean(saved[input.dataset.studyStep]);
    input.closest(".path-card")?.classList.toggle("done", input.checked);
  });

  const done = stepInputs.filter((input) => input.checked).length;
  const total = stepInputs.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  pathProgressText.textContent = `${done} de ${total} passos feitos`;
  pathProgressBar.style.width = `${percent}%`;

  if (done < total) {
    const next = stepInputs.find((input) => !input.checked)?.closest(".path-card")?.querySelector("h3")?.textContent;
    pathNextAction.textContent = next ? `Próximo passo: ${next}.` : "Continue a trilha.";
    goEssayButton.classList.add("disabled");
    goEssayButton.setAttribute("aria-disabled", "true");
    goEssayButton.textContent = "Redação bloqueada";
  } else {
    pathNextAction.textContent = "Boa. Agora você pode ir para a página de redação completa.";
    goEssayButton.classList.remove("disabled");
    goEssayButton.removeAttribute("aria-disabled");
    goEssayButton.textContent = "Ir para redação";
  }
}

function updateStepProgress() {
  const saved = getSavedSteps();
  courseButtons.forEach((button) => {
    const lessonId = button.dataset.lesson;
    button.classList.toggle("done", Boolean(saved[lessonId]));
    button.classList.toggle("active", lessons[currentLessonIndex]?.id === lessonId);
  });

  const done = lessons.filter((lesson) => saved[lesson.id]).length;
  const total = lessons.length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  pathProgressText.textContent = `${done} de ${total} aulas concluidas`;
  pathProgressBar.style.width = `${percent}%`;

  if (done < total) {
    const next = lessons.find((lesson) => !saved[lesson.id]);
    pathNextAction.textContent = next ? `Proxima aula: ${next.title}.` : "Continue a trilha.";
    [goEssayButton, essayAccessButton].filter(Boolean).forEach((button) => {
      button.classList.add("disabled");
      button.setAttribute("aria-disabled", "true");
      button.textContent = "Redacao bloqueada";
    });
  } else {
    pathNextAction.textContent = "Boa. Agora voce pode ir para a pagina de redacao completa.";
    [goEssayButton, essayAccessButton].filter(Boolean).forEach((button) => {
      button.classList.remove("disabled");
      button.removeAttribute("aria-disabled");
      button.textContent = "Ir para redacao";
    });
  }
}

function renderLesson(index) {
  currentLessonIndex = Math.max(0, Math.min(index, lessons.length - 1));
  const lesson = lessons[currentLessonIndex];
  currentTutorApproval = Boolean(getSavedSteps()[lesson.id]);
  lessonBadge.textContent = lesson.badge;
  lessonTitle.textContent = lesson.title;
  lessonIntro.textContent = lesson.intro;
  lessonBody.innerHTML = lesson.blocks
    .map(([title, text]) => `<article><h4>${title}</h4><p>${text}</p></article>`)
    .join("");
  lessonPractice.textContent = lesson.practice;
  lessonAnswer.textContent = lesson.answer;
  lessonStudentAnswer.value = "";
  tutorFeedback.textContent = currentTutorApproval
    ? "Esta aula ja foi concluida. Voce pode revisar ou pedir outra ajuda da IA."
    : "Escreva sua resposta e peça ajuda da IA antes de concluir esta aula.";

  const saved = getSavedSteps();
  finishLessonButton.textContent = saved[lesson.id] ? "Aula concluida" : "Concluir esta aula";
  nextLessonButton.textContent = currentLessonIndex === lessons.length - 1 ? "Ver progresso" : "Proxima aula";
  updateStepProgress();
}

function finishCurrentLesson() {
  const lesson = lessons[currentLessonIndex];
  if (!currentTutorApproval) {
    tutorFeedback.textContent = "Antes de concluir, responda o treino guiado e clique em Pedir ajuda da IA. Assim eu consigo te ensinar o ajuste certo.";
    return;
  }
  const saved = getSavedSteps();
  saved[lesson.id] = true;
  saveSteps(saved);
  renderLesson(currentLessonIndex);
}

async function askTutorForHelp() {
  const lesson = lessons[currentLessonIndex];
  const resposta = lessonStudentAnswer.value.trim();

  askTutorButton.disabled = true;
  askTutorButton.textContent = "IA analisando...";
  tutorFeedback.textContent = "Lendo sua resposta e preparando uma explicacao simples...";

  try {
    const response = await fetch("/api/tutor-passo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etapa: lesson.id,
        titulo: lesson.title,
        aula: lesson.intro,
        exercicio: lesson.practice,
        resposta,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "A IA nao conseguiu responder agora.");
    }

    currentTutorApproval = Boolean(data.podeConcluir);
    const melhorar = Array.isArray(data.melhorar) && data.melhorar.length
      ? `<ul>${data.melhorar.map((item) => `<li>${item}</li>`).join("")}</ul>`
      : "";
    tutorFeedback.innerHTML = `
      <strong>${data.offline ? "Feedback estrutural" : "Feedback da Gemini"}</strong>
      <p>${data.feedback}</p>
      ${melhorar}
      <p><strong>Modelo para imitar:</strong> ${data.exemplo}</p>
      <p>${currentTutorApproval ? "Voce ja pode concluir esta aula." : "Ajuste sua resposta e peça ajuda de novo."}</p>
    `;
  } catch (error) {
    currentTutorApproval = false;
    tutorFeedback.textContent = error.message || "Nao foi possivel chamar a IA agora.";
  } finally {
    askTutorButton.disabled = false;
    askTutorButton.textContent = "Pedir ajuda da IA";
  }
}

function goNextLesson() {
  if (currentLessonIndex < lessons.length - 1) {
    renderLesson(currentLessonIndex + 1);
  } else {
    updateStepProgress();
  }
}

function setAiStatus(kind, title, detail) {
  aiStatusDot.className = `status-dot ${kind}`;
  aiStatusText.textContent = title;
  aiStatusDetail.textContent = detail;
}

async function loadAiStatus() {
  try {
    const response = await fetch("/api/ia-status");
    const data = await response.json();
    if (data.configured) {
      setAiStatus("waiting", "Chave encontrada", "Clique em Testar IA agora para confirmar se a Gemini responde.");
    } else {
      setAiStatus("offline", "Modo offline", "Sem GEMINI_API_KEY visivel para o servidor. A correcao sera estrutural, nao da Gemini.");
    }
  } catch {
    setAiStatus("offline", "Status indisponivel", "Nao consegui consultar o servidor local agora.");
  }
}

async function testAi() {
  testAiButton.disabled = true;
  testAiButton.textContent = "Testando...";
  setAiStatus("waiting", "Testando Gemini", "Fazendo uma chamada curta para confirmar a IA.");

  try {
    const response = await fetch("/api/testar-ia", { method: "POST" });
    const data = await response.json();
    if (data.active) {
      setAiStatus("online", "Gemini ativa", data.message || "A IA respondeu ao teste.");
    } else {
      setAiStatus("offline", "Gemini nao respondeu", data.message || "A correcao ficara em modo offline.");
    }
  } catch {
    setAiStatus("offline", "Falha no teste", "Nao foi possivel falar com o endpoint de teste.");
  } finally {
    testAiButton.disabled = false;
    testAiButton.textContent = "Testar IA agora";
  }
}

function renderCorrection(result) {
  const correction = result.feedback || result;
  scoreTotal.textContent = correction.total ?? "---";
  feedbackState.textContent = result.offline
    ? "Correção estrutural offline. Configure GEMINI_API_KEY para receber análise completa pela Gemini API."
    : "Correção feita pela Gemini. O plano abaixo foi adaptado para suas prioridades atuais.";
  if (!result.offline) {
    setAiStatus("online", "Gemini ativa", "Sua ultima correcao veio da IA, nao do modo offline.");
  }

  competencies.innerHTML = (correction.competencias || [])
    .map(
      (item) => `
        <article class="competency">
          <strong><span>${item.id} - ${item.nome}</span><span>${item.nota}/200</span></strong>
          <p>${item.comentario}</p>
        </article>
      `,
    )
    .join("");

  const priorities = (correction.prioridades || []).map((item) => `<li>${item}</li>`).join("");
  const plan = (correction.planoAdaptado || []).map((item) => `<li>${item}</li>`).join("");
  adaptiveAdvice.innerHTML = `
    <h3>Prioridades da semana</h3>
    <ul>${priorities}</ul>
    <h3>Plano adaptado</h3>
    <ul>${plan}</ul>
    <h3>Reescrita sugerida</h3>
    <p>${correction.reescrita || "Sem reescrita sugerida."}</p>
  `;

  saveHistory({
    date: new Date().toISOString(),
    theme: themeInput.value,
    total: correction.total || 0,
    priorities: correction.prioridades || [],
  });
}

async function submitEssay(event) {
  event.preventDefault();
  feedbackState.textContent = "Corrigindo sua redação...";
  competencies.innerHTML = "";
  adaptiveAdvice.innerHTML = "";
  scoreTotal.textContent = "...";

  const response = await fetch("/api/corrigir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tema: themeInput.value,
      texto: essayInput.value,
      historico: getHistory(),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    feedbackState.textContent = data.error || "Não foi possível corrigir agora.";
    scoreTotal.textContent = "---";
    return;
  }
  renderCorrection(data);
}

daysFirst.textContent = daysUntil(firstExam);
daysSecond.textContent = daysUntil(secondExam);
renderAverage();
updateWordCount();
renderLesson(0);
openHashPage();
loadAiStatus();

window.addEventListener("hashchange", openHashPage);
essayInput.addEventListener("input", updateWordCount);
form.addEventListener("submit", submitEssay);
testAiButton.addEventListener("click", testAi);
courseButtons.forEach((button, index) => {
  button.addEventListener("click", () => renderLesson(index));
});
finishLessonButton.addEventListener("click", finishCurrentLesson);
nextLessonButton.addEventListener("click", goNextLesson);
askTutorButton.addEventListener("click", askTutorForHelp);
lessonStudentAnswer.addEventListener("input", () => {
  currentTutorApproval = Boolean(getSavedSteps()[lessons[currentLessonIndex].id]);
  if (!currentTutorApproval) {
    tutorFeedback.textContent = "Quando terminar sua resposta, clique em Pedir ajuda da IA.";
  }
});
