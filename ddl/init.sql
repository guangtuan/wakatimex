-- wakatimex DDL
-- Full schema initialization (idempotent, safe=True)
-- Generated from src/wakatime_sync/sys/db.py

CREATE TABLE IF NOT EXISTS `heartbeat` (
  `id`              VARCHAR(64)   NOT NULL,
  `time`            DOUBLE        NOT NULL,
  `entity`          LONGTEXT      NULL,
  `hb_type`         VARCHAR(32)   NULL,
  `category`        VARCHAR(64)   NULL,
  `project`         VARCHAR(255)  NULL,
  `branch`          VARCHAR(255)  NULL,
  `language`        VARCHAR(64)   NULL,
  `editor`          VARCHAR(64)   NULL,
  `machine_name_id` VARCHAR(64)   NULL,
  `is_write`        TINYINT(1)    NOT NULL DEFAULT 0,
  `line_no`         INT           NULL,
  `cursorpos`       INT           NULL,
  `lines`           INT           NULL,
  `lines_in_file`   INT           NULL,
  `lineno`          INT           NULL,
  `cursorpos_line`  INT           NULL,
  `ai_insert`       INT           NULL,
  `ai_delete`       INT           NULL,
  `human_insert`    INT           NULL,
  `human_delete`    INT           NULL,
  `raw`             JSON          NOT NULL,
  `synced_at`       DATETIME(6)   NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_heartbeat_time_c0e4b1`     (`time`),
  KEY `idx_heartbeat_project_6a0c45`  (`project`),
  KEY `idx_heartbeat_language_ec5552` (`language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_agent` (
  `id`                   VARCHAR(64)  NOT NULL,
  `value`                LONGTEXT     NULL,
  `editor`               VARCHAR(128) NULL,
  `version`              VARCHAR(64)  NULL,
  `os`                   VARCHAR(64)  NULL,
  `is_browser_extension` TINYINT(1)   NOT NULL DEFAULT 0,
  `is_desktop_app`       TINYINT(1)   NOT NULL DEFAULT 0,
  `raw`                  JSON         NOT NULL,
  `synced_at`            DATETIME(6)  NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_agent_editor_17f297` (`editor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sync_state` (
  `key`        VARCHAR(64)  NOT NULL,
  `value`      VARCHAR(255) NOT NULL,
  `updated_at` DATETIME(6)  NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
