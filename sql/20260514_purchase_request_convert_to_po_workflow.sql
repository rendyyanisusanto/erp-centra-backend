-- Purchase Request -> Purchase conversion workflow
-- Safe/idempotent column additions + FK

SET @has_pr_process_status := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'purchase_requests'
    AND column_name = 'process_status'
);
SET @sql_pr_process_status := IF(
  @has_pr_process_status = 0,
  "ALTER TABLE `purchase_requests` ADD COLUMN `process_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER `status`",
  'SELECT 1'
);
PREPARE stmt_pr_process_status FROM @sql_pr_process_status; EXECUTE stmt_pr_process_status; DEALLOCATE PREPARE stmt_pr_process_status;

SET @has_prd_po_qty := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'purchase_request_details'
    AND column_name = 'po_qty'
);
SET @sql_prd_po_qty := IF(
  @has_prd_po_qty = 0,
  "ALTER TABLE `purchase_request_details` ADD COLUMN `po_qty` DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER `base_qty`",
  'SELECT 1'
);
PREPARE stmt_prd_po_qty FROM @sql_prd_po_qty; EXECUTE stmt_prd_po_qty; DEALLOCATE PREPARE stmt_prd_po_qty;

SET @has_prd_po_base_qty := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'purchase_request_details'
    AND column_name = 'po_base_qty'
);
SET @sql_prd_po_base_qty := IF(
  @has_prd_po_base_qty = 0,
  "ALTER TABLE `purchase_request_details` ADD COLUMN `po_base_qty` DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER `po_qty`",
  'SELECT 1'
);
PREPARE stmt_prd_po_base_qty FROM @sql_prd_po_base_qty; EXECUTE stmt_prd_po_base_qty; DEALLOCATE PREPARE stmt_prd_po_base_qty;

SET @has_pd_prd_id := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'purchase_details'
    AND column_name = 'purchase_request_detail_id'
);
SET @sql_pd_prd_id := IF(
  @has_pd_prd_id = 0,
  "ALTER TABLE `purchase_details` ADD COLUMN `purchase_request_detail_id` INT NULL AFTER `purchase_id`",
  'SELECT 1'
);
PREPARE stmt_pd_prd_id FROM @sql_pd_prd_id; EXECUTE stmt_pd_prd_id; DEALLOCATE PREPARE stmt_pd_prd_id;

UPDATE purchase_requests
SET process_status = COALESCE(process_status, 'PENDING')
WHERE id IS NOT NULL;

UPDATE purchase_request_details
SET po_qty = COALESCE(po_qty, 0),
    po_base_qty = COALESCE(po_base_qty, 0)
WHERE id IS NOT NULL;

SET @has_pd_prd_idx := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'purchase_details'
    AND index_name = 'idx_purchase_details_pr_detail'
);
SET @sql_pd_prd_idx := IF(
  @has_pd_prd_idx = 0,
  'CREATE INDEX `idx_purchase_details_pr_detail` ON `purchase_details` (`purchase_request_detail_id`)',
  'SELECT 1'
);
PREPARE stmt_pd_prd_idx FROM @sql_pd_prd_idx; EXECUTE stmt_pd_prd_idx; DEALLOCATE PREPARE stmt_pd_prd_idx;

SET @has_pd_prd_fk := (
  SELECT COUNT(1)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'purchase_details'
    AND constraint_name = 'fk_purchase_details_pr_detail'
);
SET @sql_pd_prd_fk := IF(
  @has_pd_prd_fk = 0,
  'ALTER TABLE `purchase_details` ADD CONSTRAINT `fk_purchase_details_pr_detail` FOREIGN KEY (`purchase_request_detail_id`) REFERENCES `purchase_request_details` (`id`) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_pd_prd_fk FROM @sql_pd_prd_fk; EXECUTE stmt_pd_prd_fk; DEALLOCATE PREPARE stmt_pd_prd_fk;
