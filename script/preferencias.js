/**
 * preferencias.js - Lógica do assistente de 7 etapas de preferências de estudo
 */

async function consultarGeminiPeloNavegador(apiKey, prompt) {
    let modelos = [
        "models/gemini-2.5-flash-lite",
        "models/gemini-2.5-flash",
        "models/gemini-2.5-pro",
        "models/gemma-3-27b-it"
    ];

    try {
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
        if (listResp.ok) {
            const listData = await listResp.json();
            const filtrados = (listData.models || [])
                .filter(m =>
                    (m.supportedGenerationMethods || []).includes("generateContent") &&
                    /^models\/(gemini|gemma)-/i.test(m.name) &&
                    !/(embedding|imagen|veo|tts|audio|robotics|computer-use|deep-research|lyria|latest)/i.test(m.name)
                )
                .map(m => m.name);
            if (filtrados.length > 0) {
                modelos = filtrados.slice(0, 6);
            }
        }
    } catch (e) {
        // Mantém lista padrão
    }

    let ultimoErro = "Falha ao consultar a IA.";
    let sobrecarregado = false;

    for (const modelo of modelos) {
        const isGemma = /gemma/i.test(modelo);
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
        };
        if (!isGemma) {
            payload.generationConfig.responseMimeType = "application/json";
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();

        if (resp.ok) {
            let texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            texto = texto.replace(/^```(?:json)?\s*|\s*```$/gm, "").trim();
            const match = texto.match(/\{[\s\S]*\}/);
            return { rotina: JSON.parse(match ? match[0] : texto) };
        }

        ultimoErro = data?.error?.message || `HTTP ${resp.status}`;
        if ([429, 503].includes(resp.status)) {
            sobrecarregado = true;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
        }
        if (resp.status === 404) {
            continue;
        }
        break;
    }

    if (sobrecarregado) {
        return { forcarFallbackLocal: true };
    }

    throw new Error(ultimoErro);
}

document.addEventListener("DOMContentLoaded", function() {
    const mainCard = document.getElementById("main-card");
    if (!mainCard) return;

    const steps = [
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Em quais dias da semana você consegue estudar:",
            noCard: false
        },
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Informe os horários em que pode começar e terminar seus estudos.",
            noCard: false
        },
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Em quais matérias você tem mais dificuldades?",
            noCard: false
        },
        {
            title: "Definindo suas <br><span>preferências</span>",
            desc: "Quais são suas metas de estudo?",
            noCard: false
        },
        {
            title: "Criando sua rotina <br><span>personalizada</span>",
            desc: "",
            noCard: false
        },
        {
            title: "Criando sua rotina <br><span>personalizada</span>",
            desc: "Quais são as matérias que você quer nesta rotina?",
            noCard: false
        },
        {
            title: "Criando sua rotina <br><span>personalizada</span>",
            desc: "Envie seus materiais!<br>Este não é um passo obrigatório.",
            noCard: true
        }
    ];

    const popup = document.getElementById("popup");
    const methodPills = document.querySelectorAll(".method-pill");

    methodPills.forEach(pill => {
        const showTooltip = () => {
            if (!popup) return;
            popup.textContent = pill.dataset.description || "";
            popup.style.display = "block";
        };
        const hideTooltip = () => {
            if (!popup) return;
            popup.style.display = "none";
        };
        pill.addEventListener("mouseenter", showTooltip);
        pill.addEventListener("mouseleave", hideTooltip);
        pill.addEventListener("focusin", showTooltip);
        pill.addEventListener("focusout", hideTooltip);
    });

    const difficultyGrid = document.getElementById("difficulty-grid");
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
        if (difficultyGrid) {
            difficultyGrid.appendChild(criarPillMateria("dificuldades", subject));
        }
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

        const goalsEl = document.getElementById("goals");
        if (goalsEl && typeof prefs.metas === "string") {
            goalsEl.value = prefs.metas;
        }

        if (prefs.metodologia) {
            document.querySelectorAll("[name='metodo']").forEach(radio => {
                radio.checked = radio.value === prefs.metodologia;
            });
        }

        if (Array.isArray(prefs.materias)) {
            document.querySelectorAll("[name='materias']").forEach(cb => {
                cb.checked = prefs.materias.includes(cb.value);
            });
        }

        if (Array.isArray(prefs.materiais) && prefs.materiais.length > 0) {
            selectedFiles = prefs.materiais.map(name => ({
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
            if (current === 1) {
                const startVal = document.getElementById("start").value;
                const endVal = document.getElementById("end").value;
                if (startVal && endVal && startVal !== "00:00" && endVal !== "00:00" && endVal <= startVal) {
                    alert("O horário de término deve ser posterior ao início.");
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
                const summary = {
                    dias: [...document.querySelectorAll("[name='dias']:checked")].map(x => x.value),
                    horario: {
                        inicio: document.getElementById("start").value,
                        fim: document.getElementById("end").value
                    },
                    dificuldades: [...document.querySelectorAll("[name='dificuldades']:checked")].map(x => x.value),
                    metas: document.getElementById("goals").value,
                    metodologia: document.querySelector("[name='metodo']:checked")?.value || "",
                    materias: [...document.querySelectorAll("[name='materias']:checked")].map(x => x.value),
                    materiais: selectedFiles.map(f => f.name)
                };

                try {
                    let resposta = await fetch(`${getBasePath()}script/gerar_rotina_ia.php`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            usuario_id: usuarioId,
                            ...summary
                        })
                    });

                    let resultado = await resposta.json();

                    // Se o Apache/WAMP estiver bloqueado de acessar a internet, gera pelo navegador e grava no MySQL
                    if (resultado.usar_fallback_navegador && resultado.api_key && resultado.prompt) {
                        const resNav = await consultarGeminiPeloNavegador(resultado.api_key, resultado.prompt);
                        resposta = await fetch(`${getBasePath()}script/gerar_rotina_ia.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                usuario_id: usuarioId,
                                ...summary,
                                rotina_pronta: resNav.rotina || null,
                                forcar_fallback_local: Boolean(resNav.forcarFallbackLocal)
                            })
                        });
                        resultado = await resposta.json();
                    }

                    if (!resposta.ok || !resultado.sucesso) {
                        alert(resultado.erro || "Erro ao gerar rotina com IA.");
                        nextBtn.disabled = false;
                        nextBtn.textContent = textoOriginal;
                        return;
                    }

                    salvarPreferencias(summary);
                    localStorage.setItem("studyflow_rotina_ia", JSON.stringify({
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

    preencherPreferenciasExistentes();
    showStep(0);
});