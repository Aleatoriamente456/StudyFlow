📚 StudyFlow

Sistema web para organização e personalização de rotinas de estudo com suporte a Inteligência Artificial (Google Gemini) e questionários de revisão pós-sessão.

✨ Funcionalidades

Autenticação de Usuários: Cadastro e login com armazenamento de perfil e sessões no banco de dados.

Preferências de Estudo: Configuração de dias disponíveis da semana, faixa de horários, matérias com maior dificuldade e metas pessoais.

Criação de Rotinas Personalizadas: Geração de cronograma semanal estruturado com base nas metodologias Pomodoro, Feynman ou SQ3R, integrado à API do Google Gemini (com motor pedagógico local de contingência).

Grade Semanal Interativa: Visualização completa da semana com edição e remoção de blocos de estudo.

Questionários Pós-Sessão: Avaliação automática de 5 questões de múltipla escolha com gabarito comentado e cálculo de média de desempenho por metodologia.

🛠️ Tecnologias Utilizadas

Front-end: HTML5, CSS3 e JavaScript (Vanilla)

Back-end: PHP 8+ (PDO)

Banco de Dados: MySQL

Inteligência Artificial: Google Gemini API

📁 Estrutura de Pastas

studyFlow/
├── banco/
│   └── studyflow_atualizado.sql   # Script de criação das tabelas do MySQL
├── img/                           # Logotipos e ícones da aplicação
├── pages/                         # Telas internas (login, cadastro, preferências, rotina)
├── script/                        # Lógica front-end (.js) e endpoints back-end (.php)
├── style/                         # Folhas de estilo CSS
└── index.html                     # Página inicial


⚙️ Como Executar Localmente (WAMP / XAMPP)

Clone ou baixe o repositório dentro da pasta pública do seu servidor local (ex.: C:\wamp64\www\studyFlow).

Importe o banco de dados:

Acesse o phpMyAdmin (http://localhost/phpmyadmin).

Importe o arquivo banco/studyflow_atualizado.sql para criar o banco studyflow e suas tabelas.

Configure a conexão com o MySQL:

Verifique as credenciais ($host, $dbname, $user, $pass) no arquivo script/conexao.php.

Configure a chave da API do Google Gemini:

Gere uma chave gratuita no Google AI Studio.

Abra script/config_ia.php e insira sua chave na constante GEMINI_API_KEY.

Acesse no navegador:

Abra http://localhost/studyFlow/index.html.
