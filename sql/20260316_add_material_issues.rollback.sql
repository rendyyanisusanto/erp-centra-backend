SET @has_fk_mid_unit := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'material_issue_details' AND constraint_name = 'fk_material_issue_details_unit_id'
);
SET @sql_drop_fk_mid_unit := IF(@has_fk_mid_unit = 1, 'ALTER TABLE `material_issue_details` DROP FOREIGN KEY `fk_material_issue_details_unit_id`', 'SELECT 1');
PREPARE stmt_drop_fk_mid_unit FROM @sql_drop_fk_mid_unit;
EXECUTE stmt_drop_fk_mid_unit;
DEALLOCATE PREPARE stmt_drop_fk_mid_unit;

SET @has_fk_mid_rm := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'material_issue_details' AND constraint_name = 'fk_material_issue_details_raw_material_id'
);
SET @sql_drop_fk_mid_rm := IF(@has_fk_mid_rm = 1, 'ALTER TABLE `material_issue_details` DROP FOREIGN KEY `fk_material_issue_details_raw_material_id`', 'SELECT 1');
PREPARE stmt_drop_fk_mid_rm FROM @sql_drop_fk_mid_rm;
EXECUTE stmt_drop_fk_mid_rm;
DEALLOCATE PREPARE stmt_drop_fk_mid_rm;

SET @has_fk_mid_issue := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'material_issue_details' AND constraint_name = 'fk_material_issue_details_material_issue_id'
);
SET @sql_drop_fk_mid_issue := IF(@has_fk_mid_issue = 1, 'ALTER TABLE `material_issue_details` DROP FOREIGN KEY `fk_material_issue_details_material_issue_id`', 'SELECT 1');
PREPARE stmt_drop_fk_mid_issue FROM @sql_drop_fk_mid_issue;
EXECUTE stmt_drop_fk_mid_issue;
DEALLOCATE PREPARE stmt_drop_fk_mid_issue;

SET @has_fk_issue_recipient := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'material_issues' AND constraint_name = 'fk_material_issues_recipient_employee_id'
);
SET @sql_drop_fk_issue_recipient := IF(@has_fk_issue_recipient = 1, 'ALTER TABLE `material_issues` DROP FOREIGN KEY `fk_material_issues_recipient_employee_id`', 'SELECT 1');
PREPARE stmt_drop_fk_issue_recipient FROM @sql_drop_fk_issue_recipient;
EXECUTE stmt_drop_fk_issue_recipient;
DEALLOCATE PREPARE stmt_drop_fk_issue_recipient;

SET @has_fk_issue_approved_by := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'material_issues' AND constraint_name = 'fk_material_issues_approved_by'
);
SET @sql_drop_fk_issue_approved_by := IF(@has_fk_issue_approved_by = 1, 'ALTER TABLE `material_issues` DROP FOREIGN KEY `fk_material_issues_approved_by`', 'SELECT 1');
PREPARE stmt_drop_fk_issue_approved_by FROM @sql_drop_fk_issue_approved_by;
EXECUTE stmt_drop_fk_issue_approved_by;
DEALLOCATE PREPARE stmt_drop_fk_issue_approved_by;

SET @has_fk_issue_created_by := (
  SELECT COUNT(1) FROM information_schema.referential_constraints
  WHERE constraint_schema = DATABASE() AND table_name = 'material_issues' AND constraint_name = 'fk_material_issues_created_by'
);
SET @sql_drop_fk_issue_created_by := IF(@has_fk_issue_created_by = 1, 'ALTER TABLE `material_issues` DROP FOREIGN KEY `fk_material_issues_created_by`', 'SELECT 1');
PREPARE stmt_drop_fk_issue_created_by FROM @sql_drop_fk_issue_created_by;
EXECUTE stmt_drop_fk_issue_created_by;
DEALLOCATE PREPARE stmt_drop_fk_issue_created_by;

DROP TABLE IF EXISTS `material_issue_details`;
DROP TABLE IF EXISTS `material_issues`;
