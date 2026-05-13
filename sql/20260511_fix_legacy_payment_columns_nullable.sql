-- Compatibility fix for legacy single-document payment columns.
-- Multi-document payment no longer uses purchase_payments.purchase_id / sale_payments.sale_id.
-- If old schemas still have these columns as NOT NULL, inserts will fail.

-- purchase_payments.purchase_id -> NULL
SET @has_pp_purchase_id := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'purchase_payments'
    AND column_name = 'purchase_id'
);
SET @sql_pp_purchase_id := IF(
  @has_pp_purchase_id = 1,
  'ALTER TABLE `purchase_payments` MODIFY COLUMN `purchase_id` INT NULL',
  'SELECT 1'
);
PREPARE stmt_pp_purchase_id FROM @sql_pp_purchase_id; EXECUTE stmt_pp_purchase_id; DEALLOCATE PREPARE stmt_pp_purchase_id;

-- purchase_payments.amount -> NULL (legacy amount column)
SET @has_pp_amount := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'purchase_payments'
    AND column_name = 'amount'
);
SET @sql_pp_amount := IF(
  @has_pp_amount = 1,
  'ALTER TABLE `purchase_payments` MODIFY COLUMN `amount` DECIMAL(15,2) NULL',
  'SELECT 1'
);
PREPARE stmt_pp_amount FROM @sql_pp_amount; EXECUTE stmt_pp_amount; DEALLOCATE PREPARE stmt_pp_amount;

-- sale_payments.sale_id -> NULL
SET @has_sp_sale_id := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'sale_payments'
    AND column_name = 'sale_id'
);
SET @sql_sp_sale_id := IF(
  @has_sp_sale_id = 1,
  'ALTER TABLE `sale_payments` MODIFY COLUMN `sale_id` INT NULL',
  'SELECT 1'
);
PREPARE stmt_sp_sale_id FROM @sql_sp_sale_id; EXECUTE stmt_sp_sale_id; DEALLOCATE PREPARE stmt_sp_sale_id;

-- sale_payments.amount -> NULL (legacy amount column)
SET @has_sp_amount := (
  SELECT COUNT(1)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'sale_payments'
    AND column_name = 'amount'
);
SET @sql_sp_amount := IF(
  @has_sp_amount = 1,
  'ALTER TABLE `sale_payments` MODIFY COLUMN `amount` DECIMAL(15,2) NULL',
  'SELECT 1'
);
PREPARE stmt_sp_amount FROM @sql_sp_amount; EXECUTE stmt_sp_amount; DEALLOCATE PREPARE stmt_sp_amount;
