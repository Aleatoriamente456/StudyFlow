<?php
session_start();
require_once "conexao.php";
garantirEstruturaBanco($pdo);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["sucesso" => false, "erro" => "Método não permitido."]);
    exit;
}

$dados = json_decode(file_get_contents("php://input"), true);
$idUsuario = (int)($_SESSION["usuario_id"] ?? $dados["usuario_id"] ?? 0);
$dias      = $dados["dias"] ?? [];
$horario   = $dados["horario"] ?? ["inicio" => "09:00", "fim" => "11:00"];
$metas     = trim($dados["metas"] ?? "");

if ($idUsuario <= 0) {
    http_response_code(400);
    echo json_encode(["sucesso" => false, "erro" => "Usuário não identificado."]);
    exit;
}

$inicioStr = (!empty($horario["inicio"]) && $horario["inicio"] !== "00:00") ? $horario["inicio"] : "09:00";
$fimStr    = (!empty($horario["fim"]) && $horario["fim"] !== "00:00") ? $horario["fim"] : "11:00";

$inicioMin = (int)explode(":", $inicioStr)[0] * 60 + (int)explode(":", $inicioStr)[1];
$fimMin    = (int)explode(":", $fimStr)[0] * 60 + (int)explode(":", $fimStr)[1];
$duracaoMin = ($fimMin > $inicioMin) ? ($fimMin - $inicioMin) : 120;
$horasDisponiveis = max(1, (int)round($duracaoMin / 60));

$diasTexto  = !empty($dias) ? implode(", ", $dias) : "segunda, terca, quarta, quinta, sexta";
$metasTexto = $metas !== "" ? $metas : "Melhorar o desempenho geral nos estudos";

try {
    $stmt = $pdo->prepare(
        "INSERT INTO preferencias (horasdisponiveis, diasdisponiveis, metas, id_usuario) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$horasDisponiveis, $diasTexto, $metasTexto, $idUsuario]);

    echo json_encode([
        "sucesso" => true,
        "id_preferencia" => $pdo->lastInsertId()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Erro ao salvar preferências no banco de dados."]);
}
