-- add cancel audit columns for modules that already use DRAFT/APPROVED/CANCELLED

-- material_issues
SET @has_mi_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='material_issues' AND column_name='cancelled_by');
SET @sql_mi_cancelled_by := IF(@has_mi_cancelled_by=0, 'ALTER TABLE `material_issues` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_mi_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_mi_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='material_issues' AND column_name='cancelled_at');
SET @sql_mi_cancelled_at := IF(@has_mi_cancelled_at=0, 'ALTER TABLE `material_issues` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_mi_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_mi_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='material_issues' AND column_name='cancel_reason');
SET @sql_mi_cancel_reason := IF(@has_mi_cancel_reason=0, 'ALTER TABLE `material_issues` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_mi_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- production_plans
SET @has_pp_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='production_plans' AND column_name='cancelled_by');
SET @sql_pp_cancelled_by := IF(@has_pp_cancelled_by=0, 'ALTER TABLE `production_plans` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pp_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='production_plans' AND column_name='cancelled_at');
SET @sql_pp_cancelled_at := IF(@has_pp_cancelled_at=0, 'ALTER TABLE `production_plans` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pp_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='production_plans' AND column_name='cancel_reason');
SET @sql_pp_cancel_reason := IF(@has_pp_cancel_reason=0, 'ALTER TABLE `production_plans` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- finished_goods_receipts
SET @has_fgr_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='finished_goods_receipts' AND column_name='cancelled_by');
SET @sql_fgr_cancelled_by := IF(@has_fgr_cancelled_by=0, 'ALTER TABLE `finished_goods_receipts` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_fgr_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_fgr_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='finished_goods_receipts' AND column_name='cancelled_at');
SET @sql_fgr_cancelled_at := IF(@has_fgr_cancelled_at=0, 'ALTER TABLE `finished_goods_receipts` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_fgr_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_fgr_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='finished_goods_receipts' AND column_name='cancel_reason');
SET @sql_fgr_cancel_reason := IF(@has_fgr_cancel_reason=0, 'ALTER TABLE `finished_goods_receipts` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_fgr_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;
