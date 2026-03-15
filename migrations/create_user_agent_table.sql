CREATE TABLE IF NOT EXISTS `user_agent` (
  `id` VARCHAR(64) NOT NULL,
  `value` LONGTEXT NULL,
  `editor` VARCHAR(128) NULL,
  `version` VARCHAR(64) NULL,
  `os` VARCHAR(64) NULL,
  `is_browser_extension` TINYINT(1) NOT NULL,
  `is_desktop_app` TINYINT(1) NOT NULL,
  `raw` JSON NOT NULL,
  `synced_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_agent_editor_17f297` (`editor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
