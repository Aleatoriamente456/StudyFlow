<?php
session_start();
require_once "conexao.php";
garantirEstruturaBanco($pdo);

$metodo = $_SERVER["REQUEST_METHOD"];

function obterResumoPorMetodologia(PDO $pdo, int $idUsuario): array {
    $stmt = $pdo->prepare("
        SELECT
            COALESCE(NULLIF(TRIM(metodologia), ''), 'Não informada') AS metodologia,
            COUNT(*) AS total_avaliacoes,
            ROUND(AVG(nota_desempenho), 2) AS media_pontos,
            ROUND(SUM(nota_desempenho), 2) AS soma_pontos
        FROM avaliacao
        WHERE idusuario = ?
        GROUP BY COALESCE(NULLIF(TRIM(metodologia), ''), 'Não informada')
    ");
    $stmt->execute([$idUsuario]);
    $linhas = $stmt->fetchAll();

    $medias = [
        "Pomodoro" => ["media" => null, "total" => 0],
        "Feynman"  => ["media" => null, "total" => 0],
        "SQ3R"     => ["media" => null, "total" => 0]
    ];

    foreach ($linhas as $row) {
        $nome = $row["metodologia"];
        $medias[$nome] = [
            "media" => (float)$row["media_pontos"],
            "total" => (int)$row["total_avaliacoes"]
        ];
    }

    return $medias;
}

if ($metodo === "POST") {
    $dados = json_decode(file_get_contents("php://input"), true);

    $idUsuario   = (int)($_SESSION["usuario_id"] ?? $dados["usuario_id"] ?? 0);
    $metodologia = trim($dados["metodologia"] ?? "Pomodoro");
    $materia     = trim($dados["materia"] ?? "");
    $pontuacao   = (float)($dados["pontuacao"] ?? 0);

    if ($idUsuario <= 0) {
        http_response_code(400);
        echo json_encode(["sucesso" => false, "erro" => "Usuário não identificado."]);
        exit;
    }

    $pontuacao = max(0.0, min(5.0, $pontuacao));

    $pdo->beginTransaction();
    try {

        $stmtAval = $pdo->prepare("
            INSERT INTO avaliacao (idusuario, nota_desempenho, metodologia, materia)
            VALUES (?, ?, ?, ?)
        ");
        $stmtAval->execute([$idUsuario, $pontuacao, $metodologia, $materia]);
        $idAvaliacao = $pdo->lastInsertId();

        $stmtStats = $pdo->prepare("
            SELECT COUNT(*) AS total, AVG(nota_desempenho) AS media_geral
            FROM avaliacao
            WHERE idusuario = ?
        ");
        $stmtStats->execute([$idUsuario]);
        $stats = $stmtStats->fetch();

        $totalAtividades = (int)($stats["total"] ?? 1);
        $mediaGeral      = round((float)($stats["media_geral"] ?? $pontuacao), 2);

        $stmtProgCheck = $pdo->prepare("SELECT idprogresso FROM progresso WHERE idusuario = ? LIMIT 1");
        $stmtProgCheck->execute([$idUsuario]);
        $progExistente = $stmtProgCheck->fetch();

        if ($progExistente) {
            $stmtProgUpd = $pdo->prepare("
                UPDATE progresso
                SET atividadesconcluidas = ?, desempenho = ?
                WHERE idprogresso = ?
            ");
            $stmtProgUpd->execute([$totalAtividades, $mediaGeral, $progExistente["idprogresso"]]);
        } else {
            $stmtProgIns = $pdo->prepare("
                INSERT INTO progresso (idusuario, atividadesconcluidas, desempenho)
                VALUES (?, ?, ?)
            ");
            $stmtProgIns->execute([$idUsuario, $totalAtividades, $mediaGeral]);
        }

        $pdo->commit();

        $mediasMetodologia = obterResumoPorMetodologia($pdo, $idUsuario);

        echo json_encode([
            "sucesso"            => true,
            "id_avaliacao"       => $idAvaliacao,
            "pontuacao"          => $pontuacao,
            "metodologia"        => $metodologia,
            "medias_metodologia" => $mediasMetodologia,
            "media_geral"        => $mediaGeral,
            "total_atividades"   => $totalAtividades
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["sucesso" => false, "erro" => "Erro ao salvar pontuação no banco de dados."]);
    }
    exit;
}

if ($metodo === "GET") {
    $idUsuario = (int)($_SESSION["usuario_id"] ?? $_GET["usuario_id"] ?? 0);

    if ($idUsuario <= 0) {
        echo json_encode(["sucesso" => false, "erro" => "Usuário não identificado."]);
        exit;
    }

    $mediasMetodologia = obterResumoPorMetodologia($pdo, $idUsuario);

    $stmtHist = $pdo->prepare("
        SELECT idavaliacao, nota_desempenho, metodologia, materia, data_avaliacao
        FROM avaliacao
        WHERE idusuario = ?
        ORDER BY idavaliacao DESC
        LIMIT 30
    ");
    $stmtHist->execute([$idUsuario]);
    $historico = $stmtHist->fetchAll();

    echo json_encode([
        "sucesso"            => true,
        "medias_metodologia" => $mediasMetodologia,
        "historico"          => $historico
    ]);
    exit;
}
