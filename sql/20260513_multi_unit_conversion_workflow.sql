ALTER TABLE products
  CHANGE COLUMN unit_id base_unit_id INT NULL;

ALTER TABLE raw_materials
  CHANGE COLUMN unit_id base_unit_id INT NULL;

CREATE TABLE IF NOT EXISTS item_unit_conversions (
  id INT NOT NULL AUTO_INCREMENT,
  item_type VARCHAR(30) NOT NULL,
  item_id INT NOT NULL,
  unit_id INT NOT NULL,
  conversion_qty DECIMAL(15,2) NOT NULL,
  is_base TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_item_unit_conversions (item_type, item_id, unit_id),
  KEY idx_item_unit_conversions_item (item_type, item_id),
  KEY idx_item_unit_conversions_unit (unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE purchase_request_details
  ADD COLUMN unit_id INT NULL AFTER qty,
  ADD COLUMN conversion_qty DECIMAL(15,2) NOT NULL DEFAULT 1 AFTER unit_id,
  ADD COLUMN base_qty DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER conversion_qty;

UPDATE purchase_request_details SET base_qty = qty, conversion_qty = 1 WHERE base_qty = 0;

ALTER TABLE purchase_details
  ADD COLUMN unit_id INT NULL AFTER qty,
  ADD COLUMN conversion_qty DECIMAL(15,2) NOT NULL DEFAULT 1 AFTER unit_id,
  ADD COLUMN base_qty DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER conversion_qty;

UPDATE purchase_details SET base_qty = qty, conversion_qty = 1 WHERE base_qty = 0;

ALTER TABLE goods_receipt_details
  ADD COLUMN unit_id INT NULL AFTER qty_received,
  ADD COLUMN conversion_qty DECIMAL(15,2) NOT NULL DEFAULT 1 AFTER unit_id,
  ADD COLUMN base_qty_received DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER conversion_qty;

UPDATE goods_receipt_details SET base_qty_received = qty_received, conversion_qty = 1 WHERE base_qty_received = 0;

ALTER TABLE material_issue_details
  ADD COLUMN conversion_qty DECIMAL(15,2) NOT NULL DEFAULT 1 AFTER unit_id,
  ADD COLUMN base_qty DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER conversion_qty;

UPDATE material_issue_details SET base_qty = qty, conversion_qty = 1 WHERE base_qty = 0;

ALTER TABLE sale_details
  ADD COLUMN unit_id INT NULL AFTER qty,
  ADD COLUMN conversion_qty DECIMAL(15,2) NOT NULL DEFAULT 1 AFTER unit_id,
  ADD COLUMN base_qty DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER conversion_qty;

UPDATE sale_details SET base_qty = qty, conversion_qty = 1 WHERE base_qty = 0;

ALTER TABLE finished_goods_receipt_details
  ADD COLUMN unit_id INT NULL AFTER qty_received,
  ADD COLUMN conversion_qty DECIMAL(15,2) NOT NULL DEFAULT 1 AFTER unit_id,
  ADD COLUMN base_qty_received DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER conversion_qty;

UPDATE finished_goods_receipt_details SET base_qty_received = qty_received, conversion_qty = 1 WHERE base_qty_received = 0;

INSERT IGNORE INTO item_unit_conversions (item_type, item_id, unit_id, conversion_qty, is_base)
SELECT 'PRODUCT', p.id, p.base_unit_id, 1, 1
FROM products p
WHERE p.base_unit_id IS NOT NULL;

INSERT IGNORE INTO item_unit_conversions (item_type, item_id, unit_id, conversion_qty, is_base)
SELECT 'RAW_MATERIAL', r.id, r.base_unit_id, 1, 1
FROM raw_materials r
WHERE r.base_unit_id IS NOT NULL;

UPDATE purchase_request_details prd
JOIN raw_materials rm ON rm.id = prd.raw_material_id
SET prd.unit_id = IFNULL(prd.unit_id, rm.base_unit_id)
WHERE prd.unit_id IS NULL;

UPDATE purchase_details pd
LEFT JOIN raw_materials rm ON pd.item_type IN ('raw_material', 'RAW_MATERIAL') AND rm.id = pd.item_id
LEFT JOIN products p ON pd.item_type IN ('product', 'PRODUCT') AND p.id = pd.item_id
SET pd.unit_id = IFNULL(pd.unit_id, IFNULL(rm.base_unit_id, p.base_unit_id))
WHERE pd.unit_id IS NULL;

UPDATE goods_receipt_details grd
JOIN raw_materials rm ON rm.id = grd.raw_material_id
SET grd.unit_id = IFNULL(grd.unit_id, rm.base_unit_id)
WHERE grd.unit_id IS NULL;

UPDATE material_issue_details mid
JOIN raw_materials rm ON rm.id = mid.raw_material_id
SET mid.unit_id = IFNULL(mid.unit_id, rm.base_unit_id)
WHERE mid.unit_id IS NULL;

UPDATE sale_details sd
JOIN products p ON p.id = sd.product_id
SET sd.unit_id = IFNULL(sd.unit_id, p.base_unit_id)
WHERE sd.unit_id IS NULL;

UPDATE finished_goods_receipt_details fgrd
JOIN products p ON p.id = fgrd.product_id
SET fgrd.unit_id = IFNULL(fgrd.unit_id, p.base_unit_id)
WHERE fgrd.unit_id IS NULL;
