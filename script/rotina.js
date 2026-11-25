/**
 * rotina.js - Lógica da tela inicial (prévia da rotina) e da grade semanal completa
 */

function obterRotinaGeradaIA() {
    try {
        const raw = localStorage.getItem("studyflow_rotina_ia");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function limparRotina() {
    removerDadosRotina();
    localStorage.removeItem("studyflow_rotina_ia");
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

    const rotinaIA = obterRotinaGeradaIA();
    if (rotinaIA && Array.isArray(rotinaIA.itens) && rotinaIA.itens.length > 0) {
        grid.innerHTML = "";
        rotinaIA.itens.slice(0, 3).forEach(item => {
            const descricaoComMateria = garantirMateriaNaDescricao(item.descricao, item.materia);

            const card = document.createElement("div");
            card.className = "routine-item-card";
            card.title = descricaoComMateria;

            const iconWrap = document.createElement("div");
            iconWrap.className = "routine-item-icon";
            iconWrap.appendChild(criarIconeLivroSVG("#666"));

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

            const descSmall = document.createElement("small");
            descSmall.style.fontSize = "11px";
            descSmall.style.color = "#6b6878";
            descSmall.style.marginTop = "4px";
            descSmall.style.lineHeight = "1.35";
            descSmall.textContent = descricaoComMateria;

            info.appendChild(daySpan);
            info.appendChild(timeSpan);
            info.appendChild(subjStrong);
            info.appendChild(descSmall);

            card.appendChild(iconWrap);
            card.appendChild(info);
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

    const itensPreview = [];
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

        itensPreview.push({
            dia: dias[diaIdx],
            horario: `${blocoInicio} - ${blocoFim}`,
            materia: materia,
            descricao: `${materia}: Sessão de estudo focada.`
        });

        currentMin += 75;
    }

    grid.innerHTML = "";
    itensPreview.forEach(item => {
        const card = document.createElement("div");
        card.className = "routine-item-card";
        card.title = item.descricao;

        const iconWrap = document.createElement("div");
        iconWrap.className = "routine-item-icon";
        iconWrap.appendChild(criarIconeLivroSVG("#666"));

        const info = document.createElement("div");
        info.className = "routine-item-info";

        const daySpan = document.createElement("span");
        daySpan.className = "routine-item-day";
        daySpan.textContent = item.dia;

        const timeSpan = document.createElement("span");
        timeSpan.className = "routine-item-time";
        timeSpan.textContent = item.horario;

        const subjStrong = document.createElement("strong");
        subjStrong.className = "routine-item-subject";
        subjStrong.textContent = item.materia;

        const descSmall = document.createElement("small");
        descSmall.style.fontSize = "11px";
        descSmall.style.color = "#6b6878";
        descSmall.style.marginTop = "4px";
        descSmall.style.lineHeight = "1.35";
        descSmall.textContent = item.descricao;

        info.appendChild(daySpan);
        info.appendChild(timeSpan);
        info.appendChild(subjStrong);
        info.appendChild(descSmall);

        card.appendChild(iconWrap);
        card.appendChild(info);
        grid.appendChild(card);
    });
}

function atualizarTelaInicial() {
    const usuario = obterDadosUsuario();
    const preferencias = obterPreferenciasSalvas();

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
    } else if (preferencias && telaRotina) {
        telaRotina.hidden = false;
        telaRotina.style.display = "flex";
        renderizarPreviewRotina(preferencias);
    } else if (telaLogado) {
        telaLogado.hidden = false;
        telaLogado.style.display = "block";
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

    const ROWS_COUNT = 4;

    function abbreviateSubject(name) {
        if (!name) return "";
        if (ABREVIACOES_MATERIAS[name]) return ABREVIACOES_MATERIAS[name];
        return name.length > 5 ? name.slice(0, 4) + "." : name;
    }

    function buildInitialMatrix(prefs) {
        const matrix = Array.from({ length: ROWS_COUNT }, () =>
            Array.from({ length: DIAS_ORDEM.length }, () => null)
        );

        const rotinaIA = obterRotinaGeradaIA();
        if (rotinaIA && Array.isArray(rotinaIA.itens) && rotinaIA.itens.length > 0) {
            rotinaIA.itens.forEach(item => {
                const diaChave = (item.dia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const colIdx = DIAS_ORDEM.indexOf(diaChave);
                if (colIdx !== -1) {
                    for (let r = 0; r < ROWS_COUNT; r++) {
                        if (!matrix[r][colIdx]) {
                            matrix[r][colIdx] = {
                                materia: item.materia,
                                horario: item.horario || "",
                                descricao: garantirMateriaNaDescricao(item.descricao, item.materia)
                            };
                            break;
                        }
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
        for (let r = 0; r < ROWS_COUNT; r++) {
            const cols = patternRows[r] || [];
            for (let c = 0; c < cols.length; c++) {
                const colIdx = cols[c];
                const subj = subjects[subjIdx % subjects.length];
                matrix[r][colIdx] = {
                    materia: subj,
                    horario: "",
                    descricao: `${subj}: Sessão de estudo programada.`
                };
                subjIdx++;
            }
        }

        return matrix;
    }

    function saveRoutineMatrix(matrix, signature) {
        let sig = signature;
        if (!sig) {
            try {
                sig = localStorage.getItem(STORAGE_KEYS.PREFERENCIAS) || "{}";
            } catch (e) {
                sig = "{}";
            }
        }
        localStorage.setItem(STORAGE_KEYS.ROTINA_COMPLETA, JSON.stringify({
            signature: sig,
            matrix: matrix
        }));
    }

    function loadRoutineMatrix() {
        const prefs = obterPreferenciasSalvas();
        const prefsSignature = JSON.stringify(prefs || {});

        try {
            const savedRaw = localStorage.getItem(STORAGE_KEYS.ROTINA_COMPLETA);
            if (savedRaw) {
                const savedObj = JSON.parse(savedRaw);
                if (savedObj && savedObj.signature === prefsSignature && Array.isArray(savedObj.matrix)) {
                    return savedObj.matrix;
                }
            }
        } catch (e) {
            // Gera nova matriz se o armazenamento estiver corrompido
        }

        const freshMatrix = buildInitialMatrix(prefs);
        saveRoutineMatrix(freshMatrix, prefsSignature);
        return freshMatrix;
    }

    let currentMatrix = loadRoutineMatrix();
    let editingCell = null;

    const modal = document.getElementById("slotModal");
    const modalSubtitle = document.getElementById("slotModalSubtitle");
    const modalSelect = document.getElementById("slotSubjectSelect");
    const clearBtn = document.getElementById("slotClearBtn");
    const cancelBtn = document.getElementById("slotCancelBtn");
    const saveBtn = document.getElementById("slotSaveBtn");

    function renderTable() {
        tbody.innerHTML = "";

        for (let r = 0; r < ROWS_COUNT; r++) {
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

                    btn.title = `${subject} (${DIAS_SIGLAS[c]})\n${horarioTexto}${descFormatada}\nClique para alterar`;

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
    }

    function openSlotModal(r, c) {
        if (!modal) return;
        editingCell = { r, c };
        const cell = currentMatrix[r][c];
        const currentVal = (typeof cell === "object" && cell !== null ? cell.materia : cell) || MATERIAS_DISPONIVEIS[0];

        if (modalSubtitle) {
            const descExtra = (typeof cell === "object" && cell !== null && cell.descricao)
                ? ` — ${garantirMateriaNaDescricao(cell.descricao, currentVal)}`
                : "";
            modalSubtitle.textContent = `Dia: ${DIAS_SIGLAS[c]} • Bloco ${r + 1}${descExtra}`;
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
                    descricao: novaDesc
                };
            } else {
                currentMatrix[editingCell.r][editingCell.c] = {
                    materia: novaMateria,
                    horario: "",
                    descricao: `${novaMateria}: Sessão de estudo adicionada manualmente.`
                };
            }

            saveRoutineMatrix(currentMatrix);
            renderTable();
            closeSlotModal();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (!editingCell) return;
            currentMatrix[editingCell.r][editingCell.c] = null;
            saveRoutineMatrix(currentMatrix);
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