const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendWelcomeTempPassword } = require('../services/mailer/mailer');

// List all clients
exports.getClients = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT c.*, 
            (SELECT COUNT(*) FROM companies WHERE client_id = c.id) as companies_count 
            FROM clients c 
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single client with its companies
exports.getClientDetails = async (req, res) => {
    const { id } = req.params;

    // Permission check: COMPANY_ADMIN can only view their own client
    if (req.user?.role === 'COMPANY_ADMIN' && req.user?.client_id != id) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own group details' });
    }

    try {
        const [clientRows] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
        if (clientRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const [companyRows] = await db.execute(`
            SELECT c.*, 
                   u.name as linked_admin_name, 
                   u.email as linked_admin_email
            FROM companies c
            LEFT JOIN users u ON u.company_id = c.id AND u.role = 'COMPANY_ADMIN'
            WHERE c.client_id = ?
        `, [id]);

        // Enhance company data with employee and asset counts
        const enhancedCompanies = await Promise.all(companyRows.map(async (company) => {
            const [empCount] = await db.execute('SELECT COUNT(*) as count FROM employees WHERE company_id = ?', [company.id]);
            const [assetCount] = await db.execute('SELECT COUNT(*) as count FROM assets WHERE company_id = ?', [company.id]);
            return {
                ...company,
                employee_count: parseInt(empCount[0].count),
                asset_count: parseInt(assetCount[0].count)
            };
        }));

        // Fetch the Admin User for this client (for the edit form)
        const [adminRows] = await db.execute('SELECT name, email FROM users WHERE client_id = ? AND role = ? LIMIT 1', [id, 'COMPANY_ADMIN']);
        const adminUser = adminRows.length > 0 ? adminRows[0] : {};

        console.log('---------------- CLIENT DETAILS ----------------');
        console.log(`[getClientDetails] Company count: ${enhancedCompanies.length}`);
        if (enhancedCompanies.length > 0) {
            console.log('[getClientDetails] First Enhanced Comp:', {
                id: enhancedCompanies[0].id,
                name: enhancedCompanies[0].name,
                admin_name: enhancedCompanies[0].admin_name,
                admin_email: enhancedCompanies[0].admin_email
            });
        }
        console.log('------------------------------------------------');

        res.json({
            success: true,
            data: {
                ...clientRows[0],
                companies: enhancedCompanies,
                admin_name: adminUser.name || '',
                admin_email: adminUser.email || ''
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const cleanNum = (val) => (val === "" || val === null || val === undefined) ? null : Number(val);

// Create a new client
exports.createClient = async (req, res) => {
    let {
        name, company_code, trade_license, tax_no, industry, logo,
        tenancy_type, landlord_name, contract_start_date, contract_end_date, registration_no, ownership_doc_ref,
        country, state, city, area, address, po_box, makani_number,
        telephone, email, website, support_email,
        max_companies, max_employees, max_assets, enabled_modules,
        admin_name, admin_email, admin_password,
        send_email
    } = req.body;

    // Clean numeric fields to handle empty strings for PostgreSQL
    max_companies = cleanNum(max_companies);
    max_employees = cleanNum(max_employees);
    max_assets = cleanNum(max_assets);

    try {
        // 1. Create the Client
        const [result] = await db.execute(
            `INSERT INTO clients (
                name, company_code, trade_license, tax_no, industry, logo,
                tenancy_type, landlord_name, contract_start_date, contract_end_date, registration_no, ownership_doc_ref,
                country, state, city, area, address, po_box, makani_number,
                telephone, email, website, support_email,
                max_companies, max_employees, max_assets, enabled_modules
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                name, company_code, trade_license, tax_no, industry, logo,
                tenancy_type || 'OWNED', landlord_name, contract_start_date || null, contract_end_date || null, registration_no, ownership_doc_ref,
                country, state, city, area, address, po_box, makani_number,
                telephone, email, website, support_email,
                max_companies ?? 5, max_employees ?? 100, max_assets ?? 500, JSON.stringify(enabled_modules || [])
            ]
        );
        const clientId = result[0].id;

        // 2. Create the HQ Company (Automatically)
        const [companyResult] = await db.execute(
            'INSERT INTO companies (name, client_id, status, max_employees, max_assets) VALUES (?, ?, ?, ?, ?) RETURNING id',
            [name + ' (HQ)', clientId, 'ACTIVE', max_employees || 10, max_assets || 20]
        );
        const companyId = companyResult[0].id;

        // 3. Create Admin User (if provided)
        if (admin_email && admin_password) {
            const hashedPassword = await bcrypt.hash(admin_password, 10);
            await db.execute(
                'INSERT INTO users (name, email, password, role, company_id, client_id, status, force_reset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [admin_name || 'Admin', admin_email, hashedPassword, 'COMPANY_ADMIN', companyId, clientId, 'ACTIVE', true]
            );

            // Send Welcome Email in background
            if (send_email !== false) {
                sendWelcomeTempPassword({
                    name: admin_name || 'Admin',
                    email: admin_email,
                    tempPassword: admin_password,
                    companyName: name
                }).catch(mailError => {
                    console.error(`[Client Created] Failed to send email in background to ${admin_email}:`, mailError.message);
                });
                console.log(`[Client Created] Welcome email triggered for ${admin_email}`);
            }
        }


        res.status(201).json({ success: true, data: { id: clientId, name } });
    } catch (error) {
        console.error('Create Client Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update client
exports.updateClientLimits = async (req, res) => {
    const { id } = req.params;

    // Permission check: COMPANY_ADMIN can only update their own client
    if (req.user?.role === 'COMPANY_ADMIN' && req.user?.client_id != id) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only update your own group details' });
    }

    let {
        name, company_code, trade_license, tax_no, industry, logo,
        tenancy_type, landlord_name, contract_start_date, contract_end_date, registration_no, ownership_doc_ref,
        country, state, city, area, address, po_box, makani_number,
        telephone, email, website, support_email,
        max_companies, max_employees, max_assets, enabled_modules, status,
        admin_name, admin_email, admin_password // Catch admin updates
    } = req.body;

    // Clean numeric fields to handle empty strings for PostgreSQL
    max_companies = cleanNum(max_companies);
    max_employees = cleanNum(max_employees);
    max_assets = cleanNum(max_assets);

    // console.log('[DEBUG] updateClientLimits payload:', { id, admin_email, admin_name, hasPassword: !!admin_password });

    try {
        await db.execute(
            `UPDATE clients SET 
                name = ?, company_code = ?, trade_license = ?, tax_no = ?, industry = ?, logo = ?,
                tenancy_type = ?, landlord_name = ?, contract_start_date = ?, contract_end_date = ?, registration_no = ?, ownership_doc_ref = ?,
                country = ?, state = ?, city = ?, area = ?, address = ?, po_box = ?, makani_number = ?,
                telephone = ?, email = ?, website = ?, support_email = ?,
                max_companies = ?, max_employees = ?, max_assets = ?, enabled_modules = ?, status = ?
            WHERE id = ?`,
            [
                name, company_code, trade_license, tax_no, industry, logo,
                tenancy_type, landlord_name, contract_start_date || null, contract_end_date || null, registration_no, ownership_doc_ref,
                country, state, city, area, address, po_box, makani_number,
                telephone, email, website, support_email,
                max_companies, max_employees, max_assets, JSON.stringify(enabled_modules), status, id
            ]
        );

        // 2. Update Admin User Logic
        if (admin_email) {
            // Find existing admin for this client
            const [users] = await db.execute('SELECT * FROM users WHERE client_id = ? AND role = ? LIMIT 1', [id, 'COMPANY_ADMIN']);

            if (users.length > 0) {
                const userId = users[0].id;
                let updateQuery = 'UPDATE users SET name = ?, email = ?';
                let updateParams = [admin_name || users[0].name, admin_email];

                if (admin_password) {
                    const hashedPassword = await bcrypt.hash(admin_password, 10);
                    updateQuery += ', password = ?';
                    updateParams.push(hashedPassword);
                }

                updateQuery += ' WHERE id = ?';
                updateParams.push(userId);

                await db.execute(updateQuery, updateParams);
            } else if (admin_password) {
                // If no admin exists but password provided, create one (Recovery)
                // Need a company ID for the user. Find the HQ company.
                const [comps] = await db.execute('SELECT id FROM companies WHERE client_id = ? ORDER BY id ASC LIMIT 1', [id]);
                if (comps.length > 0) {
                    const hashedPassword = await bcrypt.hash(admin_password, 10);
                    await db.execute(
                        'INSERT INTO users (name, email, password, role, company_id, client_id, status, force_reset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [admin_name || 'Admin', admin_email, hashedPassword, 'COMPANY_ADMIN', comps[0].id, id, 'ACTIVE', true]
                    );

                    // Send Email for newly created admin via update
                    await sendEmail(
                        admin_email,
                        'Your Trakio Admin Access',
                        `Hello ${admin_name},\n\nYour administrator account has been created/reset.\nEmail: ${admin_email}\nTemporary Password: ${admin_password}\n\nPlease log in and change your password immediately.`,
                        `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Admin Access Granted</h2>
                            <p>Hello <strong>${admin_name}</strong>,</p>
                            <p>Your administrator account has been created.</p>
                            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Email:</strong> ${admin_email}</p>
                                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${admin_password}</p>
                            </div>
                            <p>Please log in and change your password immediately.</p>
                        </div>
                        `
                    );
                }
            }
        }

        res.json({ success: true, message: 'Client updated successfully' });
    } catch (error) {
        console.error('Update Client Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Global KPIs for Superadmin
exports.getGlobalKpis = async (req, res) => {
    try {
        const [clients] = await db.execute('SELECT COUNT(*) as count FROM clients');
        const [companies] = await db.execute('SELECT COUNT(*) as count FROM companies');
        const [employees] = await db.execute('SELECT COUNT(*) as count FROM employees');
        const [assets] = await db.execute('SELECT COUNT(*) as count FROM assets');

        res.json({
            success: true,
            data: {
                totalClients: clients[0].count,
                totalCompanies: companies[0].count,
                totalEmployees: employees[0].count,
                totalAssets: assets[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete client
exports.deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM clients WHERE id = ?', [id]);
        res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Delete Client Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
