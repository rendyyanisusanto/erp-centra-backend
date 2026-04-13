ALTER TABLE `sales` DROP FOREIGN KEY `fk_sales_salesman_id`;
ALTER TABLE `sales` DROP INDEX `idx_sales_salesman_id`;
ALTER TABLE `sales` DROP COLUMN `salesman_id`;
DROP TABLE IF EXISTS `salesmens`;
