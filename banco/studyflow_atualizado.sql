

CREATE DATABASE IF NOT EXISTS `studyflow`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `studyflow`;

CREATE TABLE IF NOT EXISTS `usuarioperfil` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(120) DEFAULT NULL,
  `nome` varchar(100) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `preferencias` (
  `idpreferencias` int NOT NULL AUTO_INCREMENT,
  `horasdisponiveis` int DEFAULT NULL,
  `diasdisponiveis` varchar(120) DEFAULT NULL,
  `metas` text,
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`idpreferencias`),
  KEY `idusuarioprefs_idx` (`id_usuario`),
  CONSTRAINT `idusuarioprefs` FOREIGN KEY (`id_usuario`) REFERENCES `usuarioperfil` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `metodologia` (
  `idmetodologia` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(45) DEFAULT NULL,
  `descricao` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`idmetodologia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `material_estudo` (
  `idmaterial_estudo` int NOT NULL AUTO_INCREMENT,
  `idusuario` int DEFAULT NULL,
  `nome_arquivo` varchar(120) DEFAULT NULL,
  `tipo_arquivo` varchar(45) DEFAULT NULL,
  `arquivo` blob,
  PRIMARY KEY (`idmaterial_estudo`),
  KEY `idusuario_idx` (`idusuario`),
  CONSTRAINT `idusuar` FOREIGN KEY (`idusuario`) REFERENCES `usuarioperfil` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `rotina` (
  `idrotina` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `metodologia` int DEFAULT NULL,
  `preferencia` int DEFAULT NULL,
  `material` int DEFAULT NULL,
  PRIMARY KEY (`idrotina`),
  KEY `idusuario_idx` (`usuario_id`),
  KEY `metodologia_idx` (`metodologia`),
  KEY `preferencia_idx` (`preferencia`),
  KEY `material_idx` (`material`),
  CONSTRAINT `idusuariorot` FOREIGN KEY (`usuario_id`) REFERENCES `usuarioperfil` (`id`),
  CONSTRAINT `material` FOREIGN KEY (`material`) REFERENCES `material_estudo` (`idmaterial_estudo`),
  CONSTRAINT `metodologia` FOREIGN KEY (`metodologia`) REFERENCES `metodologia` (`idmetodologia`),
  CONSTRAINT `preferencia` FOREIGN KEY (`preferencia`) REFERENCES `preferencias` (`idpreferencias`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `item_rotina` (
  `id_item` int NOT NULL AUTO_INCREMENT,
  `id_rotina` int DEFAULT NULL,
  `descricao_item` text,
  PRIMARY KEY (`id_item`),
  KEY `id_rotina_idx` (`id_rotina`),
  CONSTRAINT `id_rotina` FOREIGN KEY (`id_rotina`) REFERENCES `rotina` (`idrotina`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `avaliacao` (
  `idavaliacao` int NOT NULL AUTO_INCREMENT,
  `idusuario` int DEFAULT NULL,
  `nota_desempenho` float DEFAULT NULL,
  `metodologia` varchar(45) DEFAULT NULL,
  `materia` varchar(80) DEFAULT NULL,
  `data_avaliacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idavaliacao`),
  KEY `idusuario_idx` (`idusuario`),
  CONSTRAINT `idusuario` FOREIGN KEY (`idusuario`) REFERENCES `usuarioperfil` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `progresso` (
  `idprogresso` int NOT NULL AUTO_INCREMENT,
  `idusuario` int DEFAULT NULL,
  `atividadesconcluidas` int DEFAULT NULL,
  `desempenho` float DEFAULT NULL,
  PRIMARY KEY (`idprogresso`),
  KEY `idusuarioprog_idx` (`idusuario`),
  CONSTRAINT `idusuarioprog` FOREIGN KEY (`idusuario`) REFERENCES `usuarioperfil` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `usuarioperfil`
  MODIFY COLUMN `email` varchar(120) DEFAULT NULL,
  MODIFY COLUMN `nome` varchar(100) DEFAULT NULL,
  MODIFY COLUMN `senha` varchar(255) DEFAULT NULL;

ALTER TABLE `preferencias`
  MODIFY COLUMN `diasdisponiveis` varchar(120) DEFAULT NULL,
  MODIFY COLUMN `metas` text;

ALTER TABLE `item_rotina`
  MODIFY COLUMN `descricao_item` text;

