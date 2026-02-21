const db = require('../config/db');
const { checkClientLimit } = require('../utils/limitChecker');
const bcrypt = require('bcryptjs');
const { sendWelcomeTempPassword } = require('../services/mailer/mailer');

// Helper: returns null for empty or invalid date strings
const sanitizeDate = (val) => {
    if (!val || typeof val !== 'string' || val.trim() === '') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : val;
};

exports.getCompanies = async (req, res) => {
    try {
        let sql = `
            SELECT c.*, 
                   u.name as linked_admin_name, 
                   u.email as linked_admin_email
            FROM companies c
            LEFT JOIN users u ON u.company_id = c.id AND u.role = 'COMPANY_ADMIN'
        `;
        let params = [];

        if (req.user?.role === 'COMPANY_ADMIN') {
            if (req.user?.client_id) {
                sql += ' WHERE c.client_id = ?';
                params.push(req.user.client_id);
            } else {
                // Standalone admin seeing other standalone companies (likely for dev/testing)
                // We show strictly companies with NO client assigned, OR the specific company the user belongs to
                sql += ' WHERE c.client_id IS NULL';

                // Optional: If you want to restrict it strictly to their own company when standalone, you'd do:
                // sql += ' WHERE id = ?'; params.push(req.user.company_id);
                // But the user specifically asked to see the NEW company they added (which implies grouping without a client).
            }
        }

        const [rows] = await db.execute(sql, params);
        console.log('************************************************');
        console.log('[getCompanies] COUNT:', rows.length);
        if (rows.length > 0) {
            console.log('[getCompanies] FIRST COMP:', {
                id: rows[0].id,
                name: rows[0].name,
                admin_name: rows[0].linked_admin_name,
                admin_email: rows[0].linked_admin_email
            });
        }
        console.log('************************************************');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCompanyById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT c.*, 
                   u.name as linked_admin_name, 
                   u.email as linked_admin_email
            FROM companies c
            LEFT JOIN users u ON u.company_id = c.id AND u.role = 'COMPANY_ADMIN'
            WHERE c.id = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        // Permission check: COMPANY_ADMIN can only view companies in their own client group
        if (req.user?.role === 'COMPANY_ADMIN') {
            if (rows[0].client_id != req.user?.client_id) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Get Company By ID Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCompany = async (req, res) => {
    console.log('[createCompany] START - body keys:', Object.keys(req.body));
    const {
        name, subdomain, client_id, max_employees, max_assets,
        company_code, trade_license, tax_no, industry, logo,
        tenancy_type, landlord_name, contract_start_date, contract_end_date, registration_no, ownership_doc_ref,
        country, state, city, area, address, po_box, makani_number,
        telephone, email, website,
        can_add_employee,
        admin_name, admin_email, admin_password,
        enabled_modules, send_email
    } = req.body;

    // Enforce client isolation: COMPANY_ADMIN can only create companies for their own client
    const target_client_id = req.user?.role === 'COMPANY_ADMIN' ? req.user?.client_id : client_id;
    console.log('[createCompany] target_client_id:', target_client_id, 'name:', name);

    let connection;
    try {
        connection = await db.getConnection();
        console.log('[createCompany] Got connection');
        await connection.beginTransaction();
        console.log('[createCompany] Transaction started');

        if (target_client_id) {
            console.log('[createCompany] Checking limit for client:', target_client_id);
            const limitStatus = await checkClientLimit(target_client_id, 'companies');
            console.log('[createCompany] Limit check result:', limitStatus);
            if (limitStatus.exceeded) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                    success: false,
                    message: 'LIMIT_EXCEEDED',
                    detail: `Maximum company limit reached (${limitStatus.limit})`
                });
            }
        }

        console.log('[createCompany] Inserting company...');
        const [rows] = await connection.execute(
            `INSERT INTO companies (
                name, subdomain, client_id, can_add_employee, max_employees, max_assets,
                company_code, trade_license, tax_no, industry, logo,
                tenancy_type, landlord_name, contract_start_date, contract_end_date, 
                registration_no, ownership_doc_ref, country, state, city, area, 
                address, po_box, makani_number, telephone, email, website,
                enabled_modules
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28
            ) RETURNING id`,
            [
                name,                                           // $1
                subdomain,                                      // $2
                target_client_id || null,                       // $3
                can_add_employee !== undefined ? can_add_employee : true, // $4
                max_employees || 10,                            // $5
                max_assets || 20,                               // $6
                company_code,                                   // $7
                trade_license,                                  // $8
                tax_no,                                         // $9
                industry,                                       // $10
                logo,                                           // $11
                tenancy_type || 'OWNED',                        // $12
                landlord_name,                                  // $13
                sanitizeDate(contract_start_date),               // $14
                sanitizeDate(contract_end_date),                 // $15
                registration_no,                                // $16
                ownership_doc_ref,                              // $17
                country,                                        // $18
                state,                                          // $19
                city,                                           // $20
                area,                                           // $21
                address,                                        // $22
                po_box,                                         // $23
                makani_number,                                  // $24
                telephone,                                      // $25
                email,                                          // $26
                website,                                        // $27
                JSON.stringify(enabled_modules || [])           // $28
            ]
        );
        const companyId = rows[0].id;
        console.log('[createCompany] Company inserted, id:', companyId);

        // Create Admin User for the company if provided
        if (admin_email && admin_password) {
            console.log('[createCompany] Inserting admin user:', admin_email);
            const hashedPassword = await bcrypt.hash(admin_password, 10);
            await connection.execute(
                'INSERT INTO users (name, email, password, role, company_id, client_id, status, force_reset) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [admin_name || 'Admin', admin_email, hashedPassword, 'COMPANY_ADMIN', companyId, target_client_id || null, 'ACTIVE', true]
            );
            console.log('[createCompany] Admin user inserted');

        }

        await connection.commit();
        console.log('[createCompany] Committed');

        // Send Welcome Email in background (after commit)
        if (admin_email && admin_password && send_email !== false) {
            sendWelcomeTempPassword({
                name: admin_name || 'Admin',
                email: admin_email,
                tempPassword: admin_password,
                companyName: name
            }).catch(mailError => {
                console.error(`[Company Created] Failed to send email in background to ${admin_email}:`, mailError.message);
            });
            console.log(`[Company Created] Welcome email triggered for ${admin_email}`);
        }
        // Fetch the full company object with admin joins to return to UI
        const [fullComp] = await connection.execute(`
            SELECT c.*, 
                   u.name as linked_admin_name, 
                   u.email as linked_admin_email
            FROM companies c
            LEFT JOIN users u ON u.company_id = c.id AND u.role = 'COMPANY_ADMIN'
            WHERE c.id = ?
        `, [companyId]);

        res.status(201).json({
            success: true,
            data: fullComp[0]
        });
        console.log('[createCompany] Response sent');
    } catch (error) {
        console.error('[createCompany] ERROR:', error.message);
        console.error('[createCompany] STACK:', error.stack);
        if (connection) {
            try { await connection.rollback(); } catch (rbErr) { console.error('[createCompany] Rollback error:', rbErr.message); }
        }
        // User-friendly error for unique constraint violations
        if (error.code === '23505') {
            const field = error.constraint || 'field';
            res.status(409).json({ success: false, message: `A company with this ${field} already exists. Please use a different value.` });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    } finally {
        if (connection) {
            try { connection.release(); } catch (relErr) { console.error('[createCompany] Release error:', relErr.message); }
        }
        console.log('[createCompany] DONE');
    }
};

exports.updateCompany = async (req, res) => {
    const { id } = req.params;
    const {
        name, subdomain, status, max_employees, max_assets,
        company_code, trade_license, tax_no, industry, logo,
        tenancy_type, landlord_name, contract_start_date, contract_end_date, registration_no, ownership_doc_ref,
        country, state, city, area, address, po_box, makani_number,
        telephone, email, website,
        can_add_employee,
        enabled_modules
    } = req.body;

    try {
        // Permission check: COMPANY_ADMIN can only update companies in their own client group
        if (req.user?.role === 'COMPANY_ADMIN') {
            const [rows] = await db.execute('SELECT client_id FROM companies WHERE id = ?', [id]);
            if (rows.length === 0 || rows[0].client_id != req.user?.client_id) {
                return res.status(403).json({ success: false, message: 'Access denied: You can only update your own companies' });
            }
        }

        const { admin_name, admin_email, admin_password } = req.body;
        await db.execute(
            `UPDATE companies SET 
                name = $1, subdomain = $2, status = $3, can_add_employee = $4, max_employees = $5, max_assets = $6,
                company_code = $7, trade_license = $8, tax_no = $9, industry = $10, logo = $11,
                tenancy_type = $12, landlord_name = $13, contract_start_date = $14, contract_end_date = $15, 
                registration_no = $16, ownership_doc_ref = $17, country = $18, state = $19, city = $20, 
                area = $21, address = $22, po_box = $23, makani_number = $24, telephone = $25, email = $26, website = $27,
                enabled_modules = $28
            WHERE id = $29`,
            [
                name, subdomain, status || 'ACTIVE', can_add_employee !== undefined ? can_add_employee : true, max_employees, max_assets,
                company_code, trade_license, tax_no, industry, logo,
                tenancy_type, landlord_name, sanitizeDate(contract_start_date), sanitizeDate(contract_end_date), registration_no, ownership_doc_ref,
                country, state, city, area, address, po_box, makani_number,
                telephone, email, website,
                JSON.stringify(enabled_modules || []),
                id
            ]
        );

        // Update Admin User if details provided
        if (admin_name || admin_email || admin_password) {
            const [admins] = await db.execute(
                'SELECT id FROM users WHERE company_id = ? AND role = ? LIMIT 1',
                [id, 'COMPANY_ADMIN']
            );

            if (admins.length > 0) {
                const adminId = admins[0].id;
                let userUpdates = [];
                let userParams = [];

                if (admin_name) { userUpdates.push('name = ?'); userParams.push(admin_name); }
                if (admin_email) { userUpdates.push('email = ?'); userParams.push(admin_email); }
                if (admin_password) {
                    const hashedPassword = await bcrypt.hash(admin_password, 10);
                    userUpdates.push('password = ?');
                    userParams.push(hashedPassword);
                }

                if (userUpdates.length > 0) {
                    userParams.push(adminId);
                    await db.execute(
                        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
                        userParams
                    );
                }
            }
        }

        // Fetch the full company object with admin joins to return to UI
        const [fullComp] = await db.execute(`
            SELECT c.*, 
                   u.name as linked_admin_name, 
                   u.email as linked_admin_email
            FROM companies c
            LEFT JOIN users u ON u.company_id = c.id AND u.role = 'COMPANY_ADMIN'
            WHERE c.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Company updated successfully',
            data: fullComp[0]
        });
    } catch (error) {
        console.error('Update Company Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCompany = async (req, res) => {
    const { id } = req.params;
    try {
        // Permission check: COMPANY_ADMIN can only delete companies in their own client group
        if (req.user?.role === 'COMPANY_ADMIN') {
            const [rows] = await db.execute('SELECT client_id FROM companies WHERE id = ?', [id]);
            if (rows.length === 0 || rows[0].client_id != req.user?.client_id) {
                return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own companies' });
            }
        }

        await db.execute('DELETE FROM companies WHERE id = ?', [id]);
        res.json({ success: true, message: 'Company deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addCompanyDocument = async (req, res) => {
    const { id } = req.params;
    const { name, content, file_type } = req.body;
    const fs = require('fs');
    const path = require('path');

    if (!name || !content) {
        return res.status(400).json({ success: false, message: 'Missing name or content' });
    }

    try {
        // Permission check: COMPANY_ADMIN can only add docs to their own companies
        if (req.user?.role === 'COMPANY_ADMIN') {
            const [rows] = await db.execute('SELECT client_id FROM companies WHERE id = ?', [id]);
            if (rows.length === 0 || rows[0].client_id != req.user?.client_id) {
                return res.status(403).json({ success: false, message: 'Access denied: You can only manage your own companies' });
            }
        }

        const base64Data = content.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
        const uploadDir = path.join(__dirname, '../uploads/companies');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const uniqueName = `${Date.now()}_${name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, base64Data, 'base64');
        const relativePath = `/uploads/companies/${uniqueName}`;

        await db.execute(
            'INSERT INTO company_documents (company_id, name, file_path, file_type) VALUES (?, ?, ?, ?)',
            [id, name, relativePath, file_type || 'application/octet-stream']
        );

        res.json({ success: true, message: 'Document added', path: relativePath });
    } catch (error) {
        console.error('Add company document error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCompanyDocuments = async (req, res) => {
    const { id } = req.params;
    try {
        // Permission check: COMPANY_ADMIN can only view docs of their own companies
        if (req.user?.role === 'COMPANY_ADMIN') {
            const [rows] = await db.execute('SELECT client_id FROM companies WHERE id = ?', [id]);
            if (rows.length === 0 || rows[0].client_id != req.user?.client_id) {
                return res.status(403).json({ success: false, message: 'Access denied: You can only view your own companies' });
            }
        }

        const [rows] = await db.execute('SELECT * FROM company_documents WHERE company_id = ? ORDER BY uploaded_at DESC', [id]);
        const baseUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5021';
        const data = rows.map(doc => ({
            ...doc,
            url: doc.file_path.startsWith('http') ? doc.file_path : `${baseUrl}${doc.file_path}`
        }));
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
