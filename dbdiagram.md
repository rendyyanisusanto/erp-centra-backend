Table roles {
  id int [pk, increment]
  name varchar
  created_at datetime
}

Table users {
  id int [pk, increment]
  name varchar
  email varchar
  password varchar
  role_id int
  created_at datetime
}

Table permissions {
  id int [pk, increment]
  name varchar  // example: purchase.create
  module varchar
  created_at datetime
}

Table role_permissions {
  id int [pk, increment]
  role_id int
  permission_id int
}

Table positions {
  id int [pk, increment]
  code varchar
  name varchar
  description text
  created_at datetime
}

Table employees {
  id int [pk, increment]
  employee_code varchar
  name varchar
  gender varchar [null]
  phone varchar [null]
  address text [null]
  position_id int
  basic_salary decimal [null]
  status varchar   // ACTIVE, INACTIVE
  created_at datetime
}

Table suppliers {
  id int [pk, increment]
  name varchar
  phone varchar
  address text
  created_at datetime
}

Table customers {
  id int [pk, increment]
  name varchar
  phone varchar
  address text
  created_at datetime
}

Table units {
  id int [pk, increment]
  name varchar
}

Table products {
  id int [pk, increment]
  name varchar
  unit_id int
  stock decimal
  min_stock decimal
  created_at datetime
}

Table raw_materials {
  id int [pk, increment]
  name varchar
  unit_id int
  stock decimal
  min_stock decimal
  created_at datetime
}

Table stock_movements {
  id int [pk, increment]
  item_type varchar   // RAW_MATERIAL / PRODUCT
  item_id int
  transaction_date datetime
  reference_type varchar  // PURCHASE, SALES, STOCK_ADJUSTMENT, MATERIAL_ISSUE, FINISHED_GOODS_RECEIPT
  reference_id int
  qty_in decimal
  qty_out decimal
  note text
  created_at datetime
}

Table chart_of_accounts {
  id int [pk, increment]
  code varchar
  name varchar
  type varchar
}

Table journals {
  id int [pk, increment]
  date datetime
  description text
  reference_id int
  reference_type varchar
  created_by int
}

Table journal_details {
  id int [pk, increment]
  journal_id int
  account_id int
  debit decimal
  credit decimal
}

Table purchase_requests {
  id int [pk, increment]
  request_number varchar
  date datetime
  description text
  status varchar   // DRAFT, APPROVED, CANCELLED
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table purchase_request_details {
  id int [pk, increment]
  purchase_request_id int
  raw_material_id int
  qty decimal
  note text
}

Table purchases {
  id int [pk, increment]
  supplier_id int
  date datetime
  total_amount decimal
  purchase_request_id int [null]
  status varchar          // DRAFT, APPROVED, CANCELLED
  payment_status varchar  // UNPAID, PARTIAL, PAID
  description varchar
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table purchase_details {
  id int [pk, increment]
  purchase_id int
  item_type varchar
  item_id int
  qty decimal
  price decimal
  subtotal decimal
}

Table purchase_payments {
  id int [pk, increment]
  payment_number varchar
  supplier_id int
  date datetime
  total_amount decimal
  account_id int
  note text [null]
  status varchar   // DRAFT, APPROVED, CANCELLED
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table purchase_payment_details {
  id int [pk, increment]
  purchase_payment_id int
  purchase_id int
  amount_paid decimal
}

Table goods_receipts {
  id int [pk, increment]
  receipt_number varchar
  license_plate varchar
  purchase_id int
  date datetime
  total_amount decimal
  status varchar   // DRAFT, APPROVED, CANCELLED
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table goods_receipt_details {
  id int [pk, increment]
  goods_receipt_id int
  raw_material_id int
  qty_received decimal
  price decimal
  subtotal decimal
}

Table sales {
  id int [pk, increment]
  customer_id int
  date datetime
  total_amount decimal
  status varchar          // DRAFT, APPROVED, CANCELLED
  payment_status varchar  // UNPAID, PARTIAL, PAID
  description varchar
  license_plate varchar
  salesman_id int [null]
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table sale_details {
  id int [pk, increment]
  sale_id int
  product_id int
  qty decimal
  price decimal
  subtotal decimal
}

Table salesmens {
  id int [pk, increment]
  code varchar
  name varchar
  phone varchar
  address text
  is_active boolean
  created_at datetime
}

Table sale_payments {
  id int [pk, increment]
  payment_number varchar
  customer_id int
  date datetime
  total_amount decimal
  account_id int
  note text [null]
  status varchar   // DRAFT, APPROVED, CANCELLED
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table sale_payment_details {
  id int [pk, increment]
  sale_payment_id int
  sale_id int
  amount_paid decimal
}

Table cash_transactions {
  id int [pk, increment]
  date datetime
  type varchar
  description text
  amount decimal
  account_debit_id int
  account_credit_id int
  status varchar   // DRAFT, APPROVED, CANCELLED
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table stock_adjustments {
  id int [pk, increment]
  item_type varchar
  item_id int
  qty_system decimal
  qty_real decimal
  difference decimal
  date datetime
  status varchar   // DRAFT, APPROVED, CANCELLED
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table stock_adjustment_details {
  id int [pk, increment]
  stock_adjustment_id int
  item_type varchar   // RAW or PRODUCT
  item_id int
  qty_system decimal
  qty_real decimal
  difference decimal
}

Table material_issues {
  id int [pk, increment]
  issue_number varchar
  date datetime
  month int
  year int
  department varchar
  recipient_employee_id int
  status varchar   // DRAFT, APPROVED, CANCELLED
  description text [null]
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table material_issue_details {
  id int [pk, increment]
  material_issue_id int
  raw_material_id int
  qty decimal
  unit_id int
  note text [null]
}

Table production_plans {
  id int [pk, increment]
  plan_number varchar
  month int
  year int
  status varchar   // DRAFT, APPROVED, CANCELLED
  description text [null]
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table production_plan_details {
  id int [pk, increment]
  production_plan_id int
  production_code varchar
  production_date date
  product_id int
  planned_qty decimal
  realized_qty decimal [default: 0]
  note text [null]
}

Table finished_goods_receipts {
  id int [pk, increment]
  receipt_number varchar
  date datetime
  month int
  year int
  status varchar   // DRAFT, APPROVED, CANCELLED
  description text [null]
  created_by int
  approved_by int [null]
  approved_at datetime [null]
  cancelled_by int [null]
  cancelled_at datetime [null]
  cancel_reason text [null]
  created_at datetime
}

Table finished_goods_receipt_details {
  id int [pk, increment]
  finished_goods_receipt_id int
  production_plan_detail_id int [null]
  product_id int
  qty_received decimal
  note text [null]
}


// =======================
// REFERENCES
// =======================

Ref: users.role_id > roles.id

Ref: role_permissions.role_id > roles.id
Ref: role_permissions.permission_id > permissions.id

Ref: employees.position_id > positions.id

Ref: products.unit_id > units.id
Ref: raw_materials.unit_id > units.id

Ref: purchase_requests.created_by > users.id
Ref: purchase_requests.approved_by > users.id
Ref: purchase_requests.cancelled_by > users.id
Ref: purchase_request_details.purchase_request_id > purchase_requests.id
Ref: purchase_request_details.raw_material_id > raw_materials.id

Ref: purchases.purchase_request_id > purchase_requests.id
Ref: purchases.supplier_id > suppliers.id
Ref: purchases.created_by > users.id
Ref: purchases.approved_by > users.id
Ref: purchases.cancelled_by > users.id
Ref: purchase_details.purchase_id > purchases.id

Ref: purchase_payments.supplier_id > suppliers.id
Ref: purchase_payments.account_id > chart_of_accounts.id
Ref: purchase_payments.created_by > users.id
Ref: purchase_payments.approved_by > users.id
Ref: purchase_payments.cancelled_by > users.id
Ref: purchase_payment_details.purchase_payment_id > purchase_payments.id
Ref: purchase_payment_details.purchase_id > purchases.id

Ref: goods_receipts.purchase_id > purchases.id
Ref: goods_receipts.created_by > users.id
Ref: goods_receipts.approved_by > users.id
Ref: goods_receipts.cancelled_by > users.id
Ref: goods_receipt_details.goods_receipt_id > goods_receipts.id
Ref: goods_receipt_details.raw_material_id > raw_materials.id

Ref: sales.salesman_id > salesmens.id
Ref: sales.customer_id > customers.id
Ref: sales.created_by > users.id
Ref: sales.approved_by > users.id
Ref: sales.cancelled_by > users.id
Ref: sale_details.sale_id > sales.id
Ref: sale_details.product_id > products.id

Ref: sale_payments.customer_id > customers.id
Ref: sale_payments.account_id > chart_of_accounts.id
Ref: sale_payments.created_by > users.id
Ref: sale_payments.approved_by > users.id
Ref: sale_payments.cancelled_by > users.id
Ref: sale_payment_details.sale_payment_id > sale_payments.id
Ref: sale_payment_details.sale_id > sales.id

Ref: journals.created_by > users.id
Ref: journal_details.journal_id > journals.id
Ref: journal_details.account_id > chart_of_accounts.id

Ref: cash_transactions.account_debit_id > chart_of_accounts.id
Ref: cash_transactions.account_credit_id > chart_of_accounts.id
Ref: cash_transactions.created_by > users.id
Ref: cash_transactions.approved_by > users.id
Ref: cash_transactions.cancelled_by > users.id

Ref: stock_adjustments.created_by > users.id
Ref: stock_adjustments.approved_by > users.id
Ref: stock_adjustments.cancelled_by > users.id
Ref: stock_adjustment_details.stock_adjustment_id > stock_adjustments.id

Ref: material_issues.created_by > users.id
Ref: material_issues.approved_by > users.id
Ref: material_issues.cancelled_by > users.id
Ref: material_issues.recipient_employee_id > employees.id
Ref: material_issue_details.material_issue_id > material_issues.id
Ref: material_issue_details.raw_material_id > raw_materials.id
Ref: material_issue_details.unit_id > units.id

Ref: production_plans.created_by > users.id
Ref: production_plans.approved_by > users.id
Ref: production_plans.cancelled_by > users.id
Ref: production_plan_details.production_plan_id > production_plans.id
Ref: production_plan_details.product_id > products.id

Ref: finished_goods_receipts.created_by > users.id
Ref: finished_goods_receipts.approved_by > users.id
Ref: finished_goods_receipts.cancelled_by > users.id
Ref: finished_goods_receipt_details.finished_goods_receipt_id > finished_goods_receipts.id
Ref: finished_goods_receipt_details.production_plan_detail_id > production_plan_details.id
Ref: finished_goods_receipt_details.product_id > products.id