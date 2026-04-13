SET @has_fk_fgrd_product := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND constraint_name = 'fk_finished_goods_receipt_details_product_id'
);
SET @sql_drop_fk_fgrd_product := IF(@has_fk_fgrd_product = 1, 'ALTER TABLE `finished_goods_receipt_details` DROP FOREIGN KEY `fk_finished_goods_receipt_details_product_id`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_fgrd_product; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_fgrd_ppd := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND constraint_name = 'fk_finished_goods_receipt_details_ppd_id'
);
SET @sql_drop_fk_fgrd_ppd := IF(@has_fk_fgrd_ppd = 1, 'ALTER TABLE `finished_goods_receipt_details` DROP FOREIGN KEY `fk_finished_goods_receipt_details_ppd_id`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_fgrd_ppd; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_fgrd_receipt := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipt_details' AND constraint_name = 'fk_finished_goods_receipt_details_receipt_id'
);
SET @sql_drop_fk_fgrd_receipt := IF(@has_fk_fgrd_receipt = 1, 'ALTER TABLE `finished_goods_receipt_details` DROP FOREIGN KEY `fk_finished_goods_receipt_details_receipt_id`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_fgrd_receipt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_fgr_approved_by := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipts' AND constraint_name = 'fk_finished_goods_receipts_approved_by'
);
SET @sql_drop_fk_fgr_approved_by := IF(@has_fk_fgr_approved_by = 1, 'ALTER TABLE `finished_goods_receipts` DROP FOREIGN KEY `fk_finished_goods_receipts_approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_fgr_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_fgr_created_by := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'finished_goods_receipts' AND constraint_name = 'fk_finished_goods_receipts_created_by'
);
SET @sql_drop_fk_fgr_created_by := IF(@has_fk_fgr_created_by = 1, 'ALTER TABLE `finished_goods_receipts` DROP FOREIGN KEY `fk_finished_goods_receipts_created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_fgr_created_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_ppd_product := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plan_details' AND constraint_name = 'fk_production_plan_details_product_id'
);
SET @sql_drop_fk_ppd_product := IF(@has_fk_ppd_product = 1, 'ALTER TABLE `production_plan_details` DROP FOREIGN KEY `fk_production_plan_details_product_id`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_ppd_product; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_ppd_plan := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plan_details' AND constraint_name = 'fk_production_plan_details_plan_id'
);
SET @sql_drop_fk_ppd_plan := IF(@has_fk_ppd_plan = 1, 'ALTER TABLE `production_plan_details` DROP FOREIGN KEY `fk_production_plan_details_plan_id`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_ppd_plan; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_pp_approved_by := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plans' AND constraint_name = 'fk_production_plans_approved_by'
);
SET @sql_drop_fk_pp_approved_by := IF(@has_fk_pp_approved_by = 1, 'ALTER TABLE `production_plans` DROP FOREIGN KEY `fk_production_plans_approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_pp_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_pp_created_by := (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'production_plans' AND constraint_name = 'fk_production_plans_created_by'
);
SET @sql_drop_fk_pp_created_by := IF(@has_fk_pp_created_by = 1, 'ALTER TABLE `production_plans` DROP FOREIGN KEY `fk_production_plans_created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_fk_pp_created_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

DROP TABLE IF EXISTS `finished_goods_receipt_details`;
DROP TABLE IF EXISTS `finished_goods_receipts`;
DROP TABLE IF EXISTS `production_plan_details`;
DROP TABLE IF EXISTS `production_plans`;
