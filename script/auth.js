/**
 * auth.js - Autenticação, proteção de rotas (Auth Guard) e controle de sessão
 */

const PAGINAS_PROTEGIDAS = ["telapreferencias.html", "telarotinacompleta.html"];
const PAGINAS_APENAS_VISITANTE = ["telalogin.html", "telacadastro.html"];

function aplicarAuthGuard() {
    const usuario = obterDadosUsuario();
    const paginaAtual = getCurrentPageName();
    const basePath = getBasePath();

    if (PAGINAS_PROTEGIDAS.includes(paginaAtual) && !usuario.logado) {
        window.location.replace(`${basePath}pages/telaLogin.html`);
        return false;
    }

    if (PAGINAS_APENAS_VISITANTE.includes(paginaAtual) && usuario.logado) {
        window.location.replace(`${basePath}index.html`);
        return false;
    }

    return true;
}

function validarFormatoEmailOuUsuario(valor) {
    if (!valor || valor.trim().length < 3) return false;
    if (valor.includes("@")) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }
    return true;
}

async function realizarLogin(event) {
    if (event) event.preventDefault();

    const usuarioValor = document.getElementById("usuario").value.trim();
    const senhaValor = document.getElementById("senha").value.trim();

    if (!validarFormatoEmailOuUsuario(usuarioValor) || !senhaValor) {
        alert("Preencha um e-mail ou usuário válido e sua senha.");
        return;
    }

    const emailFormatado = usuarioValor.includes("@")
        ? usuarioValor.toLowerCase()
        : `${usuarioValor.toLowerCase().replace(/\s+/g, "")}@studyflow.com`;

    try {
        const resposta = await fetch(`${getBasePath()}script/login.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailFormatado, senha: senhaValor })
        });

        const resultado = await resposta.json();
        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.erro || "Erro ao realizar login.");
            return;
        }

        localStorage.setItem("usuarioId", resultado.usuario.id);
        salvarSessaoUsuario(resultado.usuario.nome, resultado.usuario.email);
        window.location.href = `${getBasePath()}index.html`;
    } catch (erro) {
        alert("Não foi possível conectar ao servidor WAMP.");
    }
}

async function realizarCadastro(event) {
    if (event) event.preventDefault();

    const usuarioValor = document.getElementById("cadUsuario").value.trim();
    const senhaValor = document.getElementById("cadSenha").value.trim();
    const confirmarSenha = document.getElementById("cadConfirmarSenha").value.trim();

    if (!validarFormatoEmailOuUsuario(usuarioValor)) {
        alert("Informe um e-mail ou nome de usuário válido.");
        return;
    }

    if (senhaValor.length < 4) {
        alert("A senha deve ter pelo menos 4 caracteres.");
        return;
    }

    if (senhaValor !== confirmarSenha) {
        alert("As senhas não coincidem.");
        return;
    }

    const nomeFormatado = formatarNome(usuarioValor);
    const emailFormatado = usuarioValor.includes("@")
        ? usuarioValor.toLowerCase()
        : `${usuarioValor.toLowerCase().replace(/\s+/g, "")}@studyflow.com`;

    try {
        const resposta = await fetch(`${getBasePath()}script/cadastro.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: nomeFormatado,
                email: emailFormatado,
                senha: senhaValor
            })
        });

        const resultado = await resposta.json();
        if (!resposta.ok || !resultado.sucesso) {
            alert(resultado.erro || "Erro ao realizar cadastro.");
            return;
        }

        localStorage.setItem("usuarioId", resultado.usuario.id);
        salvarSessaoUsuario(resultado.usuario.nome, resultado.usuario.email);
        window.location.href = `${getBasePath()}index.html`;
    } catch (erro) {
        alert("Não foi possível conectar ao servidor WAMP.");
    }
}

function realizarLogout() {
    encerrarSessaoUsuario();
    fecharPerfil();

    const paginaAtual = getCurrentPageName();
    if (paginaAtual === "index.html") {
        if (typeof atualizarTelaInicial === "function") {
            atualizarTelaInicial();
        }
    } else {
        window.location.href = `${getBasePath()}index.html`;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    if (!aplicarAuthGuard()) return;

    if (typeof inicializarCabecalho === "function") {
        inicializarCabecalho();
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", realizarLogin);
    }

    const cadastroForm = document.getElementById("cadastroForm");
    if (cadastroForm) {
        cadastroForm.addEventListener("submit", realizarCadastro);
    }
});
