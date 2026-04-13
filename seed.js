require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./src/config/database');
require('./src/models'); // load all models + associations

const {
    Role, Permission, RolePermission, User, ChartOfAccount, Unit,
} = require('./src/models');

const seed = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: true }); // reset DB for seeding

        // Roles
        const adminRole = await Role.create({ name: 'Admin' });
        const staffRole = await Role.create({ name: 'Staff' });
        const managerRole = await Role.create({ name: 'Manager' });
        const accountantRole = await Role.create({ name: 'Accountant' });

        // Permissions
        const perms = [
            { name: 'role.read', module: 'master' },
            { name: 'role.create', module: 'master' },
            { name: 'user.read', module: 'master' },
            { name: 'user.create', module: 'master' },
            { name: 'unit.read', module: 'master' },
            { name: 'unit.create', module: 'master' },
            { name: 'product.read', module: 'master' },
            { name: 'product.create', module: 'master' },
            { name: 'raw-material.read', module: 'master' },
            { name: 'raw-material.create', module: 'master' },
            { name: 'supplier.read', module: 'master' },
            { name: 'supplier.create', module: 'master' },
            { name: 'customer.read', module: 'master' },
            { name: 'customer.create', module: 'master' },
            { name: 'salesman.read', module: 'master' },
            { name: 'salesman.create', module: 'master' },
            { name: 'position.read', module: 'master' },
            { name: 'position.create', module: 'master' },
            { name: 'employee.read', module: 'master' },
            { name: 'employee.create', module: 'master' },
            { name: 'coa.read', module: 'master' },
            { name: 'coa.create', module: 'master' },
            { name: 'purchase.read', module: 'purchase' },
            { name: 'purchase.create', module: 'purchase' },
            { name: 'purchase.approve', module: 'purchase' },
            { name: 'goods-receipt.read', module: 'purchase' },
            { name: 'goods-receipt.create', module: 'purchase' },
            { name: 'purchase-payment.read', module: 'purchase' },
            { name: 'purchase-payment.create', module: 'purchase' },
            { name: 'sales.read', module: 'sales' },
            { name: 'sales.create', module: 'sales' },
            { name: 'journal.read', module: 'finance' },
            { name: 'journal.create', module: 'finance' },
            { name: 'stock-adjustment.read', module: 'inventory' },
            { name: 'stock-adjustment.create', module: 'inventory' },
            { name: 'stock-movement.read', module: 'inventory' },
            { name: 'material-issue.read', module: 'material-issues' },
            { name: 'material-issue.create', module: 'material-issues' },
            { name: 'material-issue.approve', module: 'material-issues' },
            { name: 'production-plan.read', module: 'production-plans' },
            { name: 'production-plan.create', module: 'production-plans' },
            { name: 'production-plan.approve', module: 'production-plans' },
            { name: 'production-realization.read', module: 'production-realizations' },
            { name: 'production-realization.update', module: 'production-realizations' },
            { name: 'finished-goods-receipt.read', module: 'finished-goods-receipts' },
            { name: 'finished-goods-receipt.create', module: 'finished-goods-receipts' },
            { name: 'finished-goods-receipt.approve', module: 'finished-goods-receipts' },
            { name: 'report.profit-loss', module: 'reports' },
            { name: 'report.payables', module: 'reports' },
            { name: 'report.receivables', module: 'reports' },
            { name: 'report.ledger', module: 'reports' },
            { name: 'report.raw-material-stock-card', module: 'reports' },
            { name: 'report.stock-opname', module: 'reports' },
            { name: 'report.purchase-order-recap', module: 'reports' },
            { name: 'report.supplier-payable-statement', module: 'reports' },
            { name: 'report.stock-opname-product', module: 'reports' },
            { name: 'report.fg-monthly-stock', module: 'reports' },
            { name: 'report.material-issues', module: 'reports' },
            { name: 'report.production', module: 'reports' },
        ];
        const createdPerms = await Permission.bulkCreate(perms, { returning: true });

        // Admin gets all permissions
        const adminPermRows = createdPerms.map(p => ({ role_id: adminRole.id, permission_id: p.id }));
        await RolePermission.bulkCreate(adminPermRows);

        // Manager gets most permissions
        const managerPerms = createdPerms.filter(p => ![
            'role.create', 'user.create', 'unit.create', 'product.create', 'raw-material.create',
            'supplier.create', 'customer.create', 'salesman.create', 'position.create',
            'employee.create', 'coa.create',
        ].includes(p.name));
        await RolePermission.bulkCreate(managerPerms.map(p => ({ role_id: managerRole.id, permission_id: p.id })));

        // Staff: purchase + sales only
        const staffPerms = createdPerms.filter(p => [
            'purchase.read', 'purchase.create', 'goods-receipt.read', 'goods-receipt.create',
            'sales.read', 'sales.create',
            'raw-material.read', 'product.read', 'supplier.read', 'customer.read',
            'salesman.read', 'unit.read', 'coa.read',
        ].includes(p.name));
        await RolePermission.bulkCreate(staffPerms.map(p => ({ role_id: staffRole.id, permission_id: p.id })));

        // Accountant: finance + reports
        const accountantPerms = createdPerms.filter(p => [
            'journal.read', 'journal.create', 'purchase.read', 'sales.read',
            'purchase-payment.read', 'purchase-payment.create',
            'raw-material.read', 'product.read', 'supplier.read', 'customer.read',
            'salesman.read', 'unit.read', 'coa.read',
        ].includes(p.name) || p.name.startsWith('report.'));
        await RolePermission.bulkCreate(accountantPerms.map(p => ({ role_id: accountantRole.id, permission_id: p.id })));

        // Admin user
        const hashed = await bcrypt.hash('admin123', 12);
        await User.create({ name: 'Administrator', email: 'admin@centra.com', password: hashed, role_id: adminRole.id, is_active: true });
        await User.create({ name: 'Staff Pembelian', email: 'staff@centra.com', password: await bcrypt.hash('staff123', 12), role_id: staffRole.id, is_active: true });
        await User.create({ name: 'Akuntan', email: 'accountant@centra.com', password: await bcrypt.hash('accountant123', 12), role_id: accountantRole.id, is_active: true });

        // Units
        await Unit.bulkCreate([{ name: 'Kg' }, { name: 'Liter' }, { name: 'Pcs' }, { name: 'Box' }, { name: 'Ton' }, { name: 'Karung' }]);

        // Chart of Accounts (Standard Indonesian COA)
        await ChartOfAccount.bulkCreate([
            // ASSET
            { code: '1100', name: 'Kas', type: 'ASSET' },
            { code: '1110', name: 'Bank', type: 'ASSET' },
            { code: '1200', name: 'Piutang Usaha', type: 'ASSET' },
            { code: '1300', name: 'Persediaan Barang', type: 'ASSET' },
            { code: '1400', name: 'Persediaan Bahan Baku', type: 'ASSET' },
            { code: '1500', name: 'Aset Tetap', type: 'ASSET' },
            // LIABILITY
            { code: '2100', name: 'Hutang Usaha', type: 'LIABILITY' },
            { code: '2200', name: 'Hutang Bank', type: 'LIABILITY' },
            // EQUITY
            { code: '3100', name: 'Modal', type: 'EQUITY' },
            { code: '3200', name: 'Laba Ditahan', type: 'EQUITY' },
            // REVENUE
            { code: '4100', name: 'Pendapatan Penjualan', type: 'REVENUE' },
            { code: '4200', name: 'Pendapatan Lain-lain', type: 'REVENUE' },
            // EXPENSE
            { code: '5100', name: 'Harga Pokok Penjualan', type: 'EXPENSE' },
            { code: '5200', name: 'Biaya Operasional', type: 'EXPENSE' },
            { code: '5300', name: 'Biaya Gaji', type: 'EXPENSE' },
            { code: '5400', name: 'Biaya Listrik & Air', type: 'EXPENSE' },
            { code: '5500', name: 'Biaya Transportasi', type: 'EXPENSE' },
            { code: '5900', name: 'Biaya Lain-lain', type: 'EXPENSE' },
        ]);

        console.log('✅ Database seeded successfully.');
        console.log('  Admin:     admin@centra.com / admin123');
        console.log('  Staff:     staff@centra.com / staff123');
        console.log('  Accountant: accountant@centra.com / accountant123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message, err);
        process.exit(1);
    }
};

seed();
