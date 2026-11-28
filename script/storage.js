

const STUDYFLOW_CONFIG = Object.freeze({
    STORAGE_KEYS: {
        LOGADO: "usuarioLogado",
        NOME: "usuarioNome",
        EMAIL: "usuarioEmail",
        PREFERENCIAS: "studyflow_preferencias",
        ROTINA_COMPLETA: "studyflow_rotina_completa",
        ROTINA_IA: "studyflow_rotina_ia",
        AVALIACOES: "studyflow_avaliacoes_beta",
        MEDIAS_SERVIDOR: "studyflow_medias_servidor"
    },
    METODOLOGIAS: ["Pomodoro", "Feynman", "SQ3R"],
    DIAS_ORDEM: ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
    DIAS_SIGLAS: ["DOM.", "SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SAB."],
    DIAS_NOMES: {
        domingo: "Domingo",
        segunda: "Segunda-feira",
        terca: "Terça-feira",
        quarta: "Quarta-feira",
        quinta: "Quinta-feira",
        sexta: "Sexta-feira",
        sabado: "Sábado"
    },
    MATERIAS_DISPONIVEIS: [
        "Português", "Física", "Literatura",
        "História", "Inglês", "Espanhol", "Geografia",
        "Artes", "Sociologia", "Matemática",
        "Filosofia", "Biologia", "Ed. Física",
        "Química", "Redação"
    ],
    ABREVIACOES_MATERIAS: {
        "Português": "Port.",
        "Matemática": "Mat.",
        "Literatura": "Lit.",
        "Inglês": "Ing.",
        "Espanhol": "Esp.",
        "Ing/esp": "Ing/Esp.",
        "Física": "Fis.",
        "História": "Hist.",
        "Filosofia": "Filo.",
        "Biologia": "Bio.",
        "Química": "Quim.",
        "Geografia": "Geo.",
        "Ed. Física": "Ed Fis.",
        "Sociologia": "Soc.",
        "Artes": "Art.",
        "Redação": "Red."
    }
});

function getBasePath() {
    return window.location.pathname.toLowerCase().includes("/pages/") ? "../" : "";
}

function getCurrentPageName() {
    const parts = window.location.pathname.toLowerCase().split("/");
    return parts[parts.length - 1] || "index.html";
}

function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatarNome(identificador) {
    if (!identificador) return "Estudante";

    let base = identificador.trim();
    if (base.includes("@")) {
        base = base.split("@")[0];
    }

    base = base.replace(/[._-]+/g, " ");

    return base
        .split(" ")
        .filter(palavra => palavra.length > 0)
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
        .join(" ");
}

function obterIniciais(nome) {
    if (!nome) return "SF";
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) {
        return partes[0].slice(0, 2).toUpperCase();
    }
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function obterDadosUsuario() {
    const { STORAGE_KEYS } = STUDYFLOW_CONFIG;
    const isLogado = localStorage.getItem(STORAGE_KEYS.LOGADO) === "true";
    const nome = localStorage.getItem(STORAGE_KEYS.NOME) || "Estudante";
    const email = localStorage.getItem(STORAGE_KEYS.EMAIL) || "estudante@studyflow.com";

    return {
        logado: isLogado,
        nome: nome,
        email: email,
        iniciais: obterIniciais(nome)
    };
}

function salvarSessaoUsuario(nome, email) {
    const { STORAGE_KEYS } = STUDYFLOW_CONFIG;
    localStorage.setItem(STORAGE_KEYS.LOGADO, "true");
    localStorage.setItem(STORAGE_KEYS.NOME, nome);
    localStorage.setItem(STORAGE_KEYS.EMAIL, email);
}

function encerrarSessaoUsuario() {
    const { STORAGE_KEYS } = STUDYFLOW_CONFIG;
    localStorage.removeItem(STORAGE_KEYS.LOGADO);
    localStorage.removeItem(STORAGE_KEYS.NOME);
    localStorage.removeItem(STORAGE_KEYS.EMAIL);
    localStorage.removeItem("usuarioId");
    localStorage.removeItem(STORAGE_KEYS.PREFERENCIAS);
    localStorage.removeItem(STORAGE_KEYS.ROTINA_COMPLETA);
    localStorage.removeItem(STORAGE_KEYS.ROTINA_IA);
    localStorage.removeItem(STORAGE_KEYS.AVALIACOES);
    localStorage.removeItem(STORAGE_KEYS.MEDIAS_SERVIDOR);
}

function preferenciasEstaoDefinidas(prefs) {
    if (!prefs || typeof prefs !== "object") return false;

    const temDias = Array.isArray(prefs.dias) && prefs.dias.length > 0;
    const temDificuldades = Array.isArray(prefs.dificuldades) && prefs.dificuldades.length > 0;
    const temMetas = typeof prefs.metas === "string" && prefs.metas.trim().length > 0;
    const temHorario = Boolean(
        prefs.horario &&
        ((prefs.horario.inicio && prefs.horario.inicio !== "00:00") ||
         (prefs.horario.fim && prefs.horario.fim !== "00:00"))
    );

    return temDias || temDificuldades || temMetas || temHorario;
}

function obterPreferenciasSalvas() {
    const raw = localStorage.getItem(STUDYFLOW_CONFIG.STORAGE_KEYS.PREFERENCIAS);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        return preferenciasEstaoDefinidas(parsed) ? parsed : null;
    } catch (e) {
        return null;
    }
}

function salvarPreferencias(summary) {
    localStorage.setItem(STUDYFLOW_CONFIG.STORAGE_KEYS.PREFERENCIAS, JSON.stringify(summary));
}

function obterRotinaGeradaIA() {
    try {
        const raw = localStorage.getItem(STUDYFLOW_CONFIG.STORAGE_KEYS.ROTINA_IA);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function temRotinaAtiva() {
    const rotinaIA = obterRotinaGeradaIA();
    if (rotinaIA && Array.isArray(rotinaIA.itens) && rotinaIA.itens.length > 0) {
        return true;
    }
    try {
        const rawComp = localStorage.getItem(STUDYFLOW_CONFIG.STORAGE_KEYS.ROTINA_COMPLETA);
        if (rawComp) {
            const parsed = JSON.parse(rawComp);
            return Array.isArray(parsed.matrix) && parsed.matrix.some(row => Array.isArray(row) && row.some(Boolean));
        }
    } catch (e) {
        return false;
    }
    return false;
}

function obterMetodologiaAtiva() {
    const rotinaIA = obterRotinaGeradaIA();
    if (rotinaIA && rotinaIA.metodologia) {
        return rotinaIA.metodologia;
    }
    const prefs = obterPreferenciasSalvas();
    if (prefs && prefs.metodologia) {
        return prefs.metodologia;
    }
    return "Pomodoro";
}

function removerDadosRotina() {
    const { STORAGE_KEYS } = STUDYFLOW_CONFIG;
    localStorage.removeItem(STORAGE_KEYS.ROTINA_COMPLETA);
    localStorage.removeItem(STORAGE_KEYS.ROTINA_IA);
}

function obterAvaliacoesLocais() {
    try {
        const raw = localStorage.getItem(STUDYFLOW_CONFIG.STORAGE_KEYS.AVALIACOES);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function salvarAvaliacaoLocal(registro) {
    const lista = obterAvaliacoesLocais();
    lista.unshift({
        materia: registro.materia || "Estudos Gerais",
        tema: registro.tema || "",
        metodologia: registro.metodologia || "Pomodoro",
        pontuacao: Number(registro.pontuacao ?? 0),
        totalQuestoes: Number(registro.totalQuestoes ?? 5),
        data: registro.data || new Date().toISOString()
    });
    localStorage.setItem(STUDYFLOW_CONFIG.STORAGE_KEYS.AVALIACOES, JSON.stringify(lista.slice(0, 100)));
}

function salvarMediasServidor(mediasObj) {
    if (!mediasObj || typeof mediasObj !== "object") return;
    localStorage.setItem(STUDYFLOW_CONFIG.STORAGE_KEYS.MEDIAS_SERVIDOR, JSON.stringify(mediasObj));
}

function obterMediasPorMetodologia() {
    const resultado = {
        Pomodoro: { media: null, total: 0 },
        Feynman: { media: null, total: 0 },
        SQ3R: { media: null, total: 0 }
    };

    try {
        const rawSrv = localStorage.getItem(STUDYFLOW_CONFIG.STORAGE_KEYS.MEDIAS_SERVIDOR);
        if (rawSrv) {
            const parsed = JSON.parse(rawSrv);
            STUDYFLOW_CONFIG.METODOLOGIAS.forEach(met => {
                if (parsed[met] && typeof parsed[met].total === "number" && parsed[met].total > 0) {
                    resultado[met] = {
                        media: Number(parsed[met].media),
                        total: Number(parsed[met].total)
                    };
                }
            });
            if (Object.values(resultado).some(v => v.total > 0)) {
                return resultado;
            }
        }
    } catch (e) {

    }

    const locais = obterAvaliacoesLocais();
    STUDYFLOW_CONFIG.METODOLOGIAS.forEach(met => {
        const filtradas = locais.filter(a => (a.metodologia || "").toLowerCase() === met.toLowerCase());
        if (filtradas.length > 0) {
            const soma = filtradas.reduce((acc, item) => acc + Number(item.pontuacao || 0), 0);
            resultado[met] = {
                media: Number((soma / filtradas.length).toFixed(2)),
                total: filtradas.length
            };
        }
    });

    return resultado;
}

async function lerRespostaJsonSegura(resposta) {
    const textoBruto = await resposta.text();
    try {
        return JSON.parse(textoBruto);
    } catch (e) {
        const textoLimpo = textoBruto
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        throw new Error(textoLimpo ? `Resposta inválida do servidor: ${textoLimpo.slice(0, 180)}` : "Resposta vazia do servidor.");
    }
}

async function consultarGeminiPeloNavegador(apiKey, prompt) {
    let modelos = [
        "models/gemini-3.5-flash-lite",
        "models/gemini-3-flash-preview",
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

    }

    let ultimoErro = "Falha ao consultar a IA.";
    let sobrecarregado = false;

    for (const modelo of modelos) {
        const isGemma = /gemma/i.test(modelo);
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5 }
        };
        if (!isGemma) {
            payload.generationConfig.responseMimeType = "application/json";
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();

        if (resp.ok) {
            let texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            texto = texto.replace(/^```(?:json)?\s*|\s*```$/gm, "").trim();
            const match = texto.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(match ? match[0] : texto);
            return {
                dados: parsed,
                rotina: parsed,
                modelo: modelo
            };
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
