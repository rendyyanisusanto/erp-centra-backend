CREATE TABLE IF NOT EXISTS `material_issues` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `issue_number` VARCHAR(255) NOT NULL,
  `date` DATETIME NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `department` VARCHAR(255) NOT NULL,
  `recipient_employee_id` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `description` TEXT NULL,
  `created_by` INT NOT NULL,
  `approved_by` INT NULL,
  `approved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_material_issues_issue_number` (`issue_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `material_issue_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `material_issue_id` INT NOT NULL,
  `raw_material_id` INT NOT NULL,
  `qty` DECIMAL(15,2) NOT NULL,
  `unit_id` INT NOT NULL,
  `note` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_idx_issue_status := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'material_issues'
    AND index_name = 'idx_material_issues_status'
);
SET @sql_idx_issue_status := IF(
  @has_idx_issue_status = 0,
  'ALTER TABLE `material_issues` ADD INDEX `idx_material_issues_status` (`status`)',
  'SELECT 1'
);
PREPARE stmt_idx_issue_status FROM @sql_idx_issue_status;
EXECUTE stmt_idx_issue_status;
DEALLOCATE PREPARE stmt_idx_issue_status;

SET @has_idx_issue_date := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'material_issues'
    AND index_name = 'idx_material_issues_date'
);
SET @sql_idx_issue_date := IF(
  @has_idx_issue_date = 0,
  'ALTER TABLE `material_issues` ADD INDEX `idx_material_issues_date` (`date`)',
  'SELECT 1'
);
PREPARE stmt_idx_issue_date FROM @sql_idx_issue_date;
EXECUTE stmt_idx_issue_date;
DEALLOCATE PREPARE stmt_idx_issue_date;

SET @has_idx_issue_department := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'material_issues'
    AND index_name = 'idx_material_issues_department'
);
SET @sql_idx_issue_department := IF(
  @has_idx_issue_department = 0,
  'ALTER TABLE `material_issues` ADD INDEX `idx_material_issues_department` (`department`)',
  'SELECT 1'
);
PREPARE stmt_idx_issue_department FROM @sql_idx_issue_department;
EXECUTE stmt_idx_issue_department;
DEALLOCATE PREPARE stmt_idx_issue_department;

SET @has_idx_issue_recipient := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'material_issues'
    AND index_name = 'idx_material_issues_recipient_employee_id'
);
SET @sql_idx_issue_recipient := IF(
  @has_idx_issue_recipient = 0,
  'ALTER TABLE `material_issues` ADD INDEX `idx_material_issues_recipient_employee_id` (`recipient_employee_id`)',
  'SELECT 1'
);
PREPARE stmt_idx_issue_recipient FROM @sql_idx_issue_recipient;
EXECUTE stmt_idx_issue_recipient;
DEALLOCATE PREPARE stmt_idx_issue_recipient;

SET @has_idx_mid_issue := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'material_issue_details'
    AND index_name = 'idx_material_issue_details_material_issue_id'
);
SET @sql_idx_mid_issue := IF(
  @has_idx_mid_issue = 0,
  'ALTER TABLE `material_issue_details` ADD INDEX `idx_material_issue_details_material_issue_id` (`material_issue_id`)',
  'SELECT 1'
);
PREPARE stmt_idx_mid_issue FROM @sql_idx_mid_issue;
EXECUTE stmt_idx_mid_issue;
DEALLOCATE PREPARE stmt_idx_mid_issue;

SET @has_idx_mid_rm := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'material_issue_details'
    AND index_name = 'idx_material_issue_details_raw_material_id'
);
SET @sql_idx_mid_rm := IF(
  @has_idx_mid_rm = 0,
  'ALTER TABLE `material_issue_details` ADD INDEX `idx_material_issue_details_raw_material_id` (`raw_material_id`)',
  'SELECT 1'
);
PREPARE stmt_idx_mid_rm FROM @sql_idx_mid_rm;
EXECUTE stmt_idx_mid_rm;
DEALLOCATE PREPARE stmt_idx_mid_rm;

SET @has_idx_mid_unit := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'material_issue_details'
    AND index_name = 'idx_material_issue_details_unit_id'
);
SET @sql_idx_mid_unit := IF(
  @has_idx_mid_unit = 0,
  'ALTER TABLE `material_issue_details` ADD INDEX `idx_material_issue_details_unit_id` (`unit_id`)',
  'SELECT 1'
);
PREPARE stmt_idx_mid_unit FROM @sql_idx_mid_unit;
EXECUTE stmt_idx_mid_unit;
DEALLOCATE PREPARE stmt_idx_mid_unit;

SET @has_fk_issue_created_by := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'material_issues'
    AND constraint_name = 'fk_material_issues_created_by'
);
SET @sql_fk_issue_created_by := IF(
  @has_fk_issue_created_by = 0,
  'ALTER TABLE `material_issues` ADD CONSTRAINT `fk_material_issues_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_fk_issue_created_by FROM @sql_fk_issue_created_by;
EXECUTE stmt_fk_issue_created_by;
DEALLOCATE PREPARE stmt_fk_issue_created_by;

SET @has_fk_issue_approved_by := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'material_issues'
    AND constraint_name = 'fk_material_issues_approved_by'
);
SET @sql_fk_issue_approved_by := IF(
  @has_fk_issue_approved_by = 0,
  'ALTER TABLE `material_issues` ADD CONSTRAINT `fk_material_issues_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_fk_issue_approved_by FROM @sql_fk_issue_approved_by;
EXECUTE stmt_fk_issue_approved_by;
DEALLOCATE PREPARE stmt_fk_issue_approved_by;

SET @has_fk_issue_recipient := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'material_issues'
    AND constraint_name = 'fk_material_issues_recipient_employee_id'
);
SET @sql_fk_issue_recipient := IF(
  @has_fk_issue_recipient = 0,
  'ALTER TABLE `material_issues` ADD CONSTRAINT `fk_material_issues_recipient_employee_id` FOREIGN KEY (`recipient_employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_fk_issue_recipient FROM @sql_fk_issue_recipient;
EXECUTE stmt_fk_issue_recipient;
DEALLOCATE PREPARE stmt_fk_issue_recipient;

SET @has_fk_mid_issue := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'material_issue_details'
    AND constraint_name = 'fk_material_issue_details_material_issue_id'
);
SET @sql_fk_mid_issue := IF(
  @has_fk_mid_issue = 0,
  'ALTER TABLE `material_issue_details` ADD CONSTRAINT `fk_material_issue_details_material_issue_id` FOREIGN KEY (`material_issue_id`) REFERENCES `material_issues` (`id`) ON UPDATE CASCADE ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk_mid_issue FROM @sql_fk_mid_issue;
EXECUTE stmt_fk_mid_issue;
DEALLOCATE PREPARE stmt_fk_mid_issue;

SET @has_fk_mid_rm := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'material_issue_details'
    AND constraint_name = 'fk_material_issue_details_raw_material_id'
);
SET @sql_fk_mid_rm := IF(
  @has_fk_mid_rm = 0,
  'ALTER TABLE `material_issue_details` ADD CONSTRAINT `fk_material_issue_details_raw_material_id` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_fk_mid_rm FROM @sql_fk_mid_rm;
EXECUTE stmt_fk_mid_rm;
DEALLOCATE PREPARE stmt_fk_mid_rm;

SET @has_fk_mid_unit := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'material_issue_details'
    AND constraint_name = 'fk_material_issue_details_unit_id'
);
SET @sql_fk_mid_unit := IF(
  @has_fk_mid_unit = 0,
  'ALTER TABLE `material_issue_details` ADD CONSTRAINT `fk_material_issue_details_unit_id` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_fk_mid_unit FROM @sql_fk_mid_unit;
EXECUTE stmt_fk_mid_unit;
DEALLOCATE PREPARE stmt_fk_mid_unit;
