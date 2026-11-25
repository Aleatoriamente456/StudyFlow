<?php
session_start();
require_once "conexao.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "POST") {
    $dados = json_decode(file_get_contents("php://input"), true);
    $idUsuario = (int)($_SESSION["usuario_id"] ?? $dados["usuario_id"] ?? 0);
    $dias      = implode(", ", $dados["dias"] ?? []);
    $metas     = trim($dados["metas"] ?? "");
    $horas     = (int)($dados["horasdisponiveis"] ?? 2);
    $itens     = $dados["itens"] ?? [];

    if ($idUsuario <= 0) {
        http_response_code(400);
        echo json_encode(["sucesso" => false, "erro" => "Usuário não identificado."]);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $stmtPref = $pdo->prepare(
            "INSERT INTO preferencias (horasdisponiveis, diasdisponiveis, metas, id_usuario) VALUES (?, ?, ?, ?)"
        );
        $stmtPref->execute([$horas, $dias, $metas, $idUsuario]);
        $idPref = $pdo->lastInsertId();

        $stmtRot = $pdo->prepare(
            "INSERT INTO rotina (usuario_id, preferencia) VALUES (?, ?)"
        );
        $stmtRot->execute([$idUsuario, $idPref]);
        $idRotina = $pdo->lastInsertId();

        $stmtItem = $pdo->prepare(
            "INSERT INTO item_rotina (id_rotina, descricao_item) VALUES (?, ?)"
        );
        foreach ($itens as $item) {
            if (is_array($item)) {
                $materia   = trim($item["materia"] ?? "");
                $dia       = trim($item["dia_nome"] ?? $item["dia"] ?? "");
                $horario   = trim($item["horario"] ?? "");
                $descricao = trim($item["descricao"] ?? "");
                $texto = "Matéria: {$materia} | {$dia} ({$horario}) — {$descricao}";
            } else {
                $texto = trim((string)$item);
            }
            $stmtItem->execute([$idRotina, $texto]);
        }

        $pdo->commit();
        echo json_encode(["sucesso" => true, "id_rotina" => $idRotina]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["sucesso" => false, "erro" => "Erro ao salvar rotina no banco."]);
    }
}

if ($metodo === "GET") {
    $idUsuario = (int)($_SESSION["usuario_id"] ?? $_GET["usuario_id"] ?? 0);

    $stmt = $pdo->prepare("
        SELECT r.idrotina, p.diasdisponiveis, p.horasdisponiveis, p.metas
        FROM rotina r
        INNER JOIN preferencias p ON r.preferencia = p.idpreferencias
        WHERE r.usuario_id = ?
        ORDER BY r.idrotina DESC
        LIMIT 1
    ");
    $stmt->execute([$idUsuario]);
    $rotina = $stmt->fetch();

    if (!$rotina) {
        echo json_encode(["sucesso" => true, "rotina" => null]);
        exit;
    }

    $stmtItens = $pdo->prepare("SELECT id_item, descricao_item FROM item_rotina WHERE id_rotina = ?");
    $stmtItens->execute([$rotina["idrotina"]]);
    $rotina["itens"] = $stmtItens->fetchAll();

    echo json_encode(["sucesso" => true, "rotina" => $rotina]);
}