<?php
header("Content-Type: application/json; charset=UTF-8");

$host = "localhost";
$dbname = "studyflow";
$user = "root";
$pass = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} 
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => "Falha na conexão com o banco de dados."]);
    exit;
}