const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const User = require('./User');
const Unit = require('./Unit');
const Product = require('./Product');
const RawMaterial = require('./RawMaterial');
const Supplier = require('./Supplier');
const Customer = require('./Customer');
const ChartOfAccount = require('./ChartOfAccount');
const { Journal, JournalDetail } = require('./Journal');
const { PurchaseRequest, PurchaseRequestDetail } = require('./PurchaseRequest');
const { Purchase, PurchaseDetail, PurchasePayment } = require('./Purchase');
const { GoodsReceipt, GoodsReceiptDetail } = require('./GoodsReceipt');
const { Sale, SaleDetail, SalePayment } = require('./Sale');
const CashTransaction = require('./CashTransaction');
const StockAdjustment = require('./StockAdjustment');
const StockAdjustmentDetail = require('./StockAdjustmentDetail');
const StockMovement = require('./StockMovement');

// User - Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id' });

// Role - Permission (M:M via role_permissions)
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

// Unit associations
Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
RawMaterial.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });

// Purchase Request
PurchaseRequestDetail.belongsTo(PurchaseRequest, { foreignKey: 'purchase_request_id' });
PurchaseRequest.hasMany(PurchaseRequestDetail, { foreignKey: 'purchase_request_id', as: 'details' });
PurchaseRequestDetail.belongsTo(RawMaterial, { foreignKey: 'raw_material_id', as: 'rawMaterial' });
PurchaseRequest.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Purchase
Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Purchase.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Purchase.belongsTo(PurchaseRequest, { foreignKey: 'purchase_request_id', as: 'purchaseRequest' });
PurchaseDetail.belongsTo(Purchase, { foreignKey: 'purchase_id' });
Purchase.hasMany(PurchaseDetail, { foreignKey: 'purchase_id', as: 'details' });
PurchaseDetail.belongsTo(RawMaterial, { foreignKey: 'item_id', as: 'rawMaterial' });
PurchaseDetail.belongsTo(Product, { foreignKey: 'item_id', as: 'product' });
PurchasePayment.belongsTo(Purchase, { foreignKey: 'purchase_id' });
Purchase.hasMany(PurchasePayment, { foreignKey: 'purchase_id', as: 'payments' });
PurchasePayment.belongsTo(ChartOfAccount, { foreignKey: 'account_id', as: 'account' });

// Goods Receipt
GoodsReceipt.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
Purchase.hasMany(GoodsReceipt, { foreignKey: 'purchase_id', as: 'receipts' });
GoodsReceipt.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
GoodsReceiptDetail.belongsTo(GoodsReceipt, { foreignKey: 'goods_receipt_id' });
GoodsReceipt.hasMany(GoodsReceiptDetail, { foreignKey: 'goods_receipt_id', as: 'details' });
GoodsReceiptDetail.belongsTo(RawMaterial, { foreignKey: 'raw_material_id', as: 'rawMaterial' });

// Sales
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Sale.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SaleDetail.belongsTo(Sale, { foreignKey: 'sale_id' });
Sale.hasMany(SaleDetail, { foreignKey: 'sale_id', as: 'details' });
SaleDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
SalePayment.belongsTo(Sale, { foreignKey: 'sale_id' });
Sale.hasMany(SalePayment, { foreignKey: 'sale_id', as: 'payments' });
SalePayment.belongsTo(ChartOfAccount, { foreignKey: 'account_id', as: 'account' });

// Journal
Journal.hasMany(JournalDetail, { foreignKey: 'journal_id', as: 'details' });
JournalDetail.belongsTo(Journal, { foreignKey: 'journal_id' });
JournalDetail.belongsTo(ChartOfAccount, { foreignKey: 'account_id', as: 'account' });
Journal.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Cash Transaction
CashTransaction.belongsTo(ChartOfAccount, { foreignKey: 'account_debit_id', as: 'debitAccount' });
CashTransaction.belongsTo(ChartOfAccount, { foreignKey: 'account_credit_id', as: 'creditAccount' });
CashTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Stock Adjustment
StockAdjustment.hasMany(StockAdjustmentDetail, { foreignKey: 'stock_adjustment_id', as: 'details' });
StockAdjustmentDetail.belongsTo(StockAdjustment, { foreignKey: 'stock_adjustment_id' });
StockAdjustment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
    Role, Permission, RolePermission, User,
    Unit, Product, RawMaterial, Supplier, Customer, ChartOfAccount,
    Journal, JournalDetail,
    PurchaseRequest, PurchaseRequestDetail,
    Purchase, PurchaseDetail, PurchasePayment,
    GoodsReceipt, GoodsReceiptDetail,
    Sale, SaleDetail, SalePayment,
    CashTransaction, StockAdjustment, StockAdjustmentDetail,
    StockMovement,
};
