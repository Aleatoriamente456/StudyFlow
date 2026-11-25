<?php
set_time_limit(120);
session_start();
require_once "conexao.php";

define("GEMINI_API_KEY", "api");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["sucesso" => false, "erro" => "Método não permitido."]);
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
    $saida = @shell_exec('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" 2>nul');
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
        "models/gemini-2.5-flash-lite",
        "models/gemini-2.5-flash",
        "models/gemini-2.5-pro",
        "models/gemma-3-27b-it"
    ];

    $url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . urlencode($apiKey);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
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
        if (stripos($nome, "flash-lite") !== false) {
            $prioridade = 10;
        } elseif (stripos($nome, "gemini-3") !== false && stripos($nome, "flash") !== false) {
            $prioridade = 20;
        } elseif (stripos($nome, "gemini-2.5-flash") !== false) {
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

function chamarGeminiViaCurl(string $url, array $payload, ?string $proxy): array {
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json", "Expect:"],
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT        => 22,
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
    $ultimoResultado = ["httpCode" => 0, "erroRede" => "", "data" => null, "rotina" => null];
    $teveSobrecarga = false;

    foreach ($modelos as $modelo) {
        $isGemma = stripos($modelo, "gemma") !== false;
        $payload = [
            "contents" => [
                ["parts" => [["text" => $prompt]]]
            ],
            "generationConfig" => [
                "temperature" => 0.7
            ]
        ];

        if (!$isGemma) {
            $payload["generationConfig"]["responseMimeType"] = "application/json";
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/{$modelo}:generateContent?key=" . urlencode($apiKey);
        $res = chamarGeminiViaCurl($url, $payload, $proxy);
        $ultimoResultado = $res;

        if ($res["httpCode"] === 200) {
            $texto = $res["data"]["candidates"][0]["content"]["parts"][0]["text"] ?? "";
            $rotina = extrairJsonRespostaIA($texto);
            if ($rotina) {
                $res["rotina"] = $rotina;
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

    // Dá peso dobrado às matérias marcadas com maior dificuldade
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

    $dicaMetodologia = match (strtolower($metodologia)) {
        "pomodoro" => "aplicando ciclos Pomodoro (25 min de foco total + 5 min de pausa)",
        "feynman"  => "aplicando a técnica Feynman (estudo do conceito seguido de explicação em voz alta com palavras simples)",
        "sq3r"     => "seguindo as etapas SQ3R (Explorar, Questionar, Ler, Recitar e Revisar)",
        default    => "com foco ativo e revisão ao final"
    };

    $itens = [];
    $idx = 0;

    foreach ($diasValidos as $diaChave) {
        $cursorMin = $inicioMin;
        for ($b = 0; $b < $blocosPorDia; $b++) {
            if (count($itens) >= 14) {
                break 2;
            }

            $materiaAtual = $poolMaterias[$idx % count($poolMaterias)];
            $isDificuldade = in_array($materiaAtual, $dificuldades, true);
            $idx++;

            $hIni = $formatarHora($cursorMin);
            $hFim = $formatarHora($cursorMin + $duracaoBloco);
            $cursorMin += $duracaoBloco + 10;

            $focoTexto = $isDificuldade
                ? "reforço intensivo e resolução de exercícios práticos"
                : "estudo teórico e fixação de conteúdo";

            $extraMaterial = !empty($materiais)
                ? " utilizando o material \"" . $materiais[$idx % count($materiais)] . "\""
                : "";

            $descricao = "Estudo de {$materiaAtual}: {$focoTexto}{$extraMaterial}, {$dicaMetodologia}.";

            $itens[] = [
                "dia"      => $diaChave,
                "dia_nome" => $nomesDias[$diaChave],
                "horario"  => "{$hIni} - {$hFim}",
                "materia"  => $materiaAtual,
                "descricao" => $descricao
            ];
        }
    }

    $difResumo = !empty($dificuldades)
        ? "priorizando " . implode(", ", $dificuldades)
        : "equilibrando todas as matérias selecionadas";

    return [
        "estrategia" => "Rotina semanal organizada com metodologia {$metodologia}, {$difResumo} e alinhada à meta: {$metasTexto}.",
        "itens"      => $itens
    ];
}

$apiKey = trim(GEMINI_API_KEY);
if ($apiKey === "" || $apiKey === "COLE_SUA_CHAVE_API_GEMINI_AQUI") {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Configure sua GEMINI_API_KEY em script/gerar_rotina_ia.php."]);
    exit;
}

$dados = json_decode(file_get_contents("php://input"), true);

$idUsuario          = (int)($_SESSION["usuario_id"] ?? $dados["usuario_id"] ?? 0);
$dias               = $dados["dias"] ?? [];
$horario            = $dados["horario"] ?? ["inicio" => "09:00", "fim" => "11:00"];
$dificuldades       = $dados["dificuldades"] ?? [];
$metas              = trim($dados["metas"] ?? "");
$metodologia        = trim($dados["metodologia"] ?? "Pomodoro");
$materias           = $dados["materias"] ?? [];
$materiais          = $dados["materiais"] ?? [];
$rotinaPronta       = $dados["rotina_pronta"] ?? null;
$forcarFallbackLocal = !empty($dados["forcar_fallback_local"]);

if ($idUsuario <= 0) {
    http_response_code(400);
    echo json_encode(["sucesso" => false, "erro" => "Usuário não identificado. Faça login novamente."]);
    exit;
}

$inicioStr = (!empty($horario["inicio"]) && $horario["inicio"] !== "00:00") ? $horario["inicio"] : "09:00";
$fimStr    = (!empty($horario["fim"]) && $horario["fim"] !== "00:00") ? $horario["fim"] : "11:00";

$inicioMin = (int)explode(":", $inicioStr)[0] * 60 + (int)explode(":", $inicioStr)[1];
$fimMin    = (int)explode(":", $fimStr)[0] * 60 + (int)explode(":", $fimStr)[1];
$duracaoMin = ($fimMin > $inicioMin) ? ($fimMin - $inicioMin) : 120;
$horasDisponiveis = max(1, (int)round($duracaoMin / 60));

$diasTexto         = !empty($dias) ? implode(", ", $dias) : "segunda, terca, quarta, quinta, sexta";
$materiasTexto     = !empty($materias) ? implode(", ", $materias) : "Português, Matemática, História";
$dificuldadesTexto = !empty($dificuldades) ? implode(", ", $dificuldades) : "Nenhuma específica";
$metasTexto        = $metas !== "" ? $metas : "Melhorar o desempenho geral nos estudos";
$materiaisTexto    = !empty($materiais) ? implode(", ", $materiais) : "Nenhum arquivo anexado";

$prompt = <<<PROMPT
Você é um especialista em planejamento pedagógico do sistema StudyFlow.
Crie uma rotina de estudos semanal totalmente personalizada com base exclusivamente nas escolhas e necessidades do estudante abaixo:

- Dias disponíveis na semana (use exatamente as chaves: domingo, segunda, terca, quarta, quinta, sexta, sabado): {$diasTexto}
- Faixa de horário diária disponível: das {$inicioStr} até {$fimStr} ({$horasDisponiveis}h por dia)
- Matérias selecionadas para a rotina: {$materiasTexto}
- Matérias com MAIOR DIFICULDADE (devem receber mais blocos de estudo, revisão espaçada e foco prático): {$dificuldadesTexto}
- Metas pessoais de estudo do aluno: {$metasTexto}
- Metodologia de estudo escolhida: {$metodologia}
- Materiais de estudo enviados pelo aluno: {$materiaisTexto}

Regras obrigatórias para gerar a rotina:
1. Distribua os blocos apenas nos dias disponíveis e respeitando rigorosamente o intervalo entre {$inicioStr} e {$fimStr}.
2. Dê prioridade e maior carga horária às matérias listadas em "Matérias com MAIOR DIFICULDADE".
3. O campo "descricao" de CADA item DEVE conter explicitamente o nome da matéria a que o bloco pertence (ex.: "Estudo de Matemática: resolução de listas...").
4. Incorpore a metodologia "{$metodologia}" diretamente na descrição prática de cada item.
5. Quando houver materiais enviados ({$materiaisTexto}), mencione como utilizá-los nos blocos correspondentes.
6. Quando NÃO houver materiais enviados, inclua fontes que serviam para o estudo do aluno e sejam coerentes com os critérios definidos.
7. Alinhe as atividades às metas do aluno ({$metasTexto}).
8. Gere entre 4 e 14 blocos bem distribuídos ao longo dos dias escolhidos.

Responda APENAS com um JSON válido seguindo exatamente esta estrutura:
{
  "estrategia": "Resumo completo de 1 a 2 parágrafos explicando como a rotina atende às dificuldades e metas do aluno.",
  "itens": [
    {
      "dia": "segunda",
      "dia_nome": "Segunda-feira",
      "horario": "09:00 - 10:00",
      "materia": "Matemática",
      "descricao": "Estudo de Matemática: resolução de exercícios aplicando ciclos Pomodoro (25m foco + 5m pausa) com foco nas dificuldades."
    }
  ]
}
PROMPT;

$rotinaIA = null;

if (is_array($rotinaPronta) && !empty($rotinaPronta["itens"])) {
    $rotinaIA = $rotinaPronta;
} elseif ($forcarFallbackLocal) {
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
} else {
    $proxy = obterProxyWindows();
    $resultadoApi = chamarGeminiComFallbackModelos($apiKey, $prompt, $proxy);

    if (!empty($resultadoApi["rotina"])) {
        $rotinaIA = $resultadoApi["rotina"];
    } elseif ($resultadoApi["httpCode"] === 0) {
        echo json_encode([
            "sucesso"                 => false,
            "usar_fallback_navegador" => true,
            "api_key"                 => $apiKey,
            "prompt"                  => $prompt
        ]);
        exit;
    } elseif (!empty($resultadoApi["sobrecarregado"]) || in_array($resultadoApi["httpCode"], [429, 503], true)) {
        // Todos os modelos da API estão em pico de demanda: gera rotina personalizada localmente
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
    } else {
        $detalhe = $resultadoApi["data"]["error"]["message"]
            ?? ($resultadoApi["erroRede"] ?: "HTTP " . $resultadoApi["httpCode"]);
        http_response_code(502);
        echo json_encode([
            "sucesso" => false,
            "erro" => "Erro ao consultar a IA: " . $detalhe
        ]);
        exit;
    }
}

if (!$rotinaIA || empty($rotinaIA["itens"]) || !is_array($rotinaIA["itens"])) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Não foi possível estruturar a rotina. Tente novamente."]);
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
        $materiaItem   = trim($item["materia"] ?? "");
        $diaNomeItem   = trim($item["dia_nome"] ?? $item["dia"] ?? "");
        $horarioItem   = trim($item["horario"] ?? "");
        $descricaoItem = trim($item["descricao"] ?? "");

        if ($materiaItem !== "" && !descricaoContemMateria($descricaoItem, $materiaItem)) {
            $descricaoItem = "{$materiaItem}: {$descricaoItem}";
        }

        $item["descricao"] = $descricaoItem;
        $itensFormatados[] = $item;

        $registroTexto = sprintf(
            "Matéria: %s | %s (%s) — %s",
            $materiaItem,
            $diaNomeItem,
            $horarioItem,
            $descricaoItem
        );
        $stmtItem->execute([$idRotina, $registroTexto]);
    }

    $pdo->commit();

    echo json_encode([
        "sucesso"    => true,
        "id_rotina"  => $idRotina,
        "estrategia" => $rotinaIA["estrategia"] ?? "",
        "itens"      => $itensFormatados
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Erro ao salvar a rotina gerada no banco de dados."]);
}