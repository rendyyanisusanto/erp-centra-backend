const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const User = require('./User');
const Unit = require('./Unit');
const Product = require('./Product');
const RawMaterial = require('./RawMaterial');
const ItemUnitConversion = require('./ItemUnitConversion');
const Supplier = require('./Supplier');
const Customer = require('./Customer');
const Salesman = require('./Salesman');
const Position = require('./Position');
const Employee = require('./Employee');
const { ProductionPlan, ProductionPlanDetail } = require('./ProductionPlan');
const { FinishedGoodsReceipt, FinishedGoodsReceiptDetail } = require('./FinishedGoodsReceipt');
const ChartOfAccount = require('./ChartOfAccount');
const { MaterialIssue, MaterialIssueDetail } = require('./MaterialIssue');
const { Journal, JournalDetail } = require('./Journal');
const { PurchaseRequest, PurchaseRequestDetail } = require('./PurchaseRequest');
const { Purchase, PurchaseDetail, PurchasePayment, PurchasePaymentDetail } = require('./Purchase');
const { GoodsReceipt, GoodsReceiptDetail } = require('./GoodsReceipt');
const { Sale, SaleDetail, SalePayment, SalePaymentDetail } = require('./Sale');
const CashTransaction = require('./CashTransaction');
const StockAdjustment = require('./StockAdjustment');
const StockAdjustmentDetail = require('./StockAdjustmentDetail');
const StockMovement = require('./StockMovement');

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

Product.belongsTo(Unit, { foreignKey: 'base_unit_id', as: 'unit' });
RawMaterial.belongsTo(Unit, { foreignKey: 'base_unit_id', as: 'unit' });

ItemUnitConversion.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
PurchaseRequestDetail.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
PurchaseDetail.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
GoodsReceiptDetail.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
SaleDetail.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
FinishedGoodsReceiptDetail.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });

PurchaseRequestDetail.belongsTo(PurchaseRequest, { foreignKey: 'purchase_request_id' });
PurchaseRequest.hasMany(PurchaseRequestDetail, { foreignKey: 'purchase_request_id', as: 'details' });
PurchaseRequestDetail.belongsTo(RawMaterial, { foreignKey: 'raw_material_id', as: 'rawMaterial' });
PurchaseRequest.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Purchase.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Purchase.belongsTo(PurchaseRequest, { foreignKey: 'purchase_request_id', as: 'purchaseRequest' });
PurchaseDetail.belongsTo(Purchase, { foreignKey: 'purchase_id' });
Purchase.hasMany(PurchaseDetail, { foreignKey: 'purchase_id', as: 'details' });
PurchaseDetail.belongsTo(PurchaseRequestDetail, { foreignKey: 'purchase_request_detail_id', as: 'purchaseRequestDetail' });
PurchaseDetail.belongsTo(RawMaterial, { foreignKey: 'item_id', as: 'rawMaterial' });
PurchaseDetail.belongsTo(Product, { foreignKey: 'item_id', as: 'product' });
PurchasePayment.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
PurchasePayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchasePayment.belongsTo(ChartOfAccount, { foreignKey: 'account_id', as: 'account' });
PurchasePayment.hasMany(PurchasePaymentDetail, { foreignKey: 'purchase_payment_id', as: 'details' });
PurchasePaymentDetail.belongsTo(PurchasePayment, { foreignKey: 'purchase_payment_id', as: 'payment' });
PurchasePaymentDetail.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
Purchase.hasMany(PurchasePaymentDetail, { foreignKey: 'purchase_id', as: 'paymentDetails' });

GoodsReceipt.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
Purchase.hasMany(GoodsReceipt, { foreignKey: 'purchase_id', as: 'receipts' });
GoodsReceipt.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
GoodsReceiptDetail.belongsTo(GoodsReceipt, { foreignKey: 'goods_receipt_id' });
GoodsReceipt.hasMany(GoodsReceiptDetail, { foreignKey: 'goods_receipt_id', as: 'details' });
GoodsReceiptDetail.belongsTo(RawMaterial, { foreignKey: 'raw_material_id', as: 'rawMaterial' });

Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Sale.belongsTo(Salesman, { foreignKey: 'salesman_id', as: 'salesman' });
Sale.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Salesman.hasMany(Sale, { foreignKey: 'salesman_id', as: 'sales' });
Employee.belongsTo(Position, { foreignKey: 'position_id', as: 'position' });
Position.hasMany(Employee, { foreignKey: 'position_id', as: 'employees' });
SaleDetail.belongsTo(Sale, { foreignKey: 'sale_id' });
Sale.hasMany(SaleDetail, { foreignKey: 'sale_id', as: 'details' });
SaleDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
SalePayment.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
SalePayment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SalePayment.belongsTo(ChartOfAccount, { foreignKey: 'account_id', as: 'account' });
SalePayment.hasMany(SalePaymentDetail, { foreignKey: 'sale_payment_id', as: 'details' });
SalePaymentDetail.belongsTo(SalePayment, { foreignKey: 'sale_payment_id', as: 'payment' });
SalePaymentDetail.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
Sale.hasMany(SalePaymentDetail, { foreignKey: 'sale_id', as: 'paymentDetails' });

Journal.hasMany(JournalDetail, { foreignKey: 'journal_id', as: 'details' });
JournalDetail.belongsTo(Journal, { foreignKey: 'journal_id' });
JournalDetail.belongsTo(ChartOfAccount, { foreignKey: 'account_id', as: 'account' });
Journal.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

CashTransaction.belongsTo(ChartOfAccount, { foreignKey: 'account_debit_id', as: 'debitAccount' });
CashTransaction.belongsTo(ChartOfAccount, { foreignKey: 'account_credit_id', as: 'creditAccount' });
CashTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

StockAdjustment.hasMany(StockAdjustmentDetail, { foreignKey: 'stock_adjustment_id', as: 'details' });
StockAdjustmentDetail.belongsTo(StockAdjustment, { foreignKey: 'stock_adjustment_id' });
StockAdjustment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
StockAdjustmentDetail.belongsTo(RawMaterial, { foreignKey: 'item_id', as: 'rawMaterial' });
StockAdjustmentDetail.belongsTo(Product, { foreignKey: 'item_id', as: 'product' });

MaterialIssue.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
MaterialIssue.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
MaterialIssue.belongsTo(Employee, { foreignKey: 'recipient_employee_id', as: 'recipientEmployee' });
Employee.hasMany(MaterialIssue, { foreignKey: 'recipient_employee_id', as: 'materialIssues' });
MaterialIssue.hasMany(MaterialIssueDetail, { foreignKey: 'material_issue_id', as: 'details' });
MaterialIssueDetail.belongsTo(MaterialIssue, { foreignKey: 'material_issue_id' });
MaterialIssueDetail.belongsTo(RawMaterial, { foreignKey: 'raw_material_id', as: 'rawMaterial' });
MaterialIssueDetail.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });

ProductionPlan.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
ProductionPlan.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
ProductionPlan.hasMany(ProductionPlanDetail, { foreignKey: 'production_plan_id', as: 'details' });
ProductionPlanDetail.belongsTo(ProductionPlan, { foreignKey: 'production_plan_id', as: 'plan' });
ProductionPlanDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

FinishedGoodsReceipt.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
FinishedGoodsReceipt.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
FinishedGoodsReceipt.hasMany(FinishedGoodsReceiptDetail, { foreignKey: 'finished_goods_receipt_id', as: 'details' });
FinishedGoodsReceiptDetail.belongsTo(FinishedGoodsReceipt, { foreignKey: 'finished_goods_receipt_id', as: 'receipt' });
FinishedGoodsReceiptDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
FinishedGoodsReceiptDetail.belongsTo(ProductionPlanDetail, { foreignKey: 'production_plan_detail_id', as: 'productionPlanDetail' });

module.exports = {
    Role, Permission, RolePermission, User,
    Unit, Product, RawMaterial, ItemUnitConversion, Supplier, Customer, Salesman, Position, Employee, ChartOfAccount,
    Journal, JournalDetail,
    PurchaseRequest, PurchaseRequestDetail,
    Purchase, PurchaseDetail, PurchasePayment, PurchasePaymentDetail,
    GoodsReceipt, GoodsReceiptDetail,
    Sale, SaleDetail, SalePayment, SalePaymentDetail,
    CashTransaction, StockAdjustment, StockAdjustmentDetail,
    StockMovement,
    MaterialIssue, MaterialIssueDetail,
    ProductionPlan, ProductionPlanDetail,
    FinishedGoodsReceipt, FinishedGoodsReceiptDetail,
};
