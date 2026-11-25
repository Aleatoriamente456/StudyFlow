/**
 * storage.js - Constantes compartilhadas, estado de sessão, preferências e utilitários
 */

const STUDYFLOW_CONFIG = Object.freeze({
    STORAGE_KEYS: {
        LOGADO: "usuarioLogado",
        NOME: "usuarioNome",
        EMAIL: "usuarioEmail",
        PREFERENCIAS: "studyflow_preferencias",
        ROTINA_COMPLETA: "studyflow_rotina_completa"
    },
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
    localStorage.removeItem("studyflow_rotina_ia");
}

function preferenciasEstaoDefinidas(prefs) {
    if (!prefs || typeof prefs !== "object") return false;

    const temDias = Array.isArray(prefs.dias) && prefs.dias.length > 0;
    const temMaterias = Array.isArray(prefs.materias) && prefs.materias.length > 0;
    const temDificuldades = Array.isArray(prefs.dificuldades) && prefs.dificuldades.length > 0;
    const temMetas = typeof prefs.metas === "string" && prefs.metas.trim().length > 0;
    const temMetodologia = typeof prefs.metodologia === "string" && prefs.metodologia.trim().length > 0;
    const temHorario = Boolean(
        prefs.horario &&
        ((prefs.horario.inicio && prefs.horario.inicio !== "00:00") ||
         (prefs.horario.fim && prefs.horario.fim !== "00:00"))
    );

    return temDias || temMaterias || temDificuldades || temMetas || temMetodologia || temHorario;
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

function removerDadosRotina() {
    const { STORAGE_KEYS } = STUDYFLOW_CONFIG;
    localStorage.removeItem(STORAGE_KEYS.PREFERENCIAS);
    localStorage.removeItem(STORAGE_KEYS.ROTINA_COMPLETA);
}
