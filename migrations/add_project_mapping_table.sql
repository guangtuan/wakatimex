CREATE TABLE IF NOT EXISTS `project_mapping` (
  `id`             VARCHAR(64)  NOT NULL,
  `source_project` VARCHAR(255) NOT NULL,
  `target_project` VARCHAR(255) NOT NULL,
  `created_at`     DATETIME(6)  NOT NULL,
  `updated_at`     DATETIME(6)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_mapping_source_project` (`source_project`),
  KEY `idx_project_mapping_target_project` (`target_project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
