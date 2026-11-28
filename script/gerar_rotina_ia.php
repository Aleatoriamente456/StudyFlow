<?php
set_time_limit(120);
session_start();
session_write_close();
require_once "conexao.php";
require_once "config_ia.php";
garantirEstruturaBanco($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["sucesso" => false, "erro" => "Método não permitido."], JSON_UNESCAPED_UNICODE);
    exit;
}

function descricaoContemMateria(string $descricao, string $materia): bool {
    if ($materia === "") {
        return true;
    }
    if (function_exists("mb_stripos")) {
        return mb_stripos($descricao, $materia, 0, "UTF-8") !== false;
    }
    return stripos($descricao, $materia) !== false;
}

function extrairJsonRespostaIA(string $texto): ?array {
    $limpo = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($texto));
    $decodificado = json_decode($limpo, true);
    if (is_array($decodificado) && !empty($decodificado["itens"]) && is_array($decodificado["itens"])) {
        return $decodificado;
    }

    if (preg_match('/\{[\s\S]*\}/', $limpo, $match)) {
        $decodificado = json_decode($match[0], true);
        if (is_array($decodificado) && !empty($decodificado["itens"]) && is_array($decodificado["itens"])) {
            return $decodificado;
        }
    }

    return null;
}

function obterProxyWindows(): ?string {
    if (PHP_OS_FAMILY !== "Windows" || !function_exists("shell_exec")) {
        return null;
    }
    $saida = @shell_exec('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" 2>nul');
    if (!$saida) {
        return null;
    }
    if (preg_match('/ProxyEnable\s+REG_DWORD\s+0x1/i', $saida) &&
        preg_match('/ProxyServer\s+REG_SZ\s+([^\r\n]+)/i', $saida, $m)) {
        $proxy = trim($m[1]);
        if ($proxy !== "" && strpos($proxy, "=") === false) {
            return $proxy;
        }
    }
    return null;
}

function obterModelosDisponiveis(string $apiKey, ?string $proxy): array {
    $padrao = [
        "models/gemini-3.5-flash-lite",
        "models/gemini-3-flash-preview",
        "models/gemma-3-27b-it"
    ];

    $url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . urlencode($apiKey);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["x-goog-api-key: " . $apiKey],
        CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0
    ];
    if ($proxy) {
        $opts[CURLOPT_PROXY] = $proxy;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, $opts);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return $padrao;
    }

    $lista = json_decode($response, true);
    if (empty($lista["models"]) || !is_array($lista["models"])) {
        return $padrao;
    }

    $candidatos = [];
    foreach ($lista["models"] as $modelo) {
        $nome = $modelo["name"] ?? "";
        $metodos = $modelo["supportedGenerationMethods"] ?? [];

        if (!in_array("generateContent", $metodos, true)) {
            continue;
        }
        if (!preg_match('/^models\/(gemini|gemma)-/i', $nome)) {
            continue;
        }
        if (preg_match('/(embedding|imagen|veo|tts|audio|robotics|computer-use|deep-research|lyria|latest)/i', $nome)) {
            continue;
        }

        $prioridade = 50;
        if (stripos($nome, "gemini-3.5-flash-lite") !== false) {
            $prioridade = 5;
        } elseif (stripos($nome, "gemini-3") !== false && stripos($nome, "flash") !== false) {
            $prioridade = 10;
        } elseif (stripos($nome, "flash-lite") !== false) {
            $prioridade = 20;
        } elseif (stripos($nome, "flash") !== false) {
            $prioridade = 30;
        } elseif (stripos($nome, "pro") !== false) {
            $prioridade = 40;
        } elseif (stripos($nome, "gemma-3-27b") !== false) {
            $prioridade = 45;
        }

        $candidatos[] = ["nome" => $nome, "prioridade" => $prioridade];
    }

    if (empty($candidatos)) {
        return $padrao;
    }

    usort($candidatos, fn($a, $b) => $a["prioridade"] <=> $b["prioridade"]);
    return array_slice(array_column($candidatos, "nome"), 0, 6);
}

function chamarGeminiViaCurl(string $url, array $payload, string $apiKey, ?string $proxy): array {
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            "Content-Type: application/json",
            "x-goog-api-key: " . $apiKey,
            "Expect:"
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0
    ];

    if ($proxy) {
        $opts[CURLOPT_PROXY] = $proxy;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, $opts);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    return [
        "httpCode" => $httpCode,
        "erroRede" => $curlErr,
        "data"     => json_decode((string)$response, true)
    ];
}

function chamarGeminiComFallbackModelos(string $apiKey, string $prompt, ?string $proxy): array {
    $modelos = obterModelosDisponiveis($apiKey, $proxy);
    $ultimoResultado = ["httpCode" => 0, "erroRede" => "", "data" => null, "rotina" => null, "modelo" => null];
    $teveSobrecarga = false;

    foreach ($modelos as $modelo) {
        $isGemma = stripos($modelo, "gemma") !== false;
        $payload = [
            "contents" => [
                ["parts" => [["text" => $prompt]]]
            ],
            "generationConfig" => [
                "temperature"     => 0.5,
                "maxOutputTokens" => 4096
            ]
        ];

        if (!$isGemma) {
            $payload["generationConfig"]["responseMimeType"] = "application/json";
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/{$modelo}:generateContent?key=" . urlencode($apiKey);
        $res = chamarGeminiViaCurl($url, $payload, $apiKey, $proxy);
        $ultimoResultado = $res;

        if ($res["httpCode"] === 200) {
            $texto = $res["data"]["candidates"][0]["content"]["parts"][0]["text"] ?? "";
            $rotina = extrairJsonRespostaIA($texto);
            if ($rotina) {
                $res["rotina"] = $rotina;
                $res["modelo"] = $modelo;
                return $res;
            }
            continue;
        }

        if ($res["httpCode"] === 0) {
            break;
        }

        if (in_array($res["httpCode"], [429, 503], true)) {
            $teveSobrecarga = true;
            usleep(500000);
            continue;
        }

        if ($res["httpCode"] === 404) {
            continue;
        }

        break;
    }

    $ultimoResultado["sobrecarregado"] = $teveSobrecarga;
    return $ultimoResultado;
}

function gerarRotinaLocalPersonalizada(
    array $dias,
    int $inicioMin,
    int $fimMin,
    array $materias,
    array $dificuldades,
    string $metasTexto,
    string $metodologia,
    array $materiais
): array {
    $nomesDias = [
        "domingo" => "Domingo",
        "segunda" => "Segunda-feira",
        "terca"   => "Terça-feira",
        "quarta"  => "Quarta-feira",
        "quinta"  => "Quinta-feira",
        "sexta"   => "Sexta-feira",
        "sabado"  => "Sábado"
    ];

    $temasPorMateria = [
        "Português"  => ["Interpretação de Texto e Gêneros Textuais", "Coesão, Coerência e Semântica", "Sintaxe e Concordância Verbal/Nominal"],
        "Matemática" => ["Funções Afim, Quadrática e Exponencial", "Razão, Proporção e Porcentagem Aplicada", "Geometria Plana, Espacial e Estatística"],
        "História"   => ["Brasil Colônia, Império e Primeira República", "Era Vargas, Ditadura Militar e Redemocratização", "Guerras Mundiais, Guerra Fria e Geopolítica"],
        "Geografia"  => ["Geopolítica Atual, Globalização e Blocos Econômicos", "Urbanização, Industrialização e Meio Ambiente", "Cartografia, Climatologia e Domínios Morfoclimáticos"],
        "Física"     => ["Cinemática, Dinâmica e Leis de Newton", "Termodinâmica, Óptica e Ondulatória", "Eletrodinâmica, Circuitos e Energia"],
        "Química"    => ["Estequiometria, Soluções e Ligações Químicas", "Termoquímica, Cinética e Equilíbrio Químico", "Química Orgânica e Funções Oxigenadas"],
        "Biologia"   => ["Ecologia, Ciclos Biogeoquímicos e Impactos Ambientais", "Citologia, Genética e Biotecnologia", "Fisiologia Humana e Evolução"],
        "Literatura" => ["Modernismo Brasileiro e Vanguardas Europeias", "Realismo, Machado de Assis e Crítica Social", "Leitura Crítica de Obras Obrigatórias"],
        "Filosofia"  => ["Filosofia Antiga, Ética e Política", "Epistemologia Moderna e Iluminismo", "Filosofia Contemporânea e Direitos Humanos"],
        "Sociologia" => ["Cultura, Indústria Cultural e Cidadania", "Trabalho, Estratificação e Movimentos Sociais", "Estado, Democracia e Pensadores Clássicos"],
        "Inglês"     => ["Leitura Instrumental e Cognatos em Textos Reais", "Tempos Verbais e Conectivos Argumentativos", "Interpretação de Charges, Artigos e Infográficos"],
        "Espanhol"   => ["Compreensão Leitora e Falsos Cognatos", "Vocabulário Contextual e Variedades Linguísticas", "Interpretação de Textos Jornalísticos e Literários"],
        "Redação"    => ["Estrutura Dissertativo-Argumentativa e Tese", "Repertório Sociocultural e Coesão Interparágrafos", "Proposta de Intervenção Completa e Revisão"],
        "Artes"      => ["Arte Moderna, Semana de 22 e Arte Contemporânea", "Patrimônio Cultural e Linguagens Visuais", "Música, Teatro e Expressões Culturais Brasileiras"],
        "Ed. Física" => ["Saúde, Qualidade de Vida e Fisiologia do Exercício", "Esportes, Cultura Corporal e Inclusão", "Práticas Corporais e Bem-Estar Mental"]
    ];

    $diasValidos = array_values(array_filter($dias, fn($d) => isset($nomesDias[$d])));
    if (empty($diasValidos)) {
        $diasValidos = ["segunda", "terca", "quarta", "quinta", "sexta"];
    }

    $materiasBase = !empty($materias) ? $materias : ["Português", "Matemática", "História"];
    foreach ($dificuldades as $dif) {
        if ($dif !== "" && !in_array($dif, $materiasBase, true)) {
            $materiasBase[] = $dif;
        }
    }

    $poolMaterias = [];
    foreach ($materiasBase as $mat) {
        $poolMaterias[] = $mat;
        if (in_array($mat, $dificuldades, true)) {
            $poolMaterias[] = $mat;
        }
    }

    $duracaoDiaria = ($fimMin > $inicioMin) ? ($fimMin - $inicioMin) : 120;
    $blocosPorDia = ($duracaoDiaria >= 150) ? 3 : (($duracaoDiaria >= 90) ? 2 : 1);
    $duracaoBloco = (int)floor(($duracaoDiaria - (($blocosPorDia - 1) * 10)) / $blocosPorDia);
    $duracaoBloco = max(30, min(60, $duracaoBloco));

    $formatarHora = function (int $minutos): string {
        $h = intdiv($minutos, 60) % 24;
        $m = $minutos % 60;
        return sprintf("%02d:%02d", $h, $m);
    };

    $passoMetodologia = match (strtolower($metodologia)) {
        "pomodoro" => "Divida o bloco em ciclos Pomodoro de 25 minutos de foco total e 5 minutos de pausa ativa",
        "feynman"  => "Aplique a técnica de Feynman: estude o conceito central, explique-o com palavras simples e revise as lacunas",
        "sq3r"     => "Siga o método SQ3R: explore os tópicos, formule perguntas, leia ativamente, recite os conceitos e revise",
        default    => "Organize o estudo em leitura dirigida, síntese esquemática e resolução de exercícios"
    };

    $metaLower = function_exists("mb_strtolower") ? mb_strtolower($metasTexto, "UTF-8") : strtolower($metasTexto);
    $conexaoMeta = "Direcione o estudo à meta \"{$metasTexto}\" e finalize com autoavaliação.";
    if (str_contains($metaLower, "enem") || str_contains($metaLower, "vestibular")) {
        $conexaoMeta = "Foque na meta \"{$metasTexto}\", priorizando interpretação e resolução de questões de provas anteriores.";
    } elseif (str_contains($metaLower, "semin") || str_contains($metaLower, "apresent")) {
        $conexaoMeta = "Direcione a sessão à meta \"{$metasTexto}\", organizando fichamento, argumentos centrais e roteiro oral.";
    } elseif (str_contains($metaLower, "prova") || str_contains($metaLower, "bimestr")) {
        $conexaoMeta = "Foque na meta \"{$metasTexto}\", consolidando conceitos essenciais e listas de fixação.";
    }

    $itens = [];
    $idx = 0;
    $contadorPorMateria = [];

    foreach ($diasValidos as $diaChave) {
        $cursorMin = $inicioMin;
        for ($b = 0; $b < $blocosPorDia; $b++) {
            if (count($itens) >= 14) {
                break 2;
            }

            $materiaAtual = $poolMaterias[$idx % count($poolMaterias)];
            $isDificuldade = in_array($materiaAtual, $dificuldades, true);
            $matCount = $contadorPorMateria[$materiaAtual] ?? 0;
            $contadorPorMateria[$materiaAtual] = $matCount + 1;
            $idx++;

            $listaTemas = $temasPorMateria[$materiaAtual] ?? [
                "Fundamentos e Conceitos-Chave de {$materiaAtual}",
                "Aplicações Práticas em {$materiaAtual}",
                "Revisão e Resolução de Questões de {$materiaAtual}"
            ];
            $temaAtual = $listaTemas[$matCount % count($listaTemas)];

            $hIni = $formatarHora($cursorMin);
            $hFim = $formatarHora($cursorMin + $duracaoBloco);
            $cursorMin += $duracaoBloco + 10;

            $prioridadeTexto = $isDificuldade
                ? "Reforço prioritário em {$materiaAtual} (dificuldade), tema: {$temaAtual}."
                : "Sessão de {$materiaAtual}, tema: {$temaAtual}.";

            $extraMaterial = !empty($materiais)
                ? ' Baseie-se no material "' . $materiais[($idx - 1) % count($materiais)] . '".'
                : " Use resumos esquemáticos e exercícios comentados como apoio.";

            $descricao = "{$prioridadeTexto} {$passoMetodologia}. {$conexaoMeta}{$extraMaterial}";

            $itens[] = [
                "dia"       => $diaChave,
                "dia_nome"  => $nomesDias[$diaChave],
                "horario"   => "{$hIni} - {$hFim}",
                "materia"   => $materiaAtual,
                "tema"      => $temaAtual,
                "descricao" => $descricao
            ];
        }
    }

    $difResumo = !empty($dificuldades)
        ? "priorizando " . implode(", ", $dificuldades)
        : "equilibrando todas as matérias selecionadas";

    return [
        "estrategia" => "Rotina semanal estruturada com a metodologia {$metodologia}, {$difResumo} e direcionada à meta: {$metasTexto}.",
        "itens"      => $itens
    ];
}

$apiKey = defined("GEMINI_API_KEY") ? trim(GEMINI_API_KEY) : "";
$dados = json_decode(file_get_contents("php://input"), true) ?: [];

$idUsuario           = (int)($_SESSION["usuario_id"] ?? $dados["usuario_id"] ?? 0);
$dias                = is_array($dados["dias"] ?? null) ? $dados["dias"] : [];
$horario             = is_array($dados["horario"] ?? null) ? $dados["horario"] : ["inicio" => "09:00", "fim" => "11:00"];
$dificuldades        = is_array($dados["dificuldades"] ?? null) ? $dados["dificuldades"] : [];
$metas               = trim((string)($dados["metas"] ?? ""));
$metodologia         = trim((string)($dados["metodologia"] ?? "Pomodoro"));
$materias            = is_array($dados["materias"] ?? null) ? $dados["materias"] : [];
if (!empty($materias)) {
    $dificuldades = array_values(array_intersect($dificuldades, $materias));
}
$materiais           = is_array($dados["materiais"] ?? null) ? $dados["materiais"] : [];
$rotinaPronta        = $dados["rotina_pronta"] ?? null;
$forcarFallbackLocal = !empty($dados["forcar_fallback_local"]);

if ($idUsuario <= 0) {
    http_response_code(400);
    echo json_encode(["sucesso" => false, "erro" => "Usuário não identificado. Faça login novamente."], JSON_UNESCAPED_UNICODE);
    exit;
}

$inicioStr = (!empty($horario["inicio"]) && $horario["inicio"] !== "00:00") ? $horario["inicio"] : "09:00";
$fimStr    = (!empty($horario["fim"]) && $horario["fim"] !== "00:00") ? $horario["fim"] : "11:00";

$partesIni = explode(":", $inicioStr);
$partesFim = explode(":", $fimStr);
$inicioMin = (int)($partesIni[0] ?? 9) * 60 + (int)($partesIni[1] ?? 0);
$fimMin    = (int)($partesFim[0] ?? 11) * 60 + (int)($partesFim[1] ?? 0);
$duracaoMin = ($fimMin > $inicioMin) ? ($fimMin - $inicioMin) : 120;
$horasDisponiveis = max(1, (int)round($duracaoMin / 60));

$diasTexto         = !empty($dias) ? implode(", ", $dias) : "segunda, terca, quarta, quinta, sexta";
$materiasTexto     = !empty($materias) ? implode(", ", $materias) : "Português, Matemática, História";
$dificuldadesTexto = !empty($dificuldades) ? implode(", ", $dificuldades) : "Nenhuma específica";
$metasTexto        = $metas !== "" ? $metas : "Melhorar o desempenho geral nos estudos";
$materiaisTexto    = !empty($materiais) ? implode(", ", $materiais) : "Nenhum arquivo anexado";

$prompt = <<<PROMPT
Você é um especialista em planejamento pedagógico do sistema StudyFlow.
Crie uma rotina de estudos semanal altamente detalhada e personalizada com base exclusivamente nas escolhas e necessidades do estudante abaixo:

- Dias disponíveis na semana (use exatamente as chaves: domingo, segunda, terca, quarta, quinta, sexta, sabado): {$diasTexto}
- Faixa de horário diária disponível: das {$inicioStr} até {$fimStr} ({$horasDisponiveis}h por dia)
- Matérias selecionadas para a rotina: {$materiasTexto}
- Matérias com MAIOR DIFICULDADE (devem receber mais blocos de estudo, revisão espaçada e foco prático): {$dificuldadesTexto}
- Metas pessoais de estudo do aluno: {$metasTexto}
- Metodologia de estudo escolhida: {$metodologia}
- Materiais de estudo enviados pelo aluno: {$materiaisTexto}

Regras obrigatórias para gerar a rotina:
1. Distribua os blocos apenas nos dias disponíveis e respeitando rigorosamente o intervalo entre {$inicioStr} e {$fimStr}.
2. Use EXCLUSIVAMENTE as matérias listadas em "Matérias selecionadas para a rotina", distribuindo-as nos dias disponíveis e entre {$inicioStr} e {$fimStr}.
4. Dê prioridade e maior carga horária às matérias listadas em "Matérias com MAIOR DIFICULDADE" (que já fazem parte das matérias selecionadas).
5. Defina para CADA bloco um campo "tema" específico e relevante para a matéria, conectado diretamente às metas do estudante ({$metasTexto}).
6. O campo "descricao" de CADA item DEVE ser complexo, pedagógico e bem estruturado (3 a 4 frases completas), contendo:
   a) Explicitamente o nome da matéria e o tema específico da sessão;
   b) O passo a passo prático de como aplicar a metodologia "{$metodologia}" durante o bloco;
   c) A conexão direta entre o conteúdo estudado e as metas informadas pelo aluno ({$metasTexto});
   d) Como utilizar os materiais enviados ({$materiaisTexto}) ou, caso não haja anexos, quais recursos/fontes usar e qual atividade prática concluir ao final do bloco.
7. Gere entre 4 e 14 blocos bem distribuídos ao longo dos dias escolhidos.

Responda APENAS com um JSON válido seguindo exatamente esta estrutura:
{
  "estrategia": "Resumo completo de 1 a 2 parágrafos explicando como a rotina atende às dificuldades, metodologia e metas do aluno.",
  "itens": [
    {
      "dia": "segunda",
      "dia_nome": "Segunda-feira",
      "horario": "09:00 - 10:00",
      "materia": "Matemática",
      "tema": "Funções Afim e Quadrática aplicadas a questões contextualizadas",
      "descricao": "Estudo aprofundado de Matemática com foco em Funções Afim e Quadrática. Aplique ciclos Pomodoro de 25 minutos de resolução ativa intercalados com 5 minutos de revisão de fórmulas. Direcione o treino para questões contextualizadas alinhadas à sua meta ({$metasTexto}), concluindo a sessão com uma bateria comentada de exercícios."
    }
  ]
}
PROMPT;

$rotinaIA = null;
$modoGeracao = "ia";
$modeloUsado = null;
$avisoIA = null;

$chaveNaoConfigurada = (
    $apiKey === "" ||
    $apiKey === "api" ||
    $apiKey === "apikey" ||
    $apiKey === "COLE_SUA_CHAVE_API_GEMINI_AQUI"
);

if (is_array($rotinaPronta) && !empty($rotinaPronta["itens"])) {
    $rotinaIA = $rotinaPronta;
    $modoGeracao = "ia_navegador";
} elseif ($forcarFallbackLocal || $chaveNaoConfigurada) {
    $rotinaIA = gerarRotinaLocalPersonalizada(
        $dias,
        $inicioMin,
        $fimMin,
        $materias,
        $dificuldades,
        $metasTexto,
        $metodologia,
        $materiais
    );
    $modoGeracao = "local";
} else {
    $proxy = obterProxyWindows();
    $resultadoApi = chamarGeminiComFallbackModelos($apiKey, $prompt, $proxy);

    if (!empty($resultadoApi["rotina"])) {
        $rotinaIA = $resultadoApi["rotina"];
        $modoGeracao = "ia";
        $modeloUsado = $resultadoApi["modelo"] ?? null;
    } elseif ($resultadoApi["httpCode"] === 0 || in_array($resultadoApi["httpCode"], [408, 502, 503, 504], true)) {
        echo json_encode([
            "sucesso"                 => false,
            "usar_fallback_navegador" => true,
            "api_key"                 => $apiKey,
            "prompt"                  => $prompt
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        $detalhe = $resultadoApi["data"]["error"]["message"]
            ?? ($resultadoApi["erroRede"] ?: "HTTP " . $resultadoApi["httpCode"]);
        $rotinaIA = gerarRotinaLocalPersonalizada(
            $dias,
            $inicioMin,
            $fimMin,
            $materias,
            $dificuldades,
            $metasTexto,
            $metodologia,
            $materiais
        );
        $modoGeracao = "local_fallback";
        $avisoIA = "A rotina foi gerada pelo motor pedagógico local porque a API externa retornou: " . $detalhe;
    }
}

if (!$rotinaIA || empty($rotinaIA["itens"]) || !is_array($rotinaIA["itens"])) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Não foi possível estruturar a rotina. Tente novamente."], JSON_UNESCAPED_UNICODE);
    exit;
}

$pdo->beginTransaction();
try {
    $stmtPref = $pdo->prepare(
        "INSERT INTO preferencias (horasdisponiveis, diasdisponiveis, metas, id_usuario) VALUES (?, ?, ?, ?)"
    );
    $stmtPref->execute([$horasDisponiveis, $diasTexto, $metasTexto, $idUsuario]);
    $idPref = $pdo->lastInsertId();

    $idMetodologia = null;
    if ($metodologia !== "") {
        $stmtMet = $pdo->prepare("SELECT idmetodologia FROM metodologia WHERE nome = ? LIMIT 1");
        $stmtMet->execute([$metodologia]);
        $metExistente = $stmtMet->fetch();

        if ($metExistente) {
            $idMetodologia = $metExistente["idmetodologia"];
        } else {
            $stmtInsMet = $pdo->prepare("INSERT INTO metodologia (nome, descricao) VALUES (?, ?)");
            $stmtInsMet->execute([$metodologia, "Metodologia selecionada pelo usuário no StudyFlow."]);
            $idMetodologia = $pdo->lastInsertId();
        }
    }

    $stmtRot = $pdo->prepare(
        "INSERT INTO rotina (usuario_id, metodologia, preferencia) VALUES (?, ?, ?)"
    );
    $stmtRot->execute([$idUsuario, $idMetodologia, $idPref]);
    $idRotina = $pdo->lastInsertId();

    $stmtItem = $pdo->prepare(
        "INSERT INTO item_rotina (id_rotina, descricao_item) VALUES (?, ?)"
    );

    $itensFormatados = [];
    foreach ($rotinaIA["itens"] as $item) {
        $materiaItem   = trim((string)($item["materia"] ?? ""));
        $temaItem      = trim((string)($item["tema"] ?? "Tópico principal de {$materiaItem}"));
        $diaNomeItem   = trim((string)($item["dia_nome"] ?? $item["dia"] ?? ""));
        $horarioItem   = trim((string)($item["horario"] ?? ""));
        $descricaoItem = trim((string)($item["descricao"] ?? ""));

        if ($materiaItem !== "" && !descricaoContemMateria($descricaoItem, $materiaItem)) {
            $descricaoItem = "{$materiaItem} ({$temaItem}): {$descricaoItem}";
        }

        $item["tema"]        = $temaItem;
        $item["descricao"]   = $descricaoItem;
        $item["metodologia"] = $metodologia;
        $itensFormatados[]   = $item;

        $registroTexto = sprintf(
            "Matéria: %s | Tema: %s | %s (%s) — %s",
            $materiaItem,
            $temaItem,
            $diaNomeItem,
            $horarioItem,
            $descricaoItem
        );
        $stmtItem->execute([$idRotina, $registroTexto]);
    }

    $pdo->commit();

    echo json_encode([
        "sucesso"      => true,
        "id_rotina"    => $idRotina,
        "metodologia"  => $metodologia,
        "modo_geracao" => $modoGeracao,
        "modelo_usado" => $modeloUsado,
        "aviso_ia"     => $avisoIA,
        "estrategia"   => $rotinaIA["estrategia"] ?? "",
        "itens"        => $itensFormatados
    ], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        "sucesso"      => true,
        "id_rotina"    => null,
        "metodologia"  => $metodologia,
        "modo_geracao" => $modoGeracao,
        "modelo_usado" => $modeloUsado,
        "aviso_ia"     => "Aviso MySQL: " . $e->getMessage(),
        "estrategia"   => $rotinaIA["estrategia"] ?? "",
        "itens"        => $itensFormatados ?? $rotinaIA["itens"]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
