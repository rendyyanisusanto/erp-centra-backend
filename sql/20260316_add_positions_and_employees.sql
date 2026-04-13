CREATE TABLE IF NOT EXISTS `positions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_positions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `gender` VARCHAR(20) NULL,
  `phone` VARCHAR(255) NULL,
  `address` TEXT NULL,
  `position_id` INT NOT NULL,
  `basic_salary` DECIMAL(15,2) NULL,
  `status` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employees_employee_code` (`employee_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_idx_employee_code := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'employees'
    AND index_name = 'idx_employees_employee_code'
);
SET @sql_idx_employee_code := IF(
  @has_idx_employee_code = 0,
  'ALTER TABLE `employees` ADD INDEX `idx_employees_employee_code` (`employee_code`)',
  'SELECT 1'
);
PREPARE stmt_idx_employee_code FROM @sql_idx_employee_code;
EXECUTE stmt_idx_employee_code;
DEALLOCATE PREPARE stmt_idx_employee_code;

SET @has_idx_name := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'employees'
    AND index_name = 'idx_employees_name'
);
SET @sql_idx_name := IF(
  @has_idx_name = 0,
  'ALTER TABLE `employees` ADD INDEX `idx_employees_name` (`name`)',
  'SELECT 1'
);
PREPARE stmt_idx_name FROM @sql_idx_name;
EXECUTE stmt_idx_name;
DEALLOCATE PREPARE stmt_idx_name;

SET @has_idx_phone := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'employees'
    AND index_name = 'idx_employees_phone'
);
SET @sql_idx_phone := IF(
  @has_idx_phone = 0,
  'ALTER TABLE `employees` ADD INDEX `idx_employees_phone` (`phone`)',
  'SELECT 1'
);
PREPARE stmt_idx_phone FROM @sql_idx_phone;
EXECUTE stmt_idx_phone;
DEALLOCATE PREPARE stmt_idx_phone;

SET @has_idx_position_id := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'employees'
    AND index_name = 'idx_employees_position_id'
);
SET @sql_idx_position_id := IF(
  @has_idx_position_id = 0,
  'ALTER TABLE `employees` ADD INDEX `idx_employees_position_id` (`position_id`)',
  'SELECT 1'
);
PREPARE stmt_idx_position_id FROM @sql_idx_position_id;
EXECUTE stmt_idx_position_id;
DEALLOCATE PREPARE stmt_idx_position_id;

SET @has_idx_status := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'employees'
    AND index_name = 'idx_employees_status'
);
SET @sql_idx_status := IF(
  @has_idx_status = 0,
  'ALTER TABLE `employees` ADD INDEX `idx_employees_status` (`status`)',
  'SELECT 1'
);
PREPARE stmt_idx_status FROM @sql_idx_status;
EXECUTE stmt_idx_status;
DEALLOCATE PREPARE stmt_idx_status;

SET @has_fk := (
  SELECT COUNT(1)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'employees'
    AND constraint_name = 'fk_employees_position_id'
);
SET @sql_fk := IF(
  @has_fk = 0,
  'ALTER TABLE `employees` ADD CONSTRAINT `fk_employees_position_id` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;
