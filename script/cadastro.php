<?php
session_start();
require_once "conexao.php";
garantirEstruturaBanco($pdo);

$dados = json_decode(file_get_contents("php://input"), true) ?: [];
$nome  = trim((string)($dados["nome"] ?? ""));
$email = trim((string)($dados["email"] ?? ""));
$senha = (string)($dados["senha"] ?? "");

if ($email === "" || $senha === "") {
    http_response_code(400);
    echo json_encode(["sucesso" => false, "erro" => "Preencha todos os campos."], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($nome === "") {
    $nome = ucfirst(explode("@", $email)[0]);
}

try {
    $stmt = $pdo->prepare("SELECT id FROM usuarioperfil WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["sucesso" => false, "erro" => "Este e-mail já está cadastrado."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO usuarioperfil (email, nome, senha) VALUES (?, ?, ?)");
    $stmt->execute([$email, $nome, $senhaHash]);

    $novoId = $pdo->lastInsertId();
    $_SESSION["usuario_id"] = $novoId;

    echo json_encode([
        "sucesso" => true,
        "usuario" => [
            "id"    => $novoId,
            "nome"  => $nome,
            "email" => $email
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Erro ao cadastrar usuário no banco de dados."], JSON_UNESCAPED_UNICODE);
    exit;
}
