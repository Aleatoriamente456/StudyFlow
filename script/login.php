<?php
session_start();
require_once "conexao.php";
garantirEstruturaBanco($pdo);

$dados = json_decode(file_get_contents("php://input"), true) ?: [];
$email = trim((string)($dados["email"] ?? ""));
$senha = (string)($dados["senha"] ?? "");

if ($email === "" || $senha === "") {
    http_response_code(400);
    echo json_encode(["sucesso" => false, "erro" => "Informe e-mail e senha."], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, nome, email, senha FROM usuarioperfil WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($senha, (string)$usuario["senha"])) {
        http_response_code(401);
        echo json_encode(["sucesso" => false, "erro" => "E-mail ou senha inválidos."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $_SESSION["usuario_id"] = $usuario["id"];

    echo json_encode([
        "sucesso" => true,
        "usuario" => [
            "id"    => $usuario["id"],
            "nome"  => $usuario["nome"],
            "email" => $usuario["email"]
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Erro ao autenticar usuário."], JSON_UNESCAPED_UNICODE);
    exit;
}
