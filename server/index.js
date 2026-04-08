const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5032;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        version: '2.0.3-fixed',
        timestamp: new Date(),
        database: process.env.DB_NAME
    });
});

// Request Logger
app.use((req, res, next) => {
    const logMsg = `[REQ-DEBUG] ${new Date().toISOString()} ${req.method} ${req.url}\n`;
    console.log(logMsg.trim());
    require('fs').appendFileSync('requests.log', logMsg);
    next();
});

app.use('/uploads', express.static('uploads'));

// Setup purchases (Call this once)
app.get('/setup-purchases-root', async (req, res) => {
    const db = require('./config/db');
    try {
        const [modRes] = await db.execute("SELECT module_id FROM module_master WHERE module_name = 'Vehicle'");
        if (!modRes.length) return res.status(404).json({ success: false, message: 'Vehicle module not found' });
        const moduleId = modRes[0].module_id;
        let [sectionRes] = await db.execute("SELECT id FROM module_sections WHERE module_id = ? AND name = 'Vehicle Purchases'", [moduleId]);
        let sectionId;
        if (sectionRes.length === 0) {
            const [insertSecRes] = await db.execute("INSERT INTO module_sections (company_id, module_id, name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW()) RETURNING id", [1, moduleId, 'Vehicle Purchases', 6]);
            sectionId = insertSecRes.insertId;
        } else { sectionId = sectionRes[0].id; }
        const fields = [
            { key: 'purchase_ref_no', label: 'Purchase Reference No', type: 'text' },
            { key: 'vendor_name', label: 'Vendor', type: 'text' },
            { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
            { key: 'invoice_no', label: 'Invoice No', type: 'text' },
            { key: 'base_amount', label: 'Base Amount', type: 'number' },
            { key: 'vat_amount', label: 'VAT Amount', type: 'number' },
            { key: 'registration_amount', label: 'Registration Amount', type: 'number' },
            { key: 'insurance_amount', label: 'Insurance Amount', type: 'number' },
            { key: 'accessory_amount', label: 'Accessory Amount', type: 'number' },
            { key: 'other_initial_cost', label: 'Other Initial Cost', type: 'number' },
            { key: 'total_acquisition_cost', label: 'Total Acquisition Cost', type: 'number' },
            { key: 'finance_flag', label: 'Under Finance?', type: 'radio', options: ['Yes', 'No'] }
        ];
        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            const [fieldCheck] = await db.execute("SELECT id FROM module_section_fields WHERE section_id = ? AND field_key = ?", [sectionId, f.key]);
            if (fieldCheck.length === 0) {
                const [insertFieldRes] = await db.execute("INSERT INTO module_section_fields (company_id, module_id, section_id, label, field_key, field_type, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) RETURNING id", [1, moduleId, sectionId, f.label, f.key, f.type, (i + 1), 1]);
                const fieldId = insertFieldRes.insertId;
                if (f.options) {
                    for (let j = 0; j < f.options.length; j++) {
                        await db.execute("INSERT INTO module_section_field_options (field_id, option_label, option_value, sort_order, created_at) VALUES (?, ?, ?, ?, NOW())", [fieldId, f.options[j], f.options[j], j]);
                    }
                }
            }
        }
        res.json({ success: true, message: 'Vehicle Purchases section and fields created successfully' });
    } catch (e) {
        console.error('[SETUP ERROR]', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Import Routes
const authRoutes = require('./routes/auth');
const smtpRoutes = require('./routes/smtp');
const clientRoutes = require('./routes/clients');
const vehicleRoutes = require('./routes/vehicles');
const companyRoutes = require('./routes/companies');
const assetRoutes = require('./routes/assets');
console.log('[Index] Requiring employeeRoutes...');
const employeeRoutes = require('./routes/employees');
console.log('[Index] Required employeeRoutes');
const departmentRoutes = require('./routes/departments');
const categoryRoutes = require('./routes/categories');
const requestRoutes = require('./routes/requests');
const maintenanceRoutes = require('./routes/maintenance');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const officeRoutes = require('./routes/office');
const moduleBuilderRoutes = require('./routes/moduleBuilder');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/smtp', smtpRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/module-builder', moduleBuilderRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/office', officeRoutes);
app.use('/api/roles', require('./routes/roles'));
app.use('/api/module-sections', require('./routes/moduleSections'));

// Core Catalog and Module configuration routes
app.use('/api', require('./routes/companyModules'));

app.use('/api', require('./routes/erpTemplates'));

app.get('/', (req, res) => {
    res.json({ message: 'TRakio API is running', version: '2.0.3' });
});

// 404 handler
app.use((req, res, next) => {
    console.log(`[404 NOT FOUND] ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found on this server.`
    });
});

// Error handling// Global error handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err.stack);
    try {
        require('fs').appendFileSync('global_error.log', `[${new Date().toISOString()}] ERROR ${req.method} ${req.url}: ${err.message}\nStack: ${err.stack}\n`);
    } catch (e) { }
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
