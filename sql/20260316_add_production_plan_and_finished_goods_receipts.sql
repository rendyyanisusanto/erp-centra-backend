CREATE TABLE IF NOT EXISTS `production_plans` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plan_number` VARCHAR(100) NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `description` TEXT NULL,
  `created_by` INT NOT NULL,
  `approved_by` INT NULL,
  `approved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_production_plans_plan_number` (`plan_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `production_plan_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `production_plan_id` INT NOT NULL,
  `production_code` VARCHAR(100) NOT NULL,
  `production_date` DATE NOT NULL,
  `product_id` INT NOT NULL,
  `planned_qty` DECIMAL(15,2) NOT NULL,
  `realized_qty` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `note` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finished_goods_receipts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `receipt_number` VARCHAR(100) NOT NULL,
  `date` DATETIME NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `description` TEXT NULL,
  `created_by` INT NOT NULL,
  `approved_by` INT NULL,
  `approved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_finished_goods_receipts_receipt_number` (`receipt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finished_goods_receipt_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `finished_goods_receipt_id` INT NOT NULL,
  `production_plan_detail_id` INT NULL,
  `product_id` INT NOT NULL,
  `qty_received` DECIMAL(15,2) NOT NULL,
  `note` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes production_plans
SET @has_idx_pp_status := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'production_plans' AND index_name = 'idx_production_plans_status'
);
SET @sql_idx_pp_status := IF(@has_idx_pp_status = 0, 'ALTER TABLE `production_plans` ADD INDEX `idx_production_plans_status` (`status`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_pp_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_pp_month_year := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'production_plans' AND index_name = 'idx_production_plans_month_year'
);
SET @sql_idx_pp_month_year := IF(@has_idx_pp_month_year = 0, 'ALTER TABLE `production_plans` ADD INDEX `idx_production_plans_month_year` (`month`,`year`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_pp_month_year; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Indexes production_plan_details
SET @has_idx_ppd_plan := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'production_plan_details' AND index_name = 'idx_production_plan_details_plan_id'
);
SET @sql_idx_ppd_plan := IF(@has_idx_ppd_plan = 0, 'ALTER TABLE `production_plan_details` ADD INDEX `idx_production_plan_details_plan_id` (`production_plan_id`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_ppd_plan; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_ppd_product := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'production_plan_details' AND index_name = 'idx_production_plan_details_product_id'
);
SET @sql_idx_ppd_product := IF(@has_idx_ppd_product = 0, 'ALTER TABLE `production_plan_details` ADD INDEX `idx_production_plan_details_product_id` (`product_id`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_ppd_product; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_ppd_code := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'production_plan_details' AND index_name = 'idx_production_plan_details_production_code'
);
SET @sql_idx_ppd_code := IF(@has_idx_ppd_code = 0, 'ALTER TABLE `production_plan_details` ADD INDEX `idx_production_plan_details_production_code` (`production_code`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_ppd_code; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_ppd_date := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'production_plan_details' AND index_name = 'idx_production_plan_details_production_date'
);
SET @sql_idx_ppd_date := IF(@has_idx_ppd_date = 0, 'ALTER TABLE `production_plan_details` ADD INDEX `idx_production_plan_details_production_date` (`production_date`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_ppd_date; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Indexes finished_goods_receipts
SET @has_idx_fgr_status := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'finished_goods_receipts' AND index_name = 'idx_finished_goods_receipts_status'
);
SET @sql_idx_fgr_status := IF(@has_idx_fgr_status = 0, 'ALTER TABLE `finished_goods_receipts` ADD INDEX `idx_finished_goods_receipts_status` (`status`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_fgr_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_fgr_month_year := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'finished_goods_receipts' AND index_name = 'idx_finished_goods_receipts_month_year'
);
SET @sql_idx_fgr_month_year := IF(@has_idx_fgr_month_year = 0, 'ALTER TABLE `finished_goods_receipts` ADD INDEX `idx_finished_goods_receipts_month_year` (`month`,`year`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_fgr_month_year; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_fgr_date := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'finished_goods_receipts' AND index_name = 'idx_finished_goods_receipts_date'
);
SET @sql_idx_fgr_date := IF(@has_idx_fgr_date = 0, 'ALTER TABLE `finished_goods_receipts` ADD INDEX `idx_finished_goods_receipts_date` (`date`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_fgr_date; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Indexes finished_goods_receipt_details
SET @has_idx_fgrd_receipt := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND index_name = 'idx_finished_goods_receipt_details_receipt_id'
);
SET @sql_idx_fgrd_receipt := IF(@has_idx_fgrd_receipt = 0, 'ALTER TABLE `finished_goods_receipt_details` ADD INDEX `idx_finished_goods_receipt_details_receipt_id` (`finished_goods_receipt_id`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_fgrd_receipt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_fgrd_ppd := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND index_name = 'idx_finished_goods_receipt_details_ppd_id'
);
SET @sql_idx_fgrd_ppd := IF(@has_idx_fgrd_ppd = 0, 'ALTER TABLE `finished_goods_receipt_details` ADD INDEX `idx_finished_goods_receipt_details_ppd_id` (`production_plan_detail_id`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_fgrd_ppd; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx_fgrd_product := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND index_name = 'idx_finished_goods_receipt_details_product_id'
);
SET @sql_idx_fgrd_product := IF(@has_idx_fgrd_product = 0, 'ALTER TABLE `finished_goods_receipt_details` ADD INDEX `idx_finished_goods_receipt_details_product_id` (`product_id`)', 'SELECT 1');
PREPARE stmt FROM @sql_idx_fgrd_product; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys production_plans
SET @has_fk_pp_created_by := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plans' AND constraint_name = 'fk_production_plans_created_by'
);
SET @sql_fk_pp_created_by := IF(@has_fk_pp_created_by = 0, 'ALTER TABLE `production_plans` ADD CONSTRAINT `fk_production_plans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql_fk_pp_created_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_pp_approved_by := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plans' AND constraint_name = 'fk_production_plans_approved_by'
);
SET @sql_fk_pp_approved_by := IF(@has_fk_pp_approved_by = 0, 'ALTER TABLE `production_plans` ADD CONSTRAINT `fk_production_plans_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql_fk_pp_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys production_plan_details
SET @has_fk_ppd_plan := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plan_details' AND constraint_name = 'fk_production_plan_details_plan_id'
);
SET @sql_fk_ppd_plan := IF(@has_fk_ppd_plan = 0, 'ALTER TABLE `production_plan_details` ADD CONSTRAINT `fk_production_plan_details_plan_id` FOREIGN KEY (`production_plan_id`) REFERENCES `production_plans` (`id`) ON UPDATE CASCADE ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql_fk_ppd_plan; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_ppd_product := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plan_details' AND constraint_name = 'fk_production_plan_details_product_id'
);
SET @sql_fk_ppd_product := IF(@has_fk_ppd_product = 0, 'ALTER TABLE `production_plan_details` ADD CONSTRAINT `fk_production_plan_details_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql_fk_ppd_product; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys finished_goods_receipts
SET @has_fk_fgr_created_by := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipts' AND constraint_name = 'fk_finished_goods_receipts_created_by'
);
SET @sql_fk_fgr_created_by := IF(@has_fk_fgr_created_by = 0, 'ALTER TABLE `finished_goods_receipts` ADD CONSTRAINT `fk_finished_goods_receipts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql_fk_fgr_created_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_fgr_approved_by := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipts' AND constraint_name = 'fk_finished_goods_receipts_approved_by'
);
SET @sql_fk_fgr_approved_by := IF(@has_fk_fgr_approved_by = 0, 'ALTER TABLE `finished_goods_receipts` ADD CONSTRAINT `fk_finished_goods_receipts_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql_fk_fgr_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys finished_goods_receipt_details
SET @has_fk_fgrd_receipt := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND constraint_name = 'fk_finished_goods_receipt_details_receipt_id'
);
SET @sql_fk_fgrd_receipt := IF(@has_fk_fgrd_receipt = 0, 'ALTER TABLE `finished_goods_receipt_details` ADD CONSTRAINT `fk_finished_goods_receipt_details_receipt_id` FOREIGN KEY (`finished_goods_receipt_id`) REFERENCES `finished_goods_receipts` (`id`) ON UPDATE CASCADE ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql_fk_fgrd_receipt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_fgrd_ppd := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND constraint_name = 'fk_finished_goods_receipt_details_ppd_id'
);
SET @sql_fk_fgrd_ppd := IF(@has_fk_fgrd_ppd = 0, 'ALTER TABLE `finished_goods_receipt_details` ADD CONSTRAINT `fk_finished_goods_receipt_details_ppd_id` FOREIGN KEY (`production_plan_detail_id`) REFERENCES `production_plan_details` (`id`) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql_fk_fgrd_ppd; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_fgrd_product := (
  SELECT COUNT(1)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND constraint_name = 'fk_finished_goods_receipt_details_product_id'
);
SET @sql_fk_fgrd_product := IF(@has_fk_fgrd_product = 0, 'ALTER TABLE `finished_goods_receipt_details` ADD CONSTRAINT `fk_finished_goods_receipt_details_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql_fk_fgrd_product; EXECUTE stmt; DEALLOCATE PREPARE stmt;
