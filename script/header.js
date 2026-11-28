

function renderizarCabecalhoCompartilhado() {
    const headerContainer = document.getElementById("appHeader");
    if (!headerContainer) return;

    const basePath = getBasePath();
    const paginaAtual = getCurrentPageName();
    const isIndex = paginaAtual === "index.html" || paginaAtual === "";

    const contextualLinkHref = isIndex
        ? `${basePath}pages/telaPreferencias.html`
        : `${basePath}index.html`;

    const contextualLinkIcon = isIndex
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <circle cx="12" cy="12" r="3"></circle>
               <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
           </svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
               <polyline points="9 22 9 12 15 12 15 22"></polyline>
           </svg>`;

    const contextualLinkLabel = isIndex
        ? "Preferências de Estudo"
        : "Voltar para Início";

    headerContainer.innerHTML = `
        <div class="header-left">
            <a href="${basePath}index.html" style="text-decoration: none; color: inherit;">
                <h2 class="logo-text">
                    Study<span>Flow</span>
                </h2>
            </a>
        </div>

        <div class="profile-wrapper">
            <button class="profile-button" id="profileButton" type="button" aria-label="Perfil" title="Meu Perfil">
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4"
                        stroke="white" stroke-width="1.7"/>
                    <path d="M4.5 20C4.5 16.5 7.5 14 12 14
                        C16.5 14 19.5 16.5 19.5 20"
                        stroke="white" stroke-width="1.7"
                        stroke-linecap="round"/>
                </svg>
            </button>

            <div class="profile-dropdown" id="profileDropdown" hidden>
                <div id="profileLoggedContent">
                    <div class="profile-card-header">
                        <div class="profile-avatar">
                            <span id="profileAvatarInitials">SF</span>
                        </div>
                        <div class="profile-user-info">
                            <h4 class="profile-name" id="profileUserName">Estudante</h4>
                            <p class="profile-email" id="profileUserEmail">estudante@studyflow.com</p>
                            <span class="profile-badge">Estudante Ativo</span>
                        </div>
                    </div>

                    <div class="profile-divider"></div>

                    <div class="profile-details-list">
                        <div class="profile-detail-row">
                            <span class="profile-detail-label">Preferências:</span>
                            <span class="profile-detail-value" id="profilePrefStatus">Pendente</span>
                        </div>
                    </div>

                    <div class="profile-divider"></div>

                    <div class="profile-metrics-box">
                        <div class="profile-metrics-header">
                            <span>Média por Metodologia</span>
                        </div>
                        <div class="profile-metrics-list" id="profileMethodologyMetrics">
                            <div class="profile-metric-row">
                                <span>Pomodoro</span>
                                <strong id="metricPomodoro">Sem notas</strong>
                            </div>
                            <div class="profile-metric-row">
                                <span>Feynman</span>
                                <strong id="metricFeynman">Sem notas</strong>
                            </div>
                            <div class="profile-metric-row">
                                <span>SQ3R</span>
                                <strong id="metricSQ3R">Sem notas</strong>
                            </div>
                        </div>
                    </div>

                    <div class="profile-divider"></div>

                    <div class="profile-actions">
                        <a href="${contextualLinkHref}" class="profile-link-btn">
                            ${contextualLinkIcon}
                            ${contextualLinkLabel}
                        </a>

                        <a href="${basePath}pages/telaRotinaCompleta.html" class="profile-link-btn" id="profileFullRoutineLink" hidden>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Minha Rotina Completa
                        </a>

                        <a href="${basePath}pages/telaCriarRotina.html" class="profile-link-btn" id="profileCreateRoutineLink">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Criar Nova Rotina
                        </a>

                        <button type="button" class="logout-btn" id="btnLogoutDropdown">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Deslogar da conta
                        </button>
                    </div>
                </div>

                <div id="profileVisitorContent" hidden>
                    <div class="profile-card-header">
                        <div class="profile-avatar visitor">
                            <svg viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" stroke="#7138d4" stroke-width="1.8"/>
                                <path d="M4.5 20C4.5 16.5 7.5 14 12 14 C16.5 14 19.5 16.5 19.5 20" stroke="#7138d4" stroke-width="1.8" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="profile-user-info">
                            <h4 class="profile-name">Visitante</h4>
                            <p class="profile-email">Não autenticado</p>
                            <span class="profile-badge">Modo Convidado</span>
                        </div>
                    </div>

                    <div class="profile-divider"></div>

                    <p class="profile-visitor-msg">
                        Entre na sua conta ou cadastre-se para salvar suas rotinas personalizadas!
                    </p>

                    <div class="profile-visitor-buttons">
                        <a href="${basePath}pages/telaLogin.html" class="button primary">Entrar</a>
                        <a href="${basePath}pages/telaCadastro.html" class="button secondary">Criar conta</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function atualizarDadosPerfil() {
    const usuario = obterDadosUsuario();
    const preferencias = obterPreferenciasSalvas();

    const nomeEl = document.getElementById("profileUserName");
    const emailEl = document.getElementById("profileUserEmail");
    const avatarInitialsEl = document.getElementById("profileAvatarInitials");
    const mainUserEl = document.getElementById("mainUserName");
    const prefStatusEl = document.getElementById("profilePrefStatus");
    const createLinkEl = document.getElementById("profileCreateRoutineLink");

    if (nomeEl) nomeEl.textContent = usuario.nome;
    if (emailEl) emailEl.textContent = usuario.email;
    if (avatarInitialsEl) avatarInitialsEl.textContent = usuario.iniciais;
    if (mainUserEl) mainUserEl.textContent = usuario.nome;  

    if (prefStatusEl) {
        if (preferencias) {
            prefStatusEl.textContent = "Definidas";
            prefStatusEl.style.color = "#10b981";
        } else {
            prefStatusEl.textContent = "Pendente";
            prefStatusEl.style.color = "#f59e0b";
        }
    }

    const fullRoutineLinkEl = document.getElementById("profileFullRoutineLink");
    if (fullRoutineLinkEl) {
        const possuiRotina = typeof temRotinaAtiva === "function" && temRotinaAtiva();
        fullRoutineLinkEl.hidden = !possuiRotina || getCurrentPageName() === "telarotinacompleta.html";
    }

    if (createLinkEl) {
        createLinkEl.hidden = !preferencias || getCurrentPageName() === "telacriarrotina.html";
    }

    const medias = obterMediasPorMetodologia();
    const formatarMetrica = (info) => {
        if (!info || info.total === 0 || info.media === null) {
            return "Sem notas";
        }
        return `${Number(info.media).toFixed(1)} / 5 pts (${info.total})`;
    };

    const elPom = document.getElementById("metricPomodoro");
    const elFey = document.getElementById("metricFeynman");
    const elSq3 = document.getElementById("metricSQ3R");

    if (elPom) elPom.textContent = formatarMetrica(medias.Pomodoro);
    if (elFey) elFey.textContent = formatarMetrica(medias.Feynman);
    if (elSq3) elSq3.textContent = formatarMetrica(medias.SQ3R);

    const loggedContent = document.getElementById("profileLoggedContent");
    const visitorContent = document.getElementById("profileVisitorContent");

    if (loggedContent && visitorContent) {
        loggedContent.hidden = !usuario.logado;
        visitorContent.hidden = usuario.logado;
    }
}

function alternarPerfil(event) {
    if (event) event.stopPropagation();

    const dropdown = document.getElementById("profileDropdown");
    if (!dropdown) return;

    const estaOculto = dropdown.hasAttribute("hidden");
    if (estaOculto) {
        atualizarDadosPerfil();
        dropdown.removeAttribute("hidden");
    } else {
        dropdown.setAttribute("hidden", "");
    }
}

function fecharPerfil() {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) {
        dropdown.setAttribute("hidden", "");
    }
}

function inicializarCabecalho() {
    renderizarCabecalhoCompartilhado();
    atualizarDadosPerfil();

    const btnPerfil = document.getElementById("profileButton");
    if (btnPerfil) {
        btnPerfil.addEventListener("click", alternarPerfil);
    }

    const btnLogout = document.getElementById("btnLogoutDropdown");
    if (btnLogout && typeof realizarLogout === "function") {
        btnLogout.addEventListener("click", realizarLogout);
    }

    document.addEventListener("click", function(event) {
        const wrapper = document.querySelector(".profile-wrapper");
        const dropdown = document.getElementById("profileDropdown");
        if (dropdown && !dropdown.hasAttribute("hidden") && wrapper && !wrapper.contains(event.target)) {
            fecharPerfil();
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            fecharPerfil();
        }
    });
}
