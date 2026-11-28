

document.addEventListener("DOMContentLoaded", function() {
    const mainCard = document.getElementById("create-routine-card");
    if (!mainCard) return;

    const preferencias = obterPreferenciasSalvas();
    if (!preferencias) {
        alert("Defina suas preferências de estudo antes de criar sua rotina.");
        window.location.replace(`${getBasePath()}pages/telaPreferencias.html`);
        return;
    }

    const steps = [
        {
            title: "Criando sua rotina <br><span>personalizada</span>",
            desc: "Escolha a metodologia de estudos que guiará suas sessões:",
            noCard: false
        },
        {
            title: "Criando sua rotina <br><span>personalizada</span>",
            desc: "Quais são as matérias que você quer incluir nesta rotina?",
            noCard: false
        },
        {
            title: "Criando sua rotina <br><span>personalizada</span>",
            desc: "Envie seus materiais de apoio!<br>Este passo é opcional.",
            noCard: true
        }
    ];

    const popup = document.getElementById("popup");
    const methodPills = document.querySelectorAll(".method-pill");

    const restaurarTooltipSelecionada = () => {
        if (!popup) return;
        const marcada = document.querySelector("[name='metodo']:checked");
        const pillMarcada = marcada ? marcada.closest(".method-pill") : null;
        if (pillMarcada && pillMarcada.dataset.description) {
            popup.textContent = pillMarcada.dataset.description;
            popup.style.display = "block";
        } else {
            popup.style.display = "none";
        }
    };

    methodPills.forEach(pill => {
        const showTooltip = () => {
            if (!popup) return;
            popup.textContent = pill.dataset.description || "";
            popup.style.display = "block";
        };
        pill.addEventListener("mouseenter", showTooltip);
        pill.addEventListener("mouseleave", restaurarTooltipSelecionada);
        pill.addEventListener("focusin", showTooltip);
        pill.addEventListener("focusout", restaurarTooltipSelecionada);

        const radio = pill.querySelector("input[type='radio']");
        if (radio) {
            radio.addEventListener("change", showTooltip);
        }
    });

    const subjectsGrid = document.getElementById("subjects-grid");

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
        if (subjectsGrid) {
            subjectsGrid.appendChild(criarPillMateria("materias", subject));
        }
    });

    let current = 0;
    const screens = document.querySelectorAll(".screen");
    const nextBtn = document.getElementById("next");
    const backBtn = document.getElementById("back");
    const addBtn = document.getElementById("add-files");
    const fileInput = document.getElementById("file-input");
    const filesList = document.getElementById("files-list");
    let selectedFiles = [];

    function renderFiles() {
        if (!filesList) return;
        filesList.innerHTML = "";

        selectedFiles.forEach((f, i) => {
            const item = document.createElement("div");
            item.className = "file-card";

            const icon = document.createElement("div");
            icon.className = "file-icon";
            icon.textContent = "📖";

            const info = document.createElement("div");
            info.className = "file-info";

            const strong = document.createElement("strong");
            strong.textContent = f.name;

            const span = document.createElement("span");
            span.textContent = f.meta;

            info.appendChild(strong);
            info.appendChild(span);

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "remove-file";
            removeBtn.setAttribute("aria-label", "Remover");
            removeBtn.textContent = "×";
            removeBtn.addEventListener("click", () => {
                selectedFiles.splice(i, 1);
                renderFiles();
            });

            item.appendChild(icon);
            item.appendChild(info);
            item.appendChild(removeBtn);
            filesList.appendChild(item);
        });
    }

    function preencherDadosExistentes() {
        if (preferencias.metodologia) {
            document.querySelectorAll("[name='metodo']").forEach(radio => {
                radio.checked = radio.value === preferencias.metodologia;
            });
            restaurarTooltipSelecionada();
        }

        const materiasIniciais = (Array.isArray(preferencias.materias) && preferencias.materias.length > 0)
            ? preferencias.materias
            : (Array.isArray(preferencias.dificuldades) ? preferencias.dificuldades : []);

        if (materiasIniciais.length > 0) {
            document.querySelectorAll("[name='materias']").forEach(cb => {
                cb.checked = materiasIniciais.includes(cb.value);
            });
        }

        if (Array.isArray(preferencias.materiais) && preferencias.materiais.length > 0) {
            selectedFiles = preferencias.materiais.map(name => ({
                name: name,
                meta: "Material salvo"
            }));
            renderFiles();
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

        mainCard.classList.toggle("no-card", step.noCard);
        if (backBtn) backBtn.hidden = (n === 0);

        const isLast = (n === steps.length - 1);
        if (addBtn) addBtn.hidden = !isLast;
        if (nextBtn) nextBtn.textContent = isLast ? "Gere sua rotina" : "Avançar →";
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            if (current > 0) showStep(current - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", async () => {
            if (current === 0) {
                const metodoSelecionado = document.querySelector("[name='metodo']:checked");
                if (!metodoSelecionado) {
                    alert("Selecione uma metodologia de estudos (SQ3R, Feynman ou Pomodoro) para continuar.");
                    return;
                }
            }

            if (current === 1) {
                const materiasSelecionadas = [...document.querySelectorAll("[name='materias']:checked")];
                if (materiasSelecionadas.length === 0) {
                    alert("Selecione pelo menos uma matéria para compor sua rotina.");
                    return;
                }
            }

            if (current < steps.length - 1) {
                showStep(current + 1);
            } else {
                const textoOriginal = nextBtn.textContent;
                nextBtn.disabled = true;
                nextBtn.textContent = "Gerando rotina com IA...";

                const usuarioId = localStorage.getItem("usuarioId");
                const metodologiaEscolhida = document.querySelector("[name='metodo']:checked")?.value || "Pomodoro";
                const materiasEscolhidas = [...document.querySelectorAll("[name='materias']:checked")].map(x => x.value);
                const materiaisEscolhidos = selectedFiles.map(f => f.name);

                const summaryCompleto = {
                    ...preferencias,
                    metodologia: metodologiaEscolhida,
                    materias: materiasEscolhidas,
                    materiais: materiaisEscolhidos
                };

                try {
                    let resposta = await fetch(`${getBasePath()}script/gerar_rotina_ia.php`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            usuario_id: usuarioId,
                            ...summaryCompleto
                        })
                    });

                    let resultado = await lerRespostaJsonSegura(resposta);

                    if (resultado.usar_fallback_navegador && resultado.api_key && resultado.prompt) {
                        let resNav = { forcarFallbackLocal: true };
                        try {
                            resNav = await consultarGeminiPeloNavegador(resultado.api_key, resultado.prompt);
                        } catch (navErr) {
                            resNav = { forcarFallbackLocal: true };
                        }
                        resposta = await fetch(`${getBasePath()}script/gerar_rotina_ia.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                usuario_id: usuarioId,
                                ...summaryCompleto,
                                rotina_pronta: resNav.rotina || null,
                                forcar_fallback_local: Boolean(resNav.forcarFallbackLocal)
                            })
                        });
                        resultado = await lerRespostaJsonSegura(resposta);
                    }

                    if (!resposta.ok || !resultado.sucesso) {
                        alert(resultado.erro || "Erro ao gerar rotina com IA.");
                        nextBtn.disabled = false;
                        nextBtn.textContent = textoOriginal;
                        return;
                    }

                    salvarPreferencias(summaryCompleto);
                    localStorage.setItem(STUDYFLOW_CONFIG.STORAGE_KEYS.ROTINA_IA, JSON.stringify({
                        metodologia: resultado.metodologia || metodologiaEscolhida,
                        modo_geracao: resultado.modo_geracao || "ia",
                        modelo_usado: resultado.modelo_usado || null,
                        estrategia: resultado.estrategia,
                        itens: resultado.itens
                    }));
                    localStorage.removeItem(STUDYFLOW_CONFIG.STORAGE_KEYS.ROTINA_COMPLETA);

                    window.location.href = `${getBasePath()}index.html`;
                } catch (erro) {
                    alert("Erro ao gerar rotina: " + (erro.message || "Falha de comunicação."));
                    nextBtn.disabled = false;
                    nextBtn.textContent = textoOriginal;
                }
            }
        });
    }

    if (addBtn && fileInput) {
        addBtn.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", () => {
            [...fileInput.files].forEach(f => {
                const ext = f.name.split(".").pop().toUpperCase();
                const size = Math.max(1, Math.round(f.size / 1024)) + " KB";
                selectedFiles.push({ name: f.name, meta: `${ext} - ${size}` });
            });
            renderFiles();
            fileInput.value = "";
        });
    }

    preencherDadosExistentes();
    showStep(0);
});
