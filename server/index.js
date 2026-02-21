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

// Request Logger
app.use((req, res, next) => {
    const logMsg = `[REQ] ${new Date().toISOString()} ${req.method} ${req.url}\n`;
    console.log(logMsg.trim());
    require('fs').appendFileSync('requests.log', logMsg);
    next();
});

app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        version: '2.0.3-fixed',
        timestamp: new Date()
    });
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

// Greedy /api routes LAST
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err.stack);
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
