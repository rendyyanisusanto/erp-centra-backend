SET @has_fk := (
  SELECT COUNT(1)
  FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'employees'
    AND constraint_name = 'fk_employees_position_id'
);
SET @sql_drop_fk := IF(
  @has_fk = 1,
  'ALTER TABLE `employees` DROP FOREIGN KEY `fk_employees_position_id`',
  'SELECT 1'
);
PREPARE stmt_drop_fk FROM @sql_drop_fk;
EXECUTE stmt_drop_fk;
DEALLOCATE PREPARE stmt_drop_fk;

DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `positions`;
