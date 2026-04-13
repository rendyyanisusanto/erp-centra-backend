-- Ensure target table exists (legacy project uses salesmens)
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

-- If old table has data, copy to salesmens (ignore duplicates by code)
SET @has_old_table := (
  SELECT COUNT(1)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'salesmen'
);

SET @sql_copy := IF(
  @has_old_table = 1,
  'INSERT INTO `salesmens` (`code`,`name`,`phone`,`address`,`is_active`,`created_at`)
   SELECT s.`code`, s.`name`, s.`phone`, s.`address`, COALESCE(s.`is_active`,1), COALESCE(s.`created_at`, NOW())
   FROM `salesmen` s
   LEFT JOIN `salesmens` sm ON sm.`code` = s.`code`
   WHERE sm.`id` IS NULL',
  'SELECT 1'
);
PREPARE stmt_copy FROM @sql_copy;
EXECUTE stmt_copy;
DEALLOCATE PREPARE stmt_copy;

-- Ensure sales.salesman_id exists
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

-- Drop old FK if it exists (pointing to salesmen)
SET @has_fk := (
  SELECT COUNT(1)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'sales'
    AND constraint_name = 'fk_sales_salesman_id'
);
SET @sql_drop_fk := IF(@has_fk = 1, 'ALTER TABLE `sales` DROP FOREIGN KEY `fk_sales_salesman_id`', 'SELECT 1');
PREPARE stmt_drop_fk FROM @sql_drop_fk;
EXECUTE stmt_drop_fk;
DEALLOCATE PREPARE stmt_drop_fk;

-- Ensure index exists
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

-- Add FK to salesmens
ALTER TABLE `sales`
  ADD CONSTRAINT `fk_sales_salesman_id`
  FOREIGN KEY (`salesman_id`) REFERENCES `salesmens` (`id`)
  ON UPDATE CASCADE
  ON DELETE SET NULL;
