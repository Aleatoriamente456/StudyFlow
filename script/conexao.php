<?php
ini_set("display_errors", "0");
ini_set("html_errors", "0");
error_reporting(E_ALL);

if (ob_get_level() === 0) {
    ob_start();
}

header("Content-Type: application/json; charset=UTF-8");

register_shutdown_function(function () {
    $erro = error_get_last();
    if ($erro !== null && in_array($erro["type"], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        if (ob_get_level() > 0) {
            ob_clean();
        }
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=UTF-8");
            http_response_code(500);
        }
        echo json_encode([
            "sucesso" => false,
            "erro"    => "Erro interno no servidor PHP: " . $erro["message"]
        ], JSON_UNESCAPED_UNICODE);
    }
});

$host = "localhost";
$dbname = "studyflow";
$user = "root";
$pass = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    if (ob_get_level() > 0) {
        ob_clean();
    }
    http_response_code(500);
    echo json_encode([
        "sucesso" => false,
        "erro"    => "Falha na conexão com o banco de dados MySQL. Verifique se o WAMP/MySQL está ativo e se o banco 'studyflow' foi importado."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function garantirEstruturaBanco(PDO $pdo): void {
    static $verificado = false;
    if ($verificado) {
        return;
    }
    $verificado = true;

    try {
        $pdo->exec("ALTER TABLE usuarioperfil MODIFY COLUMN senha VARCHAR(255) DEFAULT NULL");
        $pdo->exec("ALTER TABLE preferencias MODIFY COLUMN diasdisponiveis VARCHAR(120) DEFAULT NULL, MODIFY COLUMN metas TEXT");
        $pdo->exec("ALTER TABLE item_rotina MODIFY COLUMN descricao_item TEXT");

        $cols = $pdo->query("SHOW COLUMNS FROM avaliacao")->fetchAll(PDO::FETCH_COLUMN, 0);
        if (!in_array("metodologia", $cols, true)) {
            $pdo->exec("ALTER TABLE avaliacao ADD COLUMN metodologia VARCHAR(45) DEFAULT NULL AFTER nota_desempenho");
        }
        if (!in_array("materia", $cols, true)) {
            $pdo->exec("ALTER TABLE avaliacao ADD COLUMN materia VARCHAR(80) DEFAULT NULL AFTER metodologia");
        }
        if (!in_array("data_avaliacao", $cols, true)) {
            $pdo->exec("ALTER TABLE avaliacao ADD COLUMN data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP AFTER materia");
        }
    } catch (Throwable $e) {

    }
}
