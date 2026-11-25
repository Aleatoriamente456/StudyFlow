<?php
session_start();
require_once "conexao.php";

$dados = json_decode(file_get_contents("php://input"), true);
$email = trim($dados["email"] ?? "");
$senha = $dados["senha"] ?? "";

$stmt = $pdo->prepare("SELECT id, nome, email, senha FROM usuarioperfil WHERE email = ?");
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($senha, $usuario["senha"])) {
    http_response_code(401);
    echo json_encode(["sucesso" => false, "erro" => "E-mail ou senha inválidos."]);
    exit;
}

$_SESSION["usuario_id"] = $usuario["id"];

echo json_encode([
    "sucesso" => true,
    "usuario" => [
        "id" => $usuario["id"],
        "nome" => $usuario["nome"],
        "email" => $usuario["email"]
    ]
]);