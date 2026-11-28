

document.addEventListener("DOMContentLoaded", function() {
    const mainCard = document.getElementById("main-card");
    if (!mainCard) return;

    const steps = [
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Em quais dias da semana você consegue estudar:"
        },
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Informe os horários em que pode começar e terminar seus estudos."
        },
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Em quais matérias você tem mais dificuldades?"
        },
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Quais são suas metas de estudo? Escolha uma sugestão ou escreva a sua:"
        }
    ];

    const difficultyGrid = document.getElementById("difficulty-grid");

    function criarPillMateria(groupName, subject) {
        const label = document.createElement("label");
        label.className = "option-pill";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = groupName;
        input.value = subject;

        const span = document.createElement("span");
        span.textContent = subject;

        label.appendChild(input);
        label.appendChild(span);
        return label;
    }

    STUDYFLOW_CONFIG.MATERIAS_DISPONIVEIS.forEach(subject => {
        if (difficultyGrid) {
            difficultyGrid.appendChild(criarPillMateria("dificuldades", subject));
        }
    });

    const goalsTextarea = document.getElementById("goals");
    const goalChips = document.querySelectorAll(".goal-chip");

    function sincronizarEstadoChips() {
        if (!goalsTextarea) return;
        const textoAtual = goalsTextarea.value.toLowerCase();
        goalChips.forEach(chip => {
            const meta = (chip.dataset.meta || "").toLowerCase();
            chip.classList.toggle("selected", meta !== "" && textoAtual.includes(meta));
        });
    }

    goalChips.forEach(chip => {
        chip.addEventListener("click", () => {
            if (!goalsTextarea) return;
            const metaTexto = chip.dataset.meta || "";
            if (!metaTexto) return;

            const atual = goalsTextarea.value.trim();
            if (!atual) {
                goalsTextarea.value = metaTexto;
            } else if (atual.toLowerCase().includes(metaTexto.toLowerCase())) {

                const linhas = atual
                    .split(/\n|;/)
                    .map(s => s.trim())
                    .filter(s => s && s.toLowerCase() !== metaTexto.toLowerCase());
                goalsTextarea.value = linhas.join("; ");
            } else {
                goalsTextarea.value = `${atual}; ${metaTexto}`;
            }

            sincronizarEstadoChips();
            goalsTextarea.focus();
        });
    });

    if (goalsTextarea) {
        goalsTextarea.addEventListener("input", sincronizarEstadoChips);
    }

    let current = 0;
    const screens = document.querySelectorAll(".screen");
    const nextBtn = document.getElementById("next");
    const backBtn = document.getElementById("back");

    function preencherPreferenciasExistentes() {
        const prefs = obterPreferenciasSalvas();
        if (!prefs) return;

        if (Array.isArray(prefs.dias)) {
            document.querySelectorAll("[name='dias']").forEach(cb => {
                cb.checked = prefs.dias.includes(cb.value);
            });
        }

        if (prefs.horario) {
            const startEl = document.getElementById("start");
            const endEl = document.getElementById("end");
            if (startEl && prefs.horario.inicio) startEl.value = prefs.horario.inicio;
            if (endEl && prefs.horario.fim) endEl.value = prefs.horario.fim;
        }

        if (Array.isArray(prefs.dificuldades)) {
            document.querySelectorAll("[name='dificuldades']").forEach(cb => {
                cb.checked = prefs.dificuldades.includes(cb.value);
            });
        }

        if (goalsTextarea && typeof prefs.metas === "string") {
            goalsTextarea.value = prefs.metas;
            sincronizarEstadoChips();
        }
    }

    function showStep(n) {
        current = n;
        const step = steps[n];

        screens.forEach((el, i) => {
            el.classList.toggle("active", i === n);
        });

        const headingEl = document.getElementById("heading");
        if (headingEl) headingEl.innerHTML = step.title;

        const descEl = document.getElementById("description");
        if (descEl) {
            descEl.innerHTML = step.desc;
            descEl.style.display = step.desc ? "block" : "none";
        }

        if (backBtn) backBtn.hidden = (n === 0);

        const isLast = (n === steps.length - 1);
        if (nextBtn) nextBtn.textContent = isLast ? "Salvar preferências" : "Avançar →";
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            if (current > 0) showStep(current - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", async () => {
            if (current === 0) {
                const diasSelecionados = [...document.querySelectorAll("[name='dias']:checked")];
                if (diasSelecionados.length === 0) {
                    alert("Selecione pelo menos um dia da semana em que você pode estudar.");
                    return;
                }
            }

            if (current === 1) {
                const startVal = document.getElementById("start").value;
                const endVal = document.getElementById("end").value;
                if (!startVal || !endVal) {
                    alert("Informe o horário de início e o horário de término dos seus estudos.");
                    return;
                }
                if (endVal <= startVal) {
                    alert("O horário de término deve ser posterior ao horário de início.");
                    return;
                }
            }

            if (current < steps.length - 1) {
                showStep(current + 1);
            } else {
                const textoOriginal = nextBtn.textContent;
                nextBtn.disabled = true;
                nextBtn.textContent = "Salvando preferências...";

                const prefsAnteriores = obterPreferenciasSalvas() || {};
                const usuarioId = localStorage.getItem("usuarioId");

                const summary = {
                    ...prefsAnteriores,
                    dias: [...document.querySelectorAll("[name='dias']:checked")].map(x => x.value),
                    horario: {
                        inicio: document.getElementById("start").value || "09:00",
                        fim: document.getElementById("end").value || "11:00"
                    },
                    dificuldades: [...document.querySelectorAll("[name='dificuldades']:checked")].map(x => x.value),
                    metas: (goalsTextarea ? goalsTextarea.value.trim() : "") || "Melhorar o desempenho geral nos estudos"
                };

                salvarPreferencias(summary);

                try {
                    if (usuarioId) {
                        await fetch(`${getBasePath()}script/salvar_preferencias.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                usuario_id: usuarioId,
                                dias: summary.dias,
                                horario: summary.horario,
                                metas: summary.metas
                            })
                        });
                    }
                } catch (e) {

                }

                nextBtn.disabled = false;
                nextBtn.textContent = textoOriginal;
                window.location.href = `${getBasePath()}index.html`;
            }
        });
    }

    preencherPreferenciasExistentes();
    showStep(0);
});
