

function limparRotina() {
    removerDadosRotina();
    atualizarTelaInicial();
}

function criarIconeLivroSVG(strokeColor) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");

    const pathLeft = document.createElementNS(ns, "path");
    pathLeft.setAttribute("d", "M4 3H10C11.1 3 12 4 12 5V21C12 19.8 11 19 9.5 19H4V3Z");
    pathLeft.setAttribute("stroke", strokeColor);
    pathLeft.setAttribute("stroke-width", "1.8");
    pathLeft.setAttribute("stroke-linejoin", "round");

    const pathRight = document.createElementNS(ns, "path");
    pathRight.setAttribute("d", "M20 3H14C12.9 3 12 4 12 5V21C12 19.8 13 19 14.5 19H20V3Z");
    pathRight.setAttribute("stroke", strokeColor);
    pathRight.setAttribute("stroke-width", "1.8");
    pathRight.setAttribute("stroke-linejoin", "round");

    svg.appendChild(pathLeft);
    svg.appendChild(pathRight);
    return svg;
}

function garantirMateriaNaDescricao(descricao, materia) {
    if (!materia) return descricao || "";
    const texto = (descricao || "").trim();
    if (!texto) return `${materia}: Sessão de estudo personalizada.`;
    if (texto.toLowerCase().includes(materia.toLowerCase())) return texto;
    return `${materia}: ${texto}`;
}

function renderizarPreviewRotina(prefs) {
    const grid = document.getElementById("routinePreviewGrid");
    if (!grid || !prefs) return;

    const metodologiaAtiva = obterMetodologiaAtiva();
    const metodoBadgeEl = document.getElementById("activeMethodologyBadge");
    if (metodoBadgeEl) {
        metodoBadgeEl.textContent = `Metodologia: ${metodologiaAtiva}`;
    }

    const rotinaIA = obterRotinaGeradaIA();
    if (rotinaIA && Array.isArray(rotinaIA.itens) && rotinaIA.itens.length > 0) {
        grid.innerHTML = "";
        rotinaIA.itens.slice(0, 3).forEach(item => {
            const descricaoComMateria = garantirMateriaNaDescricao(item.descricao, item.materia);
            const temaTexto = item.tema || `Tópico essencial de ${item.materia}`;

            const card = document.createElement("div");
            card.className = "routine-item-card";
            card.title = descricaoComMateria;

            const topRow = document.createElement("div");
            topRow.className = "routine-item-top";

            const iconWrap = document.createElement("div");
            iconWrap.className = "routine-item-icon";
            iconWrap.appendChild(criarIconeLivroSVG("#7138d4"));

            const info = document.createElement("div");
            info.className = "routine-item-info";

            const daySpan = document.createElement("span");
            daySpan.className = "routine-item-day";
            daySpan.textContent = item.dia_nome || STUDYFLOW_CONFIG.DIAS_NOMES[item.dia] || item.dia;

            const timeSpan = document.createElement("span");
            timeSpan.className = "routine-item-time";
            timeSpan.textContent = item.horario || "";

            const subjStrong = document.createElement("strong");
            subjStrong.className = "routine-item-subject";
            subjStrong.textContent = item.materia || "";

            info.appendChild(daySpan);
            info.appendChild(timeSpan);
            info.appendChild(subjStrong);

            topRow.appendChild(iconWrap);
            topRow.appendChild(info);

            const themeBadge = document.createElement("div");
            themeBadge.className = "routine-item-theme";
            themeBadge.textContent = `Tema: ${temaTexto}`;

            const descSmall = document.createElement("p");
            descSmall.className = "routine-item-desc";
            descSmall.textContent = descricaoComMateria;

            const quizBtn = document.createElement("button");
            quizBtn.type = "button";
            quizBtn.className = "button secondary routine-quiz-btn";
            quizBtn.textContent = "Concluir & Avaliar";
            quizBtn.addEventListener("click", () => {
                if (typeof abrirQuestionarioSessao === "function") {
                    abrirQuestionarioSessao({
                        materia: item.materia,
                        tema: temaTexto,
                        descricao: descricaoComMateria,
                        metodologia: metodologiaAtiva
                    });
                }
            });

            card.appendChild(topRow);
            card.appendChild(themeBadge);
            card.appendChild(descSmall);
            card.appendChild(quizBtn);
            grid.appendChild(card);
        });
        return;
    }

    const { DIAS_NOMES } = STUDYFLOW_CONFIG;

    const dias = (prefs.dias && prefs.dias.length > 0)
        ? prefs.dias.map(d => DIAS_NOMES[d] || d)
        : ["Segunda-feira", "Terça-feira"];

    const materias = (prefs.materias && prefs.materias.length > 0)
        ? prefs.materias
        : ["Geografia", "História", "Física"];

    const inicioStr = (prefs.horario && prefs.horario.inicio && prefs.horario.inicio !== "00:00")
        ? prefs.horario.inicio
        : "09:00";
    const fimStr = (prefs.horario && prefs.horario.fim && prefs.horario.fim !== "00:00")
        ? prefs.horario.fim
        : "12:00";

    const toMinutes = (str) => {
        const [h, m] = str.split(":").map(Number);
        return h * 60 + m;
    };

    const toTimeStr = (mins) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const startMin = toMinutes(inicioStr);
    const endMin = toMinutes(fimStr) > startMin ? toMinutes(fimStr) : startMin + 180;

    grid.innerHTML = "";
    let diaIdx = 0;
    let currentMin = startMin;

    for (let i = 0; i < 3; i++) {
        const materia = materias[i % materias.length];

        if (currentMin + 60 > endMin && i > 0) {
            diaIdx = (diaIdx + 1) % dias.length;
            currentMin = startMin;
        }

        const blocoInicio = toTimeStr(currentMin);
        const blocoFim = toTimeStr(currentMin + 60);
        const desc = `${materia}: Sessão estruturada com metodologia ${metodologiaAtiva}, alinhada às metas (${prefs.metas || "estudos gerais"}).`;

        const card = document.createElement("div");
        card.className = "routine-item-card";

        const topRow = document.createElement("div");
        topRow.className = "routine-item-top";

        const iconWrap = document.createElement("div");
        iconWrap.className = "routine-item-icon";
        iconWrap.appendChild(criarIconeLivroSVG("#7138d4"));

        const info = document.createElement("div");
        info.className = "routine-item-info";

        const daySpan = document.createElement("span");
        daySpan.className = "routine-item-day";
        daySpan.textContent = dias[diaIdx];

        const timeSpan = document.createElement("span");
        timeSpan.className = "routine-item-time";
        timeSpan.textContent = `${blocoInicio} - ${blocoFim}`;

        const subjStrong = document.createElement("strong");
        subjStrong.className = "routine-item-subject";
        subjStrong.textContent = materia;

        info.appendChild(daySpan);
        info.appendChild(timeSpan);
        info.appendChild(subjStrong);

        topRow.appendChild(iconWrap);
        topRow.appendChild(info);

        const descSmall = document.createElement("p");
        descSmall.className = "routine-item-desc";
        descSmall.textContent = desc;

        const quizBtn = document.createElement("button");
        quizBtn.type = "button";
        quizBtn.className = "button secondary routine-quiz-btn";
        quizBtn.textContent = "Concluir & Avaliar";
        quizBtn.addEventListener("click", () => {
            if (typeof abrirQuestionarioSessao === "function") {
                abrirQuestionarioSessao({
                    materia,
                    tema: `Conceitos fundamentais de ${materia}`,
                    descricao: desc,
                    metodologia: metodologiaAtiva
                });
            }
        });

        card.appendChild(topRow);
        card.appendChild(descSmall);
        card.appendChild(quizBtn);
        grid.appendChild(card);

        currentMin += 75;
    }
}

function atualizarTelaInicial() {
    const usuario = obterDadosUsuario();
    const preferencias = obterPreferenciasSalvas();
    const possuiRotina = temRotinaAtiva();

    const telaVisitante = document.getElementById("visitorScreen");
    const telaLogado = document.getElementById("loggedScreen");
    const telaRotina = document.getElementById("routineScreen");

    if (telaVisitante) {
        telaVisitante.hidden = true;
        telaVisitante.style.display = "none";
    }
    if (telaLogado) {
        telaLogado.hidden = true;
        telaLogado.style.display = "none";
    }
    if (telaRotina) {
        telaRotina.hidden = true;
        telaRotina.style.display = "none";
    }

    if (!usuario.logado) {
        if (telaVisitante) {
            telaVisitante.hidden = false;
            telaVisitante.style.display = "block";
        }
    } else if (preferencias && possuiRotina && telaRotina) {
        telaRotina.hidden = false;
        telaRotina.style.display = "flex";
        renderizarPreviewRotina(preferencias);
    } else if (telaLogado) {
        telaLogado.hidden = false;
        telaLogado.style.display = "block";

        const titleEl = document.getElementById("loggedCardTitle");
        const descEl = document.getElementById("loggedCardDesc");
        const summaryBox = document.getElementById("loggedPrefsSummary");
        const primaryAction = document.getElementById("loggedPrimaryAction");
        const secondaryAction = document.getElementById("loggedSecondaryAction");

        if (preferencias) {

            if (titleEl) {
                titleEl.innerHTML = 'Preferências <span>definidas</span>!';
            }
            if (descEl) {
                descEl.textContent = "Suas preferências já estão salvas. Agora escolha sua metodologia, matérias e gere sua rotina personalizada!";
            }
            if (summaryBox) {
                const diasFmt = (preferencias.dias || [])
                    .map(d => STUDYFLOW_CONFIG.DIAS_NOMES[d] || d)
                    .join(", ");
                const horarioFmt = preferencias.horario
                    ? `${preferencias.horario.inicio} às ${preferencias.horario.fim}`
                    : "Horário flexível";
                summaryBox.hidden = false;
                summaryBox.innerHTML = `
                    <span><strong>Dias:</strong> ${escapeHTML(diasFmt)}</span>
                    <span><strong>Horário:</strong> ${escapeHTML(horarioFmt)}</span>
                    <span><strong>Meta:</strong> ${escapeHTML(preferencias.metas || "Estudos gerais")}</span>
                `;
            }
            if (primaryAction) {
                primaryAction.textContent = "Criar rotina";
                primaryAction.href = "pages/telaCriarRotina.html";
            }
            if (secondaryAction) {
                secondaryAction.hidden = false;
                secondaryAction.textContent = "Editar preferências";
                secondaryAction.href = "pages/telaPreferencias.html";
            }
        } else {

            if (titleEl) {
                titleEl.innerHTML = 'Sem <span>rotinas</span> ativas.';
            }
            if (descEl) {
                descEl.textContent = "Defina suas preferências primeiro para criar suas rotinas personalizadas!";
            }
            if (summaryBox) {
                summaryBox.hidden = true;
                summaryBox.innerHTML = "";
            }
            if (primaryAction) {
                primaryAction.textContent = "Definir preferências";
                primaryAction.href = "pages/telaPreferencias.html";
            }
            if (secondaryAction) {
                secondaryAction.hidden = true;
            }
        }
    }

    if (typeof atualizarDadosPerfil === "function") {
        atualizarDadosPerfil();
    }
}

function inicializarTelaRotinaCompleta() {
    const tbody = document.getElementById("fullRoutineBody");
    if (!tbody) return;

    const {
        DIAS_ORDEM,
        DIAS_SIGLAS,
        MATERIAS_DISPONIVEIS,
        ABREVIACOES_MATERIAS,
        STORAGE_KEYS
    } = STUDYFLOW_CONFIG;

    const DEFAULT_ROWS_COUNT = 4;
    const metodologiaAtiva = obterMetodologiaAtiva();

    const fullMethodBadge = document.getElementById("fullRoutineMethodBadge");
    if (fullMethodBadge) {
        fullMethodBadge.textContent = `Metodologia ativa: ${metodologiaAtiva}`;
    }

    function abbreviateSubject(name) {
        if (!name) return "";
        if (ABREVIACOES_MATERIAS[name]) return ABREVIACOES_MATERIAS[name];
        return name.length > 5 ? name.slice(0, 4) + "." : name;
    }

    function buildInitialMatrix(prefs) {
        const matrix = Array.from({ length: DEFAULT_ROWS_COUNT }, () =>
            Array.from({ length: DIAS_ORDEM.length }, () => null)
        );

        const rotinaIA = obterRotinaGeradaIA();
        if (rotinaIA && Array.isArray(rotinaIA.itens) && rotinaIA.itens.length > 0) {
            rotinaIA.itens.forEach(item => {
                const diaChave = (item.dia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const colIdx = DIAS_ORDEM.indexOf(diaChave);
                if (colIdx !== -1) {
                    let colocado = false;
                    for (let r = 0; r < matrix.length; r++) {
                        if (!matrix[r][colIdx]) {
                            matrix[r][colIdx] = {
                                materia: item.materia,
                                tema: item.tema || `Tópico principal de ${item.materia}`,
                                horario: item.horario || "",
                                descricao: garantirMateriaNaDescricao(item.descricao, item.materia)
                            };
                            colocado = true;
                            break;
                        }
                    }
                    if (!colocado) {
                        const novaLinha = Array.from({ length: DIAS_ORDEM.length }, () => null);
                        novaLinha[colIdx] = {
                            materia: item.materia,
                            tema: item.tema || `Tópico principal de ${item.materia}`,
                            horario: item.horario || "",
                            descricao: garantirMateriaNaDescricao(item.descricao, item.materia)
                        };
                        matrix.push(novaLinha);
                    }
                }
            });
            return matrix;
        }

        const activeDays = (prefs && Array.isArray(prefs.dias) && prefs.dias.length > 0)
            ? prefs.dias.filter(d => DIAS_ORDEM.includes(d))
            : ["segunda", "terca", "quarta", "quinta", "sexta"];

        const subjects = (prefs && Array.isArray(prefs.materias) && prefs.materias.length > 0)
            ? prefs.materias
            : MATERIAS_DISPONIVEIS.slice(0, 11);

        const dayIndices = activeDays.map(d => DIAS_ORDEM.indexOf(d));

        const patternRows = [
            dayIndices,
            dayIndices.filter((_, idx) => idx % 2 === 0 || dayIndices.length <= 2),
            dayIndices.filter((_, idx) => dayIndices.length === 1 ? true : idx !== 3),
            dayIndices.filter((_, idx) => idx < 4)
        ];

        let subjIdx = 0;
        for (let r = 0; r < matrix.length; r++) {
            const cols = patternRows[r] || [];
            for (let c = 0; c < cols.length; c++) {
                const colIdx = cols[c];
                const subj = subjects[subjIdx % subjects.length];
                matrix[r][colIdx] = {
                    materia: subj,
                    tema: `Conceitos essenciais de ${subj}`,
                    horario: "",
                    descricao: `${subj}: Sessão de estudo programada com metodologia ${metodologiaAtiva}.`
                };
                subjIdx++;
            }
        }

        return matrix;
    }

    function construirAssinaturaRotina(prefs) {
        const rotinaIA = obterRotinaGeradaIA();
        const resumoIA = rotinaIA ? {
            metodologia: rotinaIA.metodologia || "",
            estrategia: rotinaIA.estrategia || "",
            total: Array.isArray(rotinaIA.itens) ? rotinaIA.itens.length : 0
        } : null;
        return JSON.stringify({ prefs: prefs || {}, ia: resumoIA });
    }

    function sincronizarRotinaIAComMatriz(matrix) {
        const rotinaIA = obterRotinaGeradaIA();
        if (!rotinaIA || !Array.isArray(rotinaIA.itens)) return;

        const novosItens = [];
        for (let c = 0; c < DIAS_ORDEM.length; c++) {
            const diaChave = DIAS_ORDEM[c];
            for (let r = 0; r < matrix.length; r++) {
                const cell = matrix[r][c];
                if (cell && typeof cell === "object" && cell.materia) {
                    novosItens.push({
                        dia: diaChave,
                        dia_nome: STUDYFLOW_CONFIG.DIAS_NOMES[diaChave] || diaChave,
                        horario: cell.horario || "",
                        materia: cell.materia,
                        tema: cell.tema || `Tópico principal de ${cell.materia}`,
                        descricao: garantirMateriaNaDescricao(cell.descricao, cell.materia),
                        metodologia: metodologiaAtiva
                    });
                }
            }
        }
        rotinaIA.itens = novosItens;
        localStorage.setItem(STORAGE_KEYS.ROTINA_IA, JSON.stringify(rotinaIA));
    }

    function saveRoutineMatrix(matrix, signature, sincronizarIA = false) {
        if (sincronizarIA) {
            sincronizarRotinaIAComMatriz(matrix);
        }
        const prefs = obterPreferenciasSalvas();
        const sig = signature || construirAssinaturaRotina(prefs);
        localStorage.setItem(STORAGE_KEYS.ROTINA_COMPLETA, JSON.stringify({
            signature: sig,
            matrix: matrix
        }));
    }

    function loadRoutineMatrix() {
        const prefs = obterPreferenciasSalvas();
        const prefsSignature = construirAssinaturaRotina(prefs);

        try {
            const savedRaw = localStorage.getItem(STORAGE_KEYS.ROTINA_COMPLETA);
            if (savedRaw) {
                const savedObj = JSON.parse(savedRaw);
                if (savedObj && savedObj.signature === prefsSignature && Array.isArray(savedObj.matrix)) {
                    return savedObj.matrix;
                }
            }
        } catch (e) {

        }

        const freshMatrix = buildInitialMatrix(prefs);
        saveRoutineMatrix(freshMatrix, prefsSignature);
        return freshMatrix;
    }

    let currentMatrix = loadRoutineMatrix();
    let editingCell = null;

    const modal = document.getElementById("slotModal");
    const modalSubtitle = document.getElementById("slotModalSubtitle");
    const modalDetails = document.getElementById("slotModalDetails");
    const modalSelect = document.getElementById("slotSubjectSelect");
    const quizModalBtn = document.getElementById("slotQuizBtn");
    const clearBtn = document.getElementById("slotClearBtn");
    const cancelBtn = document.getElementById("slotCancelBtn");
    const saveBtn = document.getElementById("slotSaveBtn");

    function renderDetailedSessionsList() {
        const listContainer = document.getElementById("fullRoutineDetailsList");
        if (!listContainer) return;

        listContainer.innerHTML = "";
        let count = 0;

        for (let c = 0; c < DIAS_ORDEM.length; c++) {
            for (let r = 0; r < currentMatrix.length; r++) {
                const cell = currentMatrix[r][c];
                if (!cell || typeof cell !== "object" || !cell.materia) continue;
                count++;

                const diaNome = STUDYFLOW_CONFIG.DIAS_NOMES[DIAS_ORDEM[c]] || DIAS_SIGLAS[c];
                const temaTxt = cell.tema || `Tópico principal de ${cell.materia}`;
                const descTxt = garantirMateriaNaDescricao(cell.descricao, cell.materia);

                const itemCard = document.createElement("article");
                itemCard.className = "detailed-session-card";
                itemCard.innerHTML = `
                    <div class="detailed-session-head">
                        <div>
                            <span class="detailed-session-day">${escapeHTML(diaNome)}${cell.horario ? ` • ${escapeHTML(cell.horario)}` : ""}</span>
                            <h4>${escapeHTML(cell.materia)} — <span>${escapeHTML(temaTxt)}</span></h4>
                        </div>
                        <button type="button" class="button secondary detailed-quiz-trigger">
                            Concluir & Avaliar
                        </button>
                    </div>
                    <p class="detailed-session-body">${escapeHTML(descTxt)}</p>
                `;

                const triggerBtn = itemCard.querySelector(".detailed-quiz-trigger");
                if (triggerBtn) {
                    triggerBtn.addEventListener("click", () => {
                        if (typeof abrirQuestionarioSessao === "function") {
                            abrirQuestionarioSessao({
                                materia: cell.materia,
                                tema: temaTxt,
                                descricao: descTxt,
                                metodologia: metodologiaAtiva
                            });
                        }
                    });
                }

                listContainer.appendChild(itemCard);
            }
        }

        if (count === 0) {
            listContainer.innerHTML = '<p class="description">Nenhuma sessão ativa na grade.</p>';
        }
    }

    function renderTable() {
        tbody.innerHTML = "";

        for (let r = 0; r < currentMatrix.length; r++) {
            const tr = document.createElement("tr");

            for (let c = 0; c < DIAS_ORDEM.length; c++) {
                const td = document.createElement("td");
                const cell = currentMatrix[r][c];
                const subject = (typeof cell === "object" && cell !== null) ? cell.materia : cell;

                if (subject) {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "routine-slot-btn";

                    const descFormatada = (typeof cell === "object" && cell !== null)
                        ? garantirMateriaNaDescricao(cell.descricao, subject)
                        : `${subject}: Sessão de estudo.`;
                    const horarioTexto = (typeof cell === "object" && cell !== null && cell.horario)
                        ? `${cell.horario} — `
                        : "";

                    btn.title = `${subject} (${DIAS_SIGLAS[c]})
${horarioTexto}${descFormatada}
Clique para detalhes, avaliar ou alterar`;

                    const iconSpan = document.createElement("span");
                    iconSpan.className = "routine-slot-icon";
                    iconSpan.appendChild(criarIconeLivroSVG("#6b6878"));

                    const labelSpan = document.createElement("span");
                    labelSpan.className = "routine-slot-label";
                    labelSpan.textContent = abbreviateSubject(subject);

                    btn.appendChild(iconSpan);
                    btn.appendChild(labelSpan);
                    btn.addEventListener("click", () => openSlotModal(r, c));
                    td.appendChild(btn);
                } else {
                    const emptyBtn = document.createElement("button");
                    emptyBtn.type = "button";
                    emptyBtn.className = "routine-slot-empty";
                    emptyBtn.title = `Adicionar matéria em ${DIAS_SIGLAS[c]}`;
                    emptyBtn.setAttribute("aria-label", `Adicionar matéria em ${DIAS_SIGLAS[c]}`);
                    emptyBtn.addEventListener("click", () => openSlotModal(r, c));
                    td.appendChild(emptyBtn);
                }

                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        renderDetailedSessionsList();
    }

    function openSlotModal(r, c) {
        if (!modal) return;
        editingCell = { r, c };
        const cell = currentMatrix[r][c];
        const hasSubject = Boolean(cell && (typeof cell === "string" || cell.materia));
        const currentVal = (typeof cell === "object" && cell !== null ? cell.materia : cell) || MATERIAS_DISPONIVEIS[0];

        if (modalSubtitle) {
            const horarioInfo = (typeof cell === "object" && cell !== null && cell.horario) ? ` • ${cell.horario}` : "";
            modalSubtitle.textContent = `Dia: ${DIAS_SIGLAS[c]} • Bloco ${r + 1}${horarioInfo}`;
        }

        if (modalDetails) {
            if (typeof cell === "object" && cell !== null && cell.descricao) {
                modalDetails.hidden = false;
                modalDetails.textContent = garantirMateriaNaDescricao(cell.descricao, currentVal);
            } else {
                modalDetails.hidden = true;
                modalDetails.textContent = "";
            }
        }

        if (quizModalBtn) {
            quizModalBtn.hidden = !hasSubject;
        }

        if (modalSelect) {
            modalSelect.innerHTML = "";
            MATERIAS_DISPONIVEIS.forEach(subj => {
                const opt = document.createElement("option");
                opt.value = subj;
                opt.textContent = subj;
                if (subj === currentVal) opt.selected = true;
                modalSelect.appendChild(opt);
            });
        }

        modal.hidden = false;
    }

    function closeSlotModal() {
        editingCell = null;
        if (modal) modal.hidden = true;
    }

    if (quizModalBtn) {
        quizModalBtn.addEventListener("click", () => {
            if (!editingCell) return;
            const cell = currentMatrix[editingCell.r][editingCell.c];
            const materia = (typeof cell === "object" && cell !== null) ? cell.materia : cell;
            const tema = (typeof cell === "object" && cell !== null && cell.tema) ? cell.tema : `Tópico de ${materia}`;
            const descricao = (typeof cell === "object" && cell !== null && cell.descricao) ? cell.descricao : "";
            closeSlotModal();
            if (typeof abrirQuestionarioSessao === "function") {
                abrirQuestionarioSessao({
                    materia,
                    tema,
                    descricao,
                    metodologia: metodologiaAtiva
                });
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (!editingCell || !modalSelect) return;
            const novaMateria = modalSelect.value;
            const celulaAtual = currentMatrix[editingCell.r][editingCell.c];

            if (typeof celulaAtual === "object" && celulaAtual !== null) {
                const descAntiga = celulaAtual.descricao || "";
                const materiaAntiga = celulaAtual.materia || "";
                const novaDesc = (materiaAntiga && descAntiga.includes(materiaAntiga))
                    ? descAntiga.replaceAll(materiaAntiga, novaMateria)
                    : `${novaMateria}: ${descAntiga || "Sessão de estudo personalizada."}`;

                currentMatrix[editingCell.r][editingCell.c] = {
                    ...celulaAtual,
                    materia: novaMateria,
                    tema: `Tópico principal de ${novaMateria}`,
                    descricao: novaDesc
                };
            } else {
                currentMatrix[editingCell.r][editingCell.c] = {
                    materia: novaMateria,
                    tema: `Tópico principal de ${novaMateria}`,
                    horario: "",
                    descricao: `${novaMateria}: Sessão de estudo adicionada manualmente com metodologia ${metodologiaAtiva}.`
                };
            }

            saveRoutineMatrix(currentMatrix, null, true);
            renderTable();
            closeSlotModal();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (!editingCell) return;
            currentMatrix[editingCell.r][editingCell.c] = null;
            saveRoutineMatrix(currentMatrix, null, true);
            renderTable();
            closeSlotModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeSlotModal);
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeSlotModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !modal.hidden) closeSlotModal();
        });
    }

    renderTable();
}

document.addEventListener("DOMContentLoaded", function() {
    atualizarTelaInicial();
    inicializarTelaRotinaCompleta();

    const btnLimpar = document.getElementById("btnLimparRotina");
    if (btnLimpar) {
        btnLimpar.addEventListener("click", limparRotina);
    }
});
