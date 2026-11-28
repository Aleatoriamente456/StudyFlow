

function garantirModalQuestionario() {
    let modal = document.getElementById("betaQuizModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "betaQuizModal";
    modal.className = "quiz-modal-backdrop";
    modal.hidden = true;
    modal.innerHTML = `
        <div class="quiz-modal-card" role="dialog" aria-modal="true" aria-labelledby="quizModalTitle">
            <div class="quiz-modal-header">
                <div>
                    <span class="beta-pill">AVALIAÇÃO</span>
                    <h3 id="quizModalTitle">Questionário de Revisão</h3>
                    <p class="quiz-modal-meta" id="quizModalMeta"></p>
                </div>
                <button type="button" class="quiz-close-btn" id="quizCloseBtn" aria-label="Fechar">&times;</button>
            </div>

            <div id="quizBodyContent" class="quiz-body-content"></div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector("#quizCloseBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.hidden = true;
        });
    }
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.hidden = true;
        }
    });

    return modal;
}

function gerarQuestoesFallbackLocal(materia, tema, metodologia) {
    const mat = materia || "Estudos Gerais";
    const topico = tema || `Conceitos fundamentais de ${mat}`;
    const met = metodologia || "Pomodoro";

    const bancoBase = {
        "Matemática": [
            {
                enunciado: `Ao analisar uma função afim f(x) = ax + b aplicada a um problema contextualizado do ENEM (${topico}), o que o coeficiente angular "a" representa graficamente?`,
                alternativas: [
                    { letra: "A", texto: "O ponto onde a reta intercepta o eixo das ordenadas (y).", correta: false, explicacao: "Incorreta: o ponto de interseção com o eixo y é determinado pelo coeficiente linear 'b' (quando x = 0), não pelo coeficiente angular 'a'." },
                    { letra: "B", texto: "A taxa de variação constante da função, indicando sua inclinação e se ela é crescente ou decrescente.", correta: true, explicacao: "Correta: o coeficiente angular 'a' mede quanto y varia a cada unidade de x; se a > 0 a reta é crescente, e se a < 0 é decrescente." },
                    { letra: "C", texto: "A raiz ou zero da função, onde f(x) assume valor nulo.", correta: false, explicacao: "Incorreta: a raiz da função afim é encontrada resolvendo ax + b = 0, resultando em x = -b/a." },
                    { letra: "D", texto: "O valor máximo absoluto atingido pela parábola no plano cartesiano.", correta: false, explicacao: "Incorreta: parábolas e pontos de máximo/mínimo pertencem às funções quadráticas (2º grau), enquanto f(x) = ax + b define uma reta." },
                    { letra: "E", texto: "A distância entre dois pontos quaisquer sobre o eixo das abscissas.", correta: false, explicacao: "Incorreta: a distância horizontal entre dois pontos é dada pela diferença |x2 - x1|, e não pelo coeficiente 'a'." }
                ]
            },
            {
                enunciado: `Em uma função quadrática f(x) = ax² + bx + c com a < 0, qual afirmação descreve corretamente o comportamento do vértice?`,
                alternativas: [
                    { letra: "A", texto: "A concavidade é voltada para cima e o vértice representa o valor mínimo da função.", correta: false, explicacao: "Incorreta: a concavidade voltada para cima com ponto de mínimo ocorre apenas quando a > 0." },
                    { letra: "B", texto: "A função não possui eixo de simetria vertical passando pelo vértice.", correta: false, explicacao: "Incorreta: toda parábola definida por f(x) = ax² + bx + c possui eixo de simetria vertical em x_v = -b / (2a)." },
                    { letra: "C", texto: "A concavidade é voltada para baixo e a ordenada do vértice (y_v = -Δ / 4a) indica o valor máximo.", correta: true, explicacao: "Correta: quando a < 0, a parábola abre para baixo e atinge seu ponto mais alto exatamente no vértice (x_v, y_v)." },
                    { letra: "D", texto: "O discriminante Δ deve ser obrigatoriamente negativo para que o vértice exista.", correta: false, explicacao: "Incorreta: o vértice existe para qualquer função quadrática com a ≠ 0, independentemente do sinal de Δ." },
                    { letra: "E", texto: "O coeficiente 'c' determina se a concavidade é voltada para cima ou para baixo.", correta: false, explicacao: "Incorreta: o coeficiente 'c' apenas indica onde a parábola corta o eixo y; a concavidade depende exclusivamente do sinal de 'a'." }
                ]
            }
        ],
        "Português": [
            {
                enunciado: `Na análise de textos dissertativo-argumentativos (${topico}), qual é a função principal dos conectivos coesivos como "portanto", "logo" e "dessa forma"?`,
                alternativas: [
                    { letra: "A", texto: "Introduzir uma ideia de oposição ou ressalva em relação ao argumento anterior.", correta: false, explicacao: "Incorreta: ideias de oposição ou ressalva são introduzidas por conectivos adversativos/concessivos como 'contudo', 'entretanto' ou 'embora'." },
                    { letra: "B", texto: "Estabelecer relação de conclusão ou consequência lógica a partir das premissas apresentadas.", correta: true, explicacao: "Correta: 'portanto', 'logo' e 'dessa forma' são operadores argumentativos conclusivos que sintetizam o raciocínio desenvolvido." },
                    { letra: "C", texto: "Indicar alternância ou exclusão entre duas hipóteses incompatíveis.", correta: false, explicacao: "Incorreta: alternância é expressa por conjunções alternativas como 'ou... ou', 'ora... ora'." },
                    { letra: "D", texto: "Apontar a causa cronológica anterior de um fato histórico narrado.", correta: false, explicacao: "Incorreta: relações de causa são introduzidas por conectivos como 'porque', 'visto que' ou 'uma vez que'." },
                    { letra: "E", texto: "Substituir o referente nominal para evitar ambiguidade pronominal.", correta: false, explicacao: "Incorreta: a retomada nominal é função da coesão referencial (pronomes e sinônimos), enquanto esses conectivos exercem coesão sequencial." }
                ]
            }
        ],
        "História": [
            {
                enunciado: `Ao estudar processos históricos brasileiros e mundiais (${topico}), por que a análise crítica de fontes primárias é indispensável?`,
                alternativas: [
                    { letra: "A", texto: "Porque todo documento oficial retrata a verdade absoluta sem influências ideológicas de sua época.", correta: false, explicacao: "Incorreta: nenhuma fonte histórica é totalmente neutra; todo documento reflete o contexto, interesses e visão de quem o produziu." },
                    { letra: "B", texto: "Porque permite compreender as intencionalidades, disputas sociais e o contexto em que os fatos foram produzidos.", correta: true, explicacao: "Correta: a crítica documental identifica quem produziu a fonte, para quem e com qual objetivo, evitando leituras anacrônicas ou ingênuas." },
                    { letra: "C", texto: "Porque elimina a necessidade de relacionar eventos políticos com fatores econômicos e culturais.", correta: false, explicacao: "Incorreta: a historiografia contemporânea busca justamente articular as dimensões política, econômica, social e cultural." },
                    { letra: "D", texto: "Porque fontes escritas são os únicos registros válidos para a pesquisa historiográfica.", correta: false, explicacao: "Incorreta: cultura material, relatos orais, imagens, músicas e monumentos também são fontes históricas fundamentais." },
                    { letra: "E", texto: "Porque permite julgar sociedades do passado exclusivamente com os valores morais do presente.", correta: false, explicacao: "Incorreta: julgar o passado pelos padrões atuais configura anacronismo, um erro metodológico na História." }
                ]
            }
        ]
    };

    const especificas = bancoBase[mat] || [];
    const complementares = [
        {
            enunciado: `Durante a sessão de ${mat} sobre "${topico}", qual procedimento garante maior retenção ativa do conteúdo estudado?`,
            alternativas: [
                { letra: "A", texto: "Apenas reler passivamente o mesmo parágrafo várias vezes sem fazer anotações ou exercícios.", correta: false, explicacao: "Incorreta: a releitura passiva gera ilusão de familiaridade, mas apresenta baixa retenção a longo prazo segundo a ciência cognitiva." },
                { letra: "B", texto: "Praticar a recuperação ativa (recordar conceitos sem olhar o material) seguida de resolução de questões comentadas.", correta: true, explicacao: "Correta: testar a própria memória ativamente fortalece as conexões neurais e revela exatamente quais lacunas precisam de revisão." },
                { letra: "C", texto: "Grifar mais de 90% do texto com marcadores coloridos durante a primeira leitura.", correta: false, explicacao: "Incorreta: grifar em excesso não exige processamento profundo nem hierarquização das ideias centrais." },
                { letra: "D", texto: "Estudar múltiplos assuntos desconexos simultaneamente sem pausas estruturadas.", correta: false, explicacao: "Incorreta: a alternância desordenada (multitarefa) fragmenta a atenção e aumenta a fadiga cognitiva." },
                { letra: "E", texto: "Evitar revisar erros cometidos em simulados para não perder tempo com conteúdos difíceis.", correta: false, explicacao: "Incorreta: analisar os erros é justamente o passo que transforma falhas de compreensão em aprendizado consolidado." }
            ]
        },
        {
            enunciado: `Considerando a metodologia ${met} aplicada ao estudo de "${topico}" em ${mat}, qual atitude está alinhada aos princípios desse método?`,
            alternativas: [
                { letra: "A", texto: "Ignorar o planejamento do tempo e estudar até a exaustão sem intervalos.", correta: false, explicacao: "Incorreta: o descanso programado e a organização em etapas são essenciais para evitar a sobrecarga mental." },
                { letra: "B", texto: "Estruturar a sessão em etapas claras de compreensão, síntese ativa e verificação do aprendizado.", correta: true, explicacao: `Correta: tanto Pomodoro, quanto Feynman e SQ3R estruturam o estudo em foco deliberado, processamento ativo e revisão.` },
                { letra: "C", texto: "Decorar fórmulas ou definições isoladas sem compreender sua aplicação em problemas reais.", correta: false, explicacao: "Incorreta: a memorização mecânica sem compreensão dificulta a resolução de questões contextualizadas." },
                { letra: "D", texto: "Deixar todas as revisões apenas para a véspera da prova ou vestibular.", correta: false, explicacao: "Incorreta: o estudo espaçado ao longo da semana combate diretamente a Curva do Esquecimento de Ebbinghaus." },
                { letra: "E", texto: "Substituir exercícios práticos exclusivamente por vídeos reproduzidos em velocidade acelerada.", correta: false, explicacao: "Incorreta: assistir passivamente sem praticar não desenvolve autonomia na resolução de problemas." }
            ]
        },
        {
            enunciado: `Ao relacionar "${topico}" (${mat}) com provas de larga escala como ENEM e vestibulares, qual habilidade é mais frequentemente exigida?`,
            alternativas: [
                { letra: "A", texto: "Cópia literal de trechos extensos de manuais teóricos sem interpretação.", correta: false, explicacao: "Incorreta: as provas avaliam competências interpretativas e aplicação conceitual, não reprodução mecânica." },
                { letra: "B", texto: "Interpretação de situações-problema, articulação de conceitos fundamentais e análise crítica dos dados apresentados.", correta: true, explicacao: "Correta: vestibulares e ENEM exigem que o estudante mobilize conceitos teóricos para interpretar textos, gráficos e contextos reais." },
                { letra: "C", texto: "Resolução de questões exclusivamente por tentativa e erro sem justificativa conceitual.", correta: false, explicacao: "Incorreta: a compreensão dos fundamentos permite descartar distratores com segurança e precisão." },
                { letra: "D", texto: "Memorização de datas ou nomenclaturas descontextualizadas sem relação com o tema central.", correta: false, explicacao: "Incorreta: detalhes isolados sem contexto raramente são cobrados de forma pura nas matrizes de referência atuais." },
                { letra: "E", texto: "Desconsiderar o enunciado e analisar apenas o tamanho das alternativas.", correta: false, explicacao: "Incorreta: o comando da questão no enunciado define exatamente o recorte conceitual exigido na resposta." }
            ]
        },
        {
            enunciado: `Qual é o principal indicador de que você realmente dominou "${topico}" em ${mat} ao final desta sessão?`,
            alternativas: [
                { letra: "A", texto: "Conseguir explicar os conceitos centrais com clareza, resolver exercícios variados e justificar por que as alternativas erradas estão incorretas.", correta: true, explicacao: "Correta: explicar com próprias palavras e identificar distratores demonstra domínio real e profundo do assunto." },
                { letra: "B", texto: "Apenas reconhecer o título do capítulo ao folhear o caderno.", correta: false, explicacao: "Incorreta: reconhecimento superficial não equivale à capacidade de recuperar e aplicar o conhecimento." },
                { letra: "C", texto: "Ter passado muitas horas sentado com o livro aberto, mesmo sem concluir tarefas.", correta: false, explicacao: "Incorreta: qualidade e foco ativo importam muito mais do que horas passivas diante do material." },
                { letra: "D", texto: "Copiar integralmente o texto do livro didático sem sintetizar os pontos-chave.", correta: false, explicacao: "Incorreta: transcrição mecânica não exige elaboração cognitiva nem síntese pessoal." },
                { letra: "E", texto: "Acertar apenas uma questão idêntica a um exemplo já resolvido linha por linha.", correta: false, explicacao: "Incorreta: a transferência do aprendizado exige resolver variações inéditas do problema." }
            ]
        },
        {
            enunciado: `Após identificar uma dificuldade específica durante o estudo de "${topico}" em ${mat}, qual deve ser o próximo passo na rotina personalizada?`,
            alternativas: [
                { letra: "A", texto: "Excluir definitivamente a matéria do cronograma semanal.", correta: false, explicacao: "Incorreta: eliminar matérias difíceis aumenta as lacunas de aprendizagem e prejudica o desempenho geral." },
                { letra: "B", texto: "Priorizar revisões espaçadas e exercícios direcionados sobre esse subtópico nas próximas sessões.", correta: true, explicacao: "Correta: reforçar os pontos de maior dificuldade com revisões periódicas consolida o aprendizado e eleva a nota média." },
                { letra: "C", texto: "Ignorar o erro e avançar para temas avançados que dependem desse pré-requisito.", correta: false, explicacao: "Incorreta: avançar sem consolidar a base compromete a compreensão dos tópicos seguintes." },
                { letra: "D", texto: "Estudar apenas as matérias em que já possui facilidade máxima.", correta: false, explicacao: "Incorreta: equilibrar manutenção dos pontos fortes com reforço nas dificuldades traz maior ganho de pontuação." },
                { letra: "E", texto: "Abandonar o uso de qualquer metodologia ou registro de progresso.", correta: false, explicacao: "Incorreta: acompanhar o progresso permite ajustar a estratégia de forma contínua e objetiva." }
            ]
        }
    ];

    const combinadas = [...especificas, ...complementares];
    return combinadas.slice(0, 5);
}

async function abrirQuestionarioSessao({ materia, tema, descricao, metodologia }) {
    const modal = garantirModalQuestionario();
    const metaEl = document.getElementById("quizModalMeta");
    const bodyEl = document.getElementById("quizBodyContent");

    const metodologiaUsada = metodologia || obterMetodologiaAtiva() || "Pomodoro";
    const prefs = obterPreferenciasSalvas();
    const metasAluno = prefs?.metas || "Preparação para vestibulares e ENEM";

    if (metaEl) {
        metaEl.textContent = `Matéria: ${materia} • Metodologia: ${metodologiaUsada}`;
    }

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="quiz-loading-box">
                <div class="quiz-spinner"></div>
                <p>Preparando 5 questões inéditas sobre <strong>${escapeHTML(tema || materia)}</strong>...</p>
            </div>
        `;
    }

    modal.hidden = false;

    let questoes = null;
    let origemGeracao = "Motor Local";

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        const resp = await fetch(`${getBasePath()}script/gerar_quiz_ia.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                materia,
                tema,
                descricao,
                metas: metasAluno,
                metodologia: metodologiaUsada
            })
        });
        clearTimeout(timeoutId);

        const data = await lerRespostaJsonSegura(resp);

        if (data && data.sucesso && Array.isArray(data.questoes) && data.questoes.length >= 5) {
            questoes = data.questoes.slice(0, 5);
            origemGeracao = "API Gemini";
        } else if (data && data.usar_fallback_navegador && data.api_key && data.prompt && typeof consultarGeminiPeloNavegador === "function") {
            const resNav = await consultarGeminiPeloNavegador(data.api_key, data.prompt);
            if (resNav && resNav.dados && Array.isArray(resNav.dados.questoes) && resNav.dados.questoes.length >= 5) {
                questoes = resNav.dados.questoes.slice(0, 5);
                origemGeracao = "API Gemini";
            }
        }
    } catch (e) {

    }

    if (!questoes) {
        questoes = gerarQuestoesFallbackLocal(materia, tema, metodologiaUsada);
    }

    if (metaEl) {
        metaEl.textContent = `Matéria: ${materia} • Metodologia: ${metodologiaUsada} • ${origemGeracao}`;
    }

    renderizarFormularioQuestionario(bodyEl, questoes, {
        materia,
        tema,
        metodologia: metodologiaUsada
    });
}

function renderizarFormularioQuestionario(container, questoes, contexto) {
    if (!container) return;

    const letras = ["A", "B", "C", "D", "E"];

    let html = `
        <div class="quiz-intro-banner">
            <strong>Tema avaliado:</strong> ${escapeHTML(contexto.tema || contexto.materia)}<br>
            <span>Responda às 5 questões abaixo (<strong>1 ponto por questão correta</strong>). Ao finalizar, você verá a explicação de todas as alternativas e sua média em <strong>${escapeHTML(contexto.metodologia)}</strong> será atualizada.</span>
        </div>
        <form id="betaQuizForm" class="quiz-questions-list">
    `;

    questoes.forEach((q, qIdx) => {
        const alts = Array.isArray(q.alternativas) ? q.alternativas.slice(0, 5) : [];
        html += `
            <fieldset class="quiz-question-card">
                <legend class="quiz-question-title">
                    <span class="quiz-q-number">Questão ${qIdx + 1}</span>
                    ${escapeHTML(q.enunciado)}
                </legend>
                <div class="quiz-options-list">
        `;

        alts.forEach((alt, aIdx) => {
            const letra = alt.letra || letras[aIdx] || String.fromCharCode(65 + aIdx);
            html += `
                <label class="quiz-option-label">
                    <input type="radio" name="q_${qIdx}" value="${aIdx}">
                    <span class="quiz-option-letter">${escapeHTML(letra)}</span>
                    <span class="quiz-option-text">${escapeHTML(alt.texto)}</span>
                </label>
            `;
        });

        html += `
                </div>
            </fieldset>
        `;
    });

    html += `
            <div class="quiz-submit-bar">
                <button type="submit" class="button primary" id="btnSubmitQuiz">
                    Finalizar e ver correção
                </button>
            </div>
        </form>
    `;

    container.innerHTML = html;

    const form = document.getElementById("betaQuizForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const respostasUsuario = [];
            for (let i = 0; i < questoes.length; i++) {
                const marcada = form.querySelector(`input[name="q_${i}"]:checked`);
                if (!marcada) {
                    alert(`Responda a Questão ${i + 1} antes de finalizar o questionário.`);
                    return;
                }
                respostasUsuario.push(Number(marcada.value));
            }

            const submitBtn = document.getElementById("btnSubmitQuiz");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Calculando pontuação e salvando...";
            }

            let pontuacao = 0;
            questoes.forEach((q, i) => {
                const alts = q.alternativas || [];
                const escolhida = alts[respostasUsuario[i]];
                if (escolhida && escolhida.correta === true) {
                    pontuacao += 1;
                }
            });

            salvarAvaliacaoLocal({
                materia: contexto.materia,
                tema: contexto.tema,
                metodologia: contexto.metodologia,
                pontuacao: pontuacao,
                totalQuestoes: questoes.length
            });

            const usuarioId = localStorage.getItem("usuarioId");
            try {
                if (usuarioId) {
                    const resp = await fetch(`${getBasePath()}script/avaliacao.php`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            usuario_id: usuarioId,
                            metodologia: contexto.metodologia,
                            materia: contexto.materia,
                            pontuacao: pontuacao,
                            total_questoes: questoes.length
                        })
                    });
                    const resJson = await lerRespostaJsonSegura(resp);
                    if (resp.ok && resJson.sucesso && resJson.medias_metodologia) {
                        salvarMediasServidor(resJson.medias_metodologia);
                    }
                }
            } catch (err) {

            }

            if (typeof atualizarDadosPerfil === "function") {
                atualizarDadosPerfil();
            }

            renderizarResultadoQuestionario(container, questoes, respostasUsuario, pontuacao, contexto);
        });
    }
}

function renderizarResultadoQuestionario(container, questoes, respostasUsuario, pontuacao, contexto) {
    const medias = obterMediasPorMetodologia();
    const infoMet = medias[contexto.metodologia] || { media: pontuacao, total: 1 };
    const mediaTexto = infoMet.media !== null ? `${Number(infoMet.media).toFixed(1)} / 5.0 pts` : `${pontuacao}.0 / 5.0 pts`;
    const letras = ["A", "B", "C", "D", "E"];

    let html = `
        <div class="quiz-result-summary">
            <div class="quiz-score-circle">
                <strong>${pontuacao}<span>/5</span></strong>
                <small>pontos</small>
            </div>
            <div class="quiz-result-info">
                <h4>Questionário concluído!</h4>
                <p>Você acertou <strong>${pontuacao} de ${questoes.length}</strong> questões (1 ponto por acerto).</p>
                <p class="quiz-method-avg">
                    Média atual na metodologia <strong>${escapeHTML(contexto.metodologia)}</strong>:
                    <span>${escapeHTML(mediaTexto)}</span> (${infoMet.total} ${infoMet.total === 1 ? "avaliação" : "avaliações"})
                </p>
            </div>
        </div>

        <h4 class="quiz-review-heading">Gabarito comentado de todas as alternativas</h4>
        <div class="quiz-review-list">
    `;

    questoes.forEach((q, qIdx) => {
        const alts = Array.isArray(q.alternativas) ? q.alternativas.slice(0, 5) : [];
        const idxMarcada = respostasUsuario[qIdx];
        const acertou = Boolean(alts[idxMarcada] && alts[idxMarcada].correta === true);

        html += `
            <div class="quiz-review-card ${acertou ? "is-correct" : "is-wrong"}">
                <div class="quiz-review-q-header">
                    <span class="quiz-q-number">Questão ${qIdx + 1}</span>
                    <span class="quiz-status-pill ${acertou ? "correct" : "wrong"}">
                        ${acertou ? "+1 ponto (Acertou)" : "0 pontos (Errou)"}
                    </span>
                </div>
                <p class="quiz-review-enunciado">${escapeHTML(q.enunciado)}</p>
                <div class="quiz-review-alts">
        `;

        alts.forEach((alt, aIdx) => {
            const letra = alt.letra || letras[aIdx] || String.fromCharCode(65 + aIdx);
            const isCorrect = alt.correta === true;
            const isUserPick = aIdx === idxMarcada;

            let estadoClasse = "alt-neutral";
            if (isCorrect) estadoClasse = "alt-correct";
            else if (isUserPick && !isCorrect) estadoClasse = "alt-wrong";

            let tags = "";
            if (isCorrect) tags += `<span class="alt-tag tag-correct">Alternativa Correta</span>`;
            if (isUserPick) tags += `<span class="alt-tag tag-user">Sua Escolha</span>`;

            const explicacaoTexto = alt.explicacao
                || (isCorrect
                    ? "Esta alternativa apresenta corretamente o conceito solicitado no enunciado."
                    : "Esta alternativa apresenta uma afirmação incorreta ou incompleta em relação ao tema avaliado.");

            html += `
                <div class="quiz-review-alt-item ${estadoClasse}">
                    <div class="quiz-review-alt-top">
                        <strong>${escapeHTML(letra)}) ${escapeHTML(alt.texto)}</strong>
                        <div class="quiz-review-alt-tags">${tags}</div>
                    </div>
                    <p class="quiz-review-alt-exp">${escapeHTML(explicacaoTexto)}</p>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
        </div>
        <div class="quiz-submit-bar">
            <button type="button" class="button primary" id="btnCloseQuizResult">
                Concluir revisão
            </button>
        </div>
    `;

    container.innerHTML = html;

    const closeResultBtn = document.getElementById("btnCloseQuizResult");
    if (closeResultBtn) {
        closeResultBtn.addEventListener("click", () => {
            const modal = document.getElementById("betaQuizModal");
            if (modal) modal.hidden = true;
        });
    }
}
