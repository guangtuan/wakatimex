ALTER TABLE `heartbeat`
  ADD COLUMN `lines` INT NULL AFTER `cursorpos`,
  ADD COLUMN `lines_in_file` INT NULL AFTER `lines`,
  ADD COLUMN `lineno` INT NULL AFTER `lines_in_file`,
  ADD COLUMN `cursorpos_line` INT NULL AFTER `lineno`,
  ADD COLUMN `ai_insert` INT NULL AFTER `cursorpos_line`,
  ADD COLUMN `ai_delete` INT NULL AFTER `ai_insert`,
  ADD COLUMN `human_insert` INT NULL AFTER `ai_delete`,
  ADD COLUMN `human_delete` INT NULL AFTER `human_insert`;
