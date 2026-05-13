-- Add document workflow fields and payment_status separation

-- purchases
SET @has_purchases_payment_status := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchases' AND column_name='payment_status');
SET @sql_purchases_payment_status := IF(@has_purchases_payment_status=0, 'ALTER TABLE `purchases` ADD COLUMN `payment_status` VARCHAR(20) NULL AFTER `status`', 'SELECT 1');
PREPARE stmt FROM @sql_purchases_payment_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_purchases_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchases' AND column_name='approved_by');
SET @sql_purchases_approved_by := IF(@has_purchases_approved_by=0, 'ALTER TABLE `purchases` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_purchases_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_purchases_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchases' AND column_name='approved_at');
SET @sql_purchases_approved_at := IF(@has_purchases_approved_at=0, 'ALTER TABLE `purchases` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_purchases_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_purchases_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchases' AND column_name='cancelled_by');
SET @sql_purchases_cancelled_by := IF(@has_purchases_cancelled_by=0, 'ALTER TABLE `purchases` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_purchases_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_purchases_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchases' AND column_name='cancelled_at');
SET @sql_purchases_cancelled_at := IF(@has_purchases_cancelled_at=0, 'ALTER TABLE `purchases` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_purchases_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_purchases_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchases' AND column_name='cancel_reason');
SET @sql_purchases_cancel_reason := IF(@has_purchases_cancel_reason=0, 'ALTER TABLE `purchases` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_purchases_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sales
SET @has_sales_payment_status := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sales' AND column_name='payment_status');
SET @sql_sales_payment_status := IF(@has_sales_payment_status=0, 'ALTER TABLE `sales` ADD COLUMN `payment_status` VARCHAR(20) NULL AFTER `status`', 'SELECT 1');
PREPARE stmt FROM @sql_sales_payment_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sales_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sales' AND column_name='approved_by');
SET @sql_sales_approved_by := IF(@has_sales_approved_by=0, 'ALTER TABLE `sales` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sales_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sales_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sales' AND column_name='approved_at');
SET @sql_sales_approved_at := IF(@has_sales_approved_at=0, 'ALTER TABLE `sales` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sales_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sales_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sales' AND column_name='cancelled_by');
SET @sql_sales_cancelled_by := IF(@has_sales_cancelled_by=0, 'ALTER TABLE `sales` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_sales_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sales_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sales' AND column_name='cancelled_at');
SET @sql_sales_cancelled_at := IF(@has_sales_cancelled_at=0, 'ALTER TABLE `sales` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sales_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sales_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sales' AND column_name='cancel_reason');
SET @sql_sales_cancel_reason := IF(@has_sales_cancel_reason=0, 'ALTER TABLE `sales` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_sales_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- purchase_requests
SET @has_pr_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_requests' AND column_name='approved_by');
SET @sql_pr_approved_by := IF(@has_pr_approved_by=0, 'ALTER TABLE `purchase_requests` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_pr_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pr_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_requests' AND column_name='approved_at');
SET @sql_pr_approved_at := IF(@has_pr_approved_at=0, 'ALTER TABLE `purchase_requests` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_pr_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pr_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_requests' AND column_name='cancelled_by');
SET @sql_pr_cancelled_by := IF(@has_pr_cancelled_by=0, 'ALTER TABLE `purchase_requests` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_pr_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pr_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_requests' AND column_name='cancelled_at');
SET @sql_pr_cancelled_at := IF(@has_pr_cancelled_at=0, 'ALTER TABLE `purchase_requests` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_pr_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pr_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_requests' AND column_name='cancel_reason');
SET @sql_pr_cancel_reason := IF(@has_pr_cancel_reason=0, 'ALTER TABLE `purchase_requests` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_pr_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- goods_receipts, purchase_payments, sale_payments, cash_transactions, stock_adjustments
SET @tbls := 'goods_receipts,purchase_payments,sale_payments,cash_transactions,stock_adjustments';

-- goods_receipts
SET @has_gr_status := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='goods_receipts' AND column_name='status');
SET @sql_gr_status := IF(@has_gr_status=0, 'ALTER TABLE `goods_receipts` ADD COLUMN `status` VARCHAR(20) NULL AFTER `total_amount`', 'SELECT 1');
PREPARE stmt FROM @sql_gr_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_gr_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='goods_receipts' AND column_name='approved_by');
SET @sql_gr_approved_by := IF(@has_gr_approved_by=0, 'ALTER TABLE `goods_receipts` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_gr_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_gr_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='goods_receipts' AND column_name='approved_at');
SET @sql_gr_approved_at := IF(@has_gr_approved_at=0, 'ALTER TABLE `goods_receipts` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_gr_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_gr_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='goods_receipts' AND column_name='cancelled_by');
SET @sql_gr_cancelled_by := IF(@has_gr_cancelled_by=0, 'ALTER TABLE `goods_receipts` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_gr_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_gr_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='goods_receipts' AND column_name='cancelled_at');
SET @sql_gr_cancelled_at := IF(@has_gr_cancelled_at=0, 'ALTER TABLE `goods_receipts` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_gr_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_gr_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='goods_receipts' AND column_name='cancel_reason');
SET @sql_gr_cancel_reason := IF(@has_gr_cancel_reason=0, 'ALTER TABLE `goods_receipts` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_gr_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- purchase_payments
SET @has_pp_status := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_payments' AND column_name='status');
SET @sql_pp_status := IF(@has_pp_status=0, 'ALTER TABLE `purchase_payments` ADD COLUMN `status` VARCHAR(20) NULL AFTER `note`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pp_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_payments' AND column_name='approved_by');
SET @sql_pp_approved_by := IF(@has_pp_approved_by=0, 'ALTER TABLE `purchase_payments` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pp_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_payments' AND column_name='approved_at');
SET @sql_pp_approved_at := IF(@has_pp_approved_at=0, 'ALTER TABLE `purchase_payments` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pp_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_payments' AND column_name='cancelled_by');
SET @sql_pp_cancelled_by := IF(@has_pp_cancelled_by=0, 'ALTER TABLE `purchase_payments` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pp_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_payments' AND column_name='cancelled_at');
SET @sql_pp_cancelled_at := IF(@has_pp_cancelled_at=0, 'ALTER TABLE `purchase_payments` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_pp_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='purchase_payments' AND column_name='cancel_reason');
SET @sql_pp_cancel_reason := IF(@has_pp_cancel_reason=0, 'ALTER TABLE `purchase_payments` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_pp_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sale_payments
SET @has_sp_status := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sale_payments' AND column_name='status');
SET @sql_sp_status := IF(@has_sp_status=0, 'ALTER TABLE `sale_payments` ADD COLUMN `status` VARCHAR(20) NULL AFTER `note`', 'SELECT 1');
PREPARE stmt FROM @sql_sp_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sp_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sale_payments' AND column_name='approved_by');
SET @sql_sp_approved_by := IF(@has_sp_approved_by=0, 'ALTER TABLE `sale_payments` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sp_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sp_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sale_payments' AND column_name='approved_at');
SET @sql_sp_approved_at := IF(@has_sp_approved_at=0, 'ALTER TABLE `sale_payments` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sp_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sp_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sale_payments' AND column_name='cancelled_by');
SET @sql_sp_cancelled_by := IF(@has_sp_cancelled_by=0, 'ALTER TABLE `sale_payments` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_sp_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sp_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sale_payments' AND column_name='cancelled_at');
SET @sql_sp_cancelled_at := IF(@has_sp_cancelled_at=0, 'ALTER TABLE `sale_payments` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sp_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sp_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='sale_payments' AND column_name='cancel_reason');
SET @sql_sp_cancel_reason := IF(@has_sp_cancel_reason=0, 'ALTER TABLE `sale_payments` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_sp_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- cash_transactions
SET @has_ct_status := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='cash_transactions' AND column_name='status');
SET @sql_ct_status := IF(@has_ct_status=0, 'ALTER TABLE `cash_transactions` ADD COLUMN `status` VARCHAR(20) NULL AFTER `amount`', 'SELECT 1');
PREPARE stmt FROM @sql_ct_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_ct_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='cash_transactions' AND column_name='approved_by');
SET @sql_ct_approved_by := IF(@has_ct_approved_by=0, 'ALTER TABLE `cash_transactions` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_ct_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_ct_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='cash_transactions' AND column_name='approved_at');
SET @sql_ct_approved_at := IF(@has_ct_approved_at=0, 'ALTER TABLE `cash_transactions` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_ct_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_ct_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='cash_transactions' AND column_name='cancelled_by');
SET @sql_ct_cancelled_by := IF(@has_ct_cancelled_by=0, 'ALTER TABLE `cash_transactions` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_ct_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_ct_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='cash_transactions' AND column_name='cancelled_at');
SET @sql_ct_cancelled_at := IF(@has_ct_cancelled_at=0, 'ALTER TABLE `cash_transactions` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_ct_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_ct_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='cash_transactions' AND column_name='cancel_reason');
SET @sql_ct_cancel_reason := IF(@has_ct_cancel_reason=0, 'ALTER TABLE `cash_transactions` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_ct_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stock_adjustments
SET @has_sa_status := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='stock_adjustments' AND column_name='status');
SET @sql_sa_status := IF(@has_sa_status=0, 'ALTER TABLE `stock_adjustments` ADD COLUMN `status` VARCHAR(20) NULL AFTER `date`', 'SELECT 1');
PREPARE stmt FROM @sql_sa_status; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sa_approved_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='stock_adjustments' AND column_name='approved_by');
SET @sql_sa_approved_by := IF(@has_sa_approved_by=0, 'ALTER TABLE `stock_adjustments` ADD COLUMN `approved_by` INT NULL AFTER `created_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sa_approved_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sa_approved_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='stock_adjustments' AND column_name='approved_at');
SET @sql_sa_approved_at := IF(@has_sa_approved_at=0, 'ALTER TABLE `stock_adjustments` ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sa_approved_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sa_cancelled_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='stock_adjustments' AND column_name='cancelled_by');
SET @sql_sa_cancelled_by := IF(@has_sa_cancelled_by=0, 'ALTER TABLE `stock_adjustments` ADD COLUMN `cancelled_by` INT NULL AFTER `approved_at`', 'SELECT 1');
PREPARE stmt FROM @sql_sa_cancelled_by; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sa_cancelled_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='stock_adjustments' AND column_name='cancelled_at');
SET @sql_sa_cancelled_at := IF(@has_sa_cancelled_at=0, 'ALTER TABLE `stock_adjustments` ADD COLUMN `cancelled_at` DATETIME NULL AFTER `cancelled_by`', 'SELECT 1');
PREPARE stmt FROM @sql_sa_cancelled_at; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_sa_cancel_reason := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name='stock_adjustments' AND column_name='cancel_reason');
SET @sql_sa_cancel_reason := IF(@has_sa_cancel_reason=0, 'ALTER TABLE `stock_adjustments` ADD COLUMN `cancel_reason` TEXT NULL AFTER `cancelled_at`', 'SELECT 1');
PREPARE stmt FROM @sql_sa_cancel_reason; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Normalize legacy status into document status + payment status
UPDATE purchases
SET
  payment_status = CASE
    WHEN status = 'PAID' THEN 'PAID'
    WHEN status = 'PARTIAL' THEN 'PARTIAL'
    WHEN status = 'OPEN' THEN 'UNPAID'
    WHEN payment_status IS NULL OR payment_status = '' THEN 'UNPAID'
    ELSE payment_status
  END,
  status = CASE
    WHEN status IN ('DRAFT', 'APPROVED', 'CANCELLED') THEN status
    ELSE 'APPROVED'
  END
WHERE id IS NOT NULL;

UPDATE sales
SET
  payment_status = CASE
    WHEN status = 'PAID' THEN 'PAID'
    WHEN status = 'PARTIAL' THEN 'PARTIAL'
    WHEN status = 'UNPAID' THEN 'UNPAID'
    WHEN payment_status IS NULL OR payment_status = '' THEN 'UNPAID'
    ELSE payment_status
  END,
  status = CASE
    WHEN status IN ('DRAFT', 'APPROVED', 'CANCELLED') THEN status
    ELSE 'APPROVED'
  END
WHERE id IS NOT NULL;

UPDATE purchase_requests
SET status = CASE WHEN status IN ('DRAFT', 'APPROVED', 'CANCELLED') THEN status ELSE 'DRAFT' END
WHERE id IS NOT NULL;

UPDATE goods_receipts SET status = COALESCE(status, 'APPROVED') WHERE id IS NOT NULL;
UPDATE purchase_payments SET status = COALESCE(status, 'APPROVED') WHERE id IS NOT NULL;
UPDATE sale_payments SET status = COALESCE(status, 'APPROVED') WHERE id IS NOT NULL;
UPDATE cash_transactions SET status = COALESCE(status, 'APPROVED') WHERE id IS NOT NULL;
UPDATE stock_adjustments SET status = COALESCE(status, 'APPROVED') WHERE id IS NOT NULL;
