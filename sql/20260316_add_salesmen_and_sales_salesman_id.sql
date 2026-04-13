-- Add Salesman master table
CREATE TABLE IF NOT EXISTS `salesmens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NULL,
  `address` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_salesmens_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add nullable salesman_id to existing sales table (idempotent, compatible)
SET @has_col := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'sales'
    AND column_name = 'salesman_id'
);
SET @sql_col := IF(
  @has_col = 0,
  'ALTER TABLE `sales` ADD COLUMN `salesman_id` INT NULL AFTER `description`',
  'SELECT 1'
);
PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- Add index only if missing
SET @has_idx := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'sales'
    AND index_name = 'idx_sales_salesman_id'
);
SET @sql_idx := IF(@has_idx = 0, 'ALTER TABLE `sales` ADD INDEX `idx_sales_salesman_id` (`salesman_id`)', 'SELECT 1');
PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- Add FK only if missing
SET @has_fk := (
  SELECT COUNT(1)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'sales'
    AND constraint_name = 'fk_sales_salesman_id'
);
SET @sql_fk := IF(
  @has_fk = 0,
  'ALTER TABLE `sales` ADD CONSTRAINT `fk_sales_salesman_id` FOREIGN KEY (`salesman_id`) REFERENCES `salesmens` (`id`) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;
