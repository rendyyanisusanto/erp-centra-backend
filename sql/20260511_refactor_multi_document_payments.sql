-- Purchase payments: add new header columns
SET @has_pp_payment_number := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_payments' AND column_name = 'payment_number');
SET @sql_pp_payment_number := IF(@has_pp_payment_number = 0, 'ALTER TABLE `purchase_payments` ADD COLUMN `payment_number` VARCHAR(255) NULL AFTER `id`', 'SELECT 1');
PREPARE stmt_pp_payment_number FROM @sql_pp_payment_number; EXECUTE stmt_pp_payment_number; DEALLOCATE PREPARE stmt_pp_payment_number;

SET @has_pp_supplier_id := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_payments' AND column_name = 'supplier_id');
SET @sql_pp_supplier_id := IF(@has_pp_supplier_id = 0, 'ALTER TABLE `purchase_payments` ADD COLUMN `supplier_id` INT NULL AFTER `payment_number`', 'SELECT 1');
PREPARE stmt_pp_supplier_id FROM @sql_pp_supplier_id; EXECUTE stmt_pp_supplier_id; DEALLOCATE PREPARE stmt_pp_supplier_id;

SET @has_pp_total_amount := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_payments' AND column_name = 'total_amount');
SET @sql_pp_total_amount := IF(@has_pp_total_amount = 0, 'ALTER TABLE `purchase_payments` ADD COLUMN `total_amount` DECIMAL(15,2) NULL AFTER `date`', 'SELECT 1');
PREPARE stmt_pp_total_amount FROM @sql_pp_total_amount; EXECUTE stmt_pp_total_amount; DEALLOCATE PREPARE stmt_pp_total_amount;

SET @has_pp_note := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_payments' AND column_name = 'note');
SET @sql_pp_note := IF(@has_pp_note = 0, 'ALTER TABLE `purchase_payments` ADD COLUMN `note` TEXT NULL AFTER `account_id`', 'SELECT 1');
PREPARE stmt_pp_note FROM @sql_pp_note; EXECUTE stmt_pp_note; DEALLOCATE PREPARE stmt_pp_note;

SET @has_pp_created_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_payments' AND column_name = 'created_by');
SET @sql_pp_created_by := IF(@has_pp_created_by = 0, 'ALTER TABLE `purchase_payments` ADD COLUMN `created_by` INT NULL AFTER `note`', 'SELECT 1');
PREPARE stmt_pp_created_by FROM @sql_pp_created_by; EXECUTE stmt_pp_created_by; DEALLOCATE PREPARE stmt_pp_created_by;

SET @has_pp_created_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'purchase_payments' AND column_name = 'created_at');
SET @sql_pp_created_at := IF(@has_pp_created_at = 0, 'ALTER TABLE `purchase_payments` ADD COLUMN `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created_by`', 'SELECT 1');
PREPARE stmt_pp_created_at FROM @sql_pp_created_at; EXECUTE stmt_pp_created_at; DEALLOCATE PREPARE stmt_pp_created_at;

-- Sale payments: add new header columns
SET @has_sp_payment_number := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sale_payments' AND column_name = 'payment_number');
SET @sql_sp_payment_number := IF(@has_sp_payment_number = 0, 'ALTER TABLE `sale_payments` ADD COLUMN `payment_number` VARCHAR(255) NULL AFTER `id`', 'SELECT 1');
PREPARE stmt_sp_payment_number FROM @sql_sp_payment_number; EXECUTE stmt_sp_payment_number; DEALLOCATE PREPARE stmt_sp_payment_number;

SET @has_sp_customer_id := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sale_payments' AND column_name = 'customer_id');
SET @sql_sp_customer_id := IF(@has_sp_customer_id = 0, 'ALTER TABLE `sale_payments` ADD COLUMN `customer_id` INT NULL AFTER `payment_number`', 'SELECT 1');
PREPARE stmt_sp_customer_id FROM @sql_sp_customer_id; EXECUTE stmt_sp_customer_id; DEALLOCATE PREPARE stmt_sp_customer_id;

SET @has_sp_total_amount := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sale_payments' AND column_name = 'total_amount');
SET @sql_sp_total_amount := IF(@has_sp_total_amount = 0, 'ALTER TABLE `sale_payments` ADD COLUMN `total_amount` DECIMAL(15,2) NULL AFTER `date`', 'SELECT 1');
PREPARE stmt_sp_total_amount FROM @sql_sp_total_amount; EXECUTE stmt_sp_total_amount; DEALLOCATE PREPARE stmt_sp_total_amount;

SET @has_sp_note := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sale_payments' AND column_name = 'note');
SET @sql_sp_note := IF(@has_sp_note = 0, 'ALTER TABLE `sale_payments` ADD COLUMN `note` TEXT NULL AFTER `account_id`', 'SELECT 1');
PREPARE stmt_sp_note FROM @sql_sp_note; EXECUTE stmt_sp_note; DEALLOCATE PREPARE stmt_sp_note;

SET @has_sp_created_by := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sale_payments' AND column_name = 'created_by');
SET @sql_sp_created_by := IF(@has_sp_created_by = 0, 'ALTER TABLE `sale_payments` ADD COLUMN `created_by` INT NULL AFTER `note`', 'SELECT 1');
PREPARE stmt_sp_created_by FROM @sql_sp_created_by; EXECUTE stmt_sp_created_by; DEALLOCATE PREPARE stmt_sp_created_by;

SET @has_sp_created_at := (SELECT COUNT(1) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sale_payments' AND column_name = 'created_at');
SET @sql_sp_created_at := IF(@has_sp_created_at = 0, 'ALTER TABLE `sale_payments` ADD COLUMN `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created_by`', 'SELECT 1');
PREPARE stmt_sp_created_at FROM @sql_sp_created_at; EXECUTE stmt_sp_created_at; DEALLOCATE PREPARE stmt_sp_created_at;

-- Detail tables
CREATE TABLE IF NOT EXISTS `purchase_payment_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `purchase_payment_id` INT NOT NULL,
  `purchase_id` INT NOT NULL,
  `amount_paid` DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sale_payment_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sale_payment_id` INT NOT NULL,
  `sale_id` INT NOT NULL,
  `amount_paid` DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Populate new header fields from old columns
UPDATE `purchase_payments` pp
LEFT JOIN `purchases` p ON p.id = pp.purchase_id
SET
  pp.supplier_id = COALESCE(pp.supplier_id, p.supplier_id),
  pp.total_amount = COALESCE(pp.total_amount, pp.amount),
  pp.payment_number = COALESCE(pp.payment_number, CONCAT('PP-', LPAD(pp.id, 6, '0'))),
  pp.created_at = COALESCE(pp.created_at, NOW())
WHERE pp.id IS NOT NULL;

UPDATE `sale_payments` sp
LEFT JOIN `sales` s ON s.id = sp.sale_id
SET
  sp.customer_id = COALESCE(sp.customer_id, s.customer_id),
  sp.total_amount = COALESCE(sp.total_amount, sp.amount),
  sp.payment_number = COALESCE(sp.payment_number, CONCAT('SP-', LPAD(sp.id, 6, '0'))),
  sp.created_at = COALESCE(sp.created_at, NOW())
WHERE sp.id IS NOT NULL;

-- Migrate old single-document payment rows into detail rows
INSERT INTO `purchase_payment_details` (`purchase_payment_id`, `purchase_id`, `amount_paid`)
SELECT pp.id, pp.purchase_id, pp.amount
FROM `purchase_payments` pp
LEFT JOIN `purchase_payment_details` ppd
  ON ppd.purchase_payment_id = pp.id
 AND ppd.purchase_id = pp.purchase_id
WHERE pp.purchase_id IS NOT NULL
  AND pp.amount IS NOT NULL
  AND ppd.id IS NULL;

INSERT INTO `sale_payment_details` (`sale_payment_id`, `sale_id`, `amount_paid`)
SELECT sp.id, sp.sale_id, sp.amount
FROM `sale_payments` sp
LEFT JOIN `sale_payment_details` spd
  ON spd.sale_payment_id = sp.id
 AND spd.sale_id = sp.sale_id
WHERE sp.sale_id IS NOT NULL
  AND sp.amount IS NOT NULL
  AND spd.id IS NULL;

-- Indexes
SET @has_idx_pp_supplier := (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_payments' AND index_name = 'idx_purchase_payments_supplier_id');
SET @sql_idx_pp_supplier := IF(@has_idx_pp_supplier = 0, 'ALTER TABLE `purchase_payments` ADD INDEX `idx_purchase_payments_supplier_id` (`supplier_id`)', 'SELECT 1');
PREPARE stmt_idx_pp_supplier FROM @sql_idx_pp_supplier; EXECUTE stmt_idx_pp_supplier; DEALLOCATE PREPARE stmt_idx_pp_supplier;

SET @has_idx_sp_customer := (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'sale_payments' AND index_name = 'idx_sale_payments_customer_id');
SET @sql_idx_sp_customer := IF(@has_idx_sp_customer = 0, 'ALTER TABLE `sale_payments` ADD INDEX `idx_sale_payments_customer_id` (`customer_id`)', 'SELECT 1');
PREPARE stmt_idx_sp_customer FROM @sql_idx_sp_customer; EXECUTE stmt_idx_sp_customer; DEALLOCATE PREPARE stmt_idx_sp_customer;

SET @has_idx_ppd_payment := (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_payment_details' AND index_name = 'idx_purchase_payment_details_payment_id');
SET @sql_idx_ppd_payment := IF(@has_idx_ppd_payment = 0, 'ALTER TABLE `purchase_payment_details` ADD INDEX `idx_purchase_payment_details_payment_id` (`purchase_payment_id`)', 'SELECT 1');
PREPARE stmt_idx_ppd_payment FROM @sql_idx_ppd_payment; EXECUTE stmt_idx_ppd_payment; DEALLOCATE PREPARE stmt_idx_ppd_payment;

SET @has_idx_ppd_purchase := (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'purchase_payment_details' AND index_name = 'idx_purchase_payment_details_purchase_id');
SET @sql_idx_ppd_purchase := IF(@has_idx_ppd_purchase = 0, 'ALTER TABLE `purchase_payment_details` ADD INDEX `idx_purchase_payment_details_purchase_id` (`purchase_id`)', 'SELECT 1');
PREPARE stmt_idx_ppd_purchase FROM @sql_idx_ppd_purchase; EXECUTE stmt_idx_ppd_purchase; DEALLOCATE PREPARE stmt_idx_ppd_purchase;

SET @has_idx_spd_payment := (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'sale_payment_details' AND index_name = 'idx_sale_payment_details_payment_id');
SET @sql_idx_spd_payment := IF(@has_idx_spd_payment = 0, 'ALTER TABLE `sale_payment_details` ADD INDEX `idx_sale_payment_details_payment_id` (`sale_payment_id`)', 'SELECT 1');
PREPARE stmt_idx_spd_payment FROM @sql_idx_spd_payment; EXECUTE stmt_idx_spd_payment; DEALLOCATE PREPARE stmt_idx_spd_payment;

SET @has_idx_spd_sale := (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'sale_payment_details' AND index_name = 'idx_sale_payment_details_sale_id');
SET @sql_idx_spd_sale := IF(@has_idx_spd_sale = 0, 'ALTER TABLE `sale_payment_details` ADD INDEX `idx_sale_payment_details_sale_id` (`sale_id`)', 'SELECT 1');
PREPARE stmt_idx_spd_sale FROM @sql_idx_spd_sale; EXECUTE stmt_idx_spd_sale; DEALLOCATE PREPARE stmt_idx_spd_sale;

-- Foreign keys
SET @has_fk_pp_supplier := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'purchase_payments' AND constraint_name = 'fk_purchase_payments_supplier_id');
SET @sql_fk_pp_supplier := IF(@has_fk_pp_supplier = 0, 'ALTER TABLE `purchase_payments` ADD CONSTRAINT `fk_purchase_payments_supplier_id` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt_fk_pp_supplier FROM @sql_fk_pp_supplier; EXECUTE stmt_fk_pp_supplier; DEALLOCATE PREPARE stmt_fk_pp_supplier;

SET @has_fk_pp_created_by := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'purchase_payments' AND constraint_name = 'fk_purchase_payments_created_by');
SET @sql_fk_pp_created_by := IF(@has_fk_pp_created_by = 0, 'ALTER TABLE `purchase_payments` ADD CONSTRAINT `fk_purchase_payments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_fk_pp_created_by FROM @sql_fk_pp_created_by; EXECUTE stmt_fk_pp_created_by; DEALLOCATE PREPARE stmt_fk_pp_created_by;

SET @has_fk_ppd_payment := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'purchase_payment_details' AND constraint_name = 'fk_purchase_payment_details_payment_id');
SET @sql_fk_ppd_payment := IF(@has_fk_ppd_payment = 0, 'ALTER TABLE `purchase_payment_details` ADD CONSTRAINT `fk_purchase_payment_details_payment_id` FOREIGN KEY (`purchase_payment_id`) REFERENCES `purchase_payments` (`id`) ON UPDATE CASCADE ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt_fk_ppd_payment FROM @sql_fk_ppd_payment; EXECUTE stmt_fk_ppd_payment; DEALLOCATE PREPARE stmt_fk_ppd_payment;

SET @has_fk_ppd_purchase := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'purchase_payment_details' AND constraint_name = 'fk_purchase_payment_details_purchase_id');
SET @sql_fk_ppd_purchase := IF(@has_fk_ppd_purchase = 0, 'ALTER TABLE `purchase_payment_details` ADD CONSTRAINT `fk_purchase_payment_details_purchase_id` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt_fk_ppd_purchase FROM @sql_fk_ppd_purchase; EXECUTE stmt_fk_ppd_purchase; DEALLOCATE PREPARE stmt_fk_ppd_purchase;

SET @has_fk_sp_customer := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'sale_payments' AND constraint_name = 'fk_sale_payments_customer_id');
SET @sql_fk_sp_customer := IF(@has_fk_sp_customer = 0, 'ALTER TABLE `sale_payments` ADD CONSTRAINT `fk_sale_payments_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt_fk_sp_customer FROM @sql_fk_sp_customer; EXECUTE stmt_fk_sp_customer; DEALLOCATE PREPARE stmt_fk_sp_customer;

SET @has_fk_sp_created_by := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'sale_payments' AND constraint_name = 'fk_sale_payments_created_by');
SET @sql_fk_sp_created_by := IF(@has_fk_sp_created_by = 0, 'ALTER TABLE `sale_payments` ADD CONSTRAINT `fk_sale_payments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_fk_sp_created_by FROM @sql_fk_sp_created_by; EXECUTE stmt_fk_sp_created_by; DEALLOCATE PREPARE stmt_fk_sp_created_by;

SET @has_fk_spd_payment := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'sale_payment_details' AND constraint_name = 'fk_sale_payment_details_payment_id');
SET @sql_fk_spd_payment := IF(@has_fk_spd_payment = 0, 'ALTER TABLE `sale_payment_details` ADD CONSTRAINT `fk_sale_payment_details_payment_id` FOREIGN KEY (`sale_payment_id`) REFERENCES `sale_payments` (`id`) ON UPDATE CASCADE ON DELETE CASCADE', 'SELECT 1');
PREPARE stmt_fk_spd_payment FROM @sql_fk_spd_payment; EXECUTE stmt_fk_spd_payment; DEALLOCATE PREPARE stmt_fk_spd_payment;

SET @has_fk_spd_sale := (SELECT COUNT(1) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = 'sale_payment_details' AND constraint_name = 'fk_sale_payment_details_sale_id');
SET @sql_fk_spd_sale := IF(@has_fk_spd_sale = 0, 'ALTER TABLE `sale_payment_details` ADD CONSTRAINT `fk_sale_payment_details_sale_id` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt_fk_spd_sale FROM @sql_fk_spd_sale; EXECUTE stmt_fk_spd_sale; DEALLOCATE PREPARE stmt_fk_spd_sale;
