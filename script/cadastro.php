<?php
session_start();
require_once "conexao.php";

$dados = json_decode(file_get_contents("php://input"), true);
$nome  = trim($dados["nome"] ?? "");
$email = trim($dados["email"] ?? "");
$senha = $dados["senha"] ?? "";

if ($email === "" || $senha === "") {
    http_response_code(400);
    echo json_encode(["sucesso" => false, "erro" => "Preencha todos os campos."]);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM usuarioperfil WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["sucesso" => false, "erro" => "Este e-mail já está cadastrado."]);
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
        "id" => $novoId,
        "nome" => $nome,
        "email" => $email
    ]
]);