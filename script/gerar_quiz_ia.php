<?php
set_time_limit(120);
session_start();
session_write_close();
require_once "conexao.php";
require_once "config_ia.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["sucesso" => false, "erro" => "Método não permitido."], JSON_UNESCAPED_UNICODE);
    exit;
}

function extrairJsonQuizIA(string $texto): ?array {
    $limpo = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($texto));
    $decodificado = json_decode($limpo, true);
    if (is_array($decodificado) && !empty($decodificado["questoes"]) && is_array($decodificado["questoes"])) {
        return $decodificado;
    }

    if (preg_match('/\{[\s\S]*\}/', $limpo, $match)) {
        $decodificado = json_decode($match[0], true);
        if (is_array($decodificado) && !empty($decodificado["questoes"]) && is_array($decodificado["questoes"])) {
            return $decodificado;
        }
    }

    return null;
}

function obterProxyWindowsQuiz(): ?string {
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

function obterModelosDisponiveisQuiz(string $apiKey, ?string $proxy): array {
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

function chamarGeminiQuiz(string $apiKey, string $prompt, ?string $proxy): array {
    $modelos = obterModelosDisponiveisQuiz($apiKey, $proxy);

    $ultimo = ["httpCode" => 0, "quiz" => null, "modelo" => null, "erroDetalhe" => ""];
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
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT        => 30,
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

        $data = json_decode((string)$response, true);
        $ultimo["httpCode"] = $httpCode;
        $ultimo["erroDetalhe"] = $data["error"]["message"] ?? ($curlErr ?: "HTTP " . $httpCode);

        if ($httpCode === 200 && $response) {
            $texto = $data["candidates"][0]["content"]["parts"][0]["text"] ?? "";
            $quiz = extrairJsonQuizIA($texto);
            if ($quiz && count($quiz["questoes"]) >= 5) {
                $ultimo["quiz"] = $quiz;
                $ultimo["modelo"] = $modelo;
                return $ultimo;
            }
            continue;
        }

        if ($httpCode === 0) {
            break;
        }
        if (in_array($httpCode, [429, 503, 404], true)) {
            continue;
        }
        break;
    }

    return $ultimo;
}

$dados       = json_decode(file_get_contents("php://input"), true) ?: [];
$materia     = trim((string)($dados["materia"] ?? "Estudos Gerais"));
$tema        = trim((string)($dados["tema"] ?? "Conceitos Fundamentais"));
$descricao   = trim((string)($dados["descricao"] ?? ""));
$metas       = trim((string)($dados["metas"] ?? "Preparação para vestibulares e ENEM"));
$metodologia = trim((string)($dados["metodologia"] ?? "Pomodoro"));

$prompt = <<<PROMPT
Você é um professor elaborador de questões do sistema educacional StudyFlow.
O estudante acabou de concluir uma sessão de estudos com os seguintes dados:
- Matéria: {$materia}
- Tema estudado: {$tema}
- Descrição da sessão: {$descricao}
- Metas do estudante: {$metas}
- Metodologia aplicada: {$metodologia}

Crie um questionário de revisão com EXATAMENTE 5 questões de múltipla escolha sobre o tema estudado, em nível pré-vestibular/ENEM.
Regras obrigatórias:
1. Utilize linguagem objetiva, clara e direta em todos os enunciados, alternativas e explicações, sem rodeios ou textos excessivamente longos.
2. Gere exatamente 5 questões distintas sobre o tema estudado.
3. Cada questão DEVE conter exatamente 5 alternativas (letras "A", "B", "C", "D" e "E").
4. Apenas UMA alternativa por questão deve ter "correta": true, e as outras 4 devem ter "correta": false.
5. TODAS as 5 alternativas de cada questão DEVEM possuir um campo "explicacao" objetivo e claro (1 a 2 frases curtas), justificando de forma direta por que a alternativa correta está certa ou por que a incorreta está errada.

Responda APENAS com um JSON válido seguindo exatamente esta estrutura:
{
  "questoes": [
    {
      "enunciado": "Enunciado claro e objetivo da questão...",
      "alternativas": [
        { "letra": "A", "texto": "Alternativa A objetiva", "correta": false, "explicacao": "Incorreta porque..." },
        { "letra": "B", "texto": "Alternativa B objetiva", "correta": true,  "explicacao": "Correta porque..." },
        { "letra": "C", "texto": "Alternativa C objetiva", "correta": false, "explicacao": "Incorreta porque..." },
        { "letra": "D", "texto": "Alternativa D objetiva", "correta": false, "explicacao": "Incorreta porque..." },
        { "letra": "E", "texto": "Alternativa E objetiva", "correta": false, "explicacao": "Incorreta porque..." }
      ]
    }
  ]
}
PROMPT;

$apiKey = defined("GEMINI_API_KEY") ? trim(GEMINI_API_KEY) : "";
$chaveInvalida = (
    $apiKey === "" ||
    $apiKey === "api" ||
    $apiKey === "apikey" ||
    $apiKey === "COLE_SUA_CHAVE_API_GEMINI_AQUI"
);

if ($chaveInvalida) {
    echo json_encode([
        "sucesso"             => false,
        "usar_fallback_local" => true,
        "motivo"              => "Chave GEMINI_API_KEY não configurada em script/config_ia.php."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$proxy = obterProxyWindowsQuiz();
$resultado = chamarGeminiQuiz($apiKey, $prompt, $proxy);

if (!empty($resultado["quiz"])) {
    echo json_encode([
        "sucesso"      => true,
        "modo_geracao" => "ia",
        "modelo_usado" => $resultado["modelo"],
        "questoes"     => array_slice($resultado["quiz"]["questoes"], 0, 5)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($resultado["httpCode"] === 0) {
    echo json_encode([
        "sucesso"                 => false,
        "usar_fallback_navegador" => true,
        "api_key"                 => $apiKey,
        "prompt"                  => $prompt
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    "sucesso"             => false,
    "usar_fallback_local" => true,
    "motivo"              => $resultado["erroDetalhe"]
], JSON_UNESCAPED_UNICODE);
exit;
