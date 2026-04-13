const db = require('../config/db');
const { checkClientLimit, checkCompanyLimit } = require('../utils/limitChecker');
const bcrypt = require('bcryptjs');
const { sendWelcomeTempPassword } = require('../services/mailer/mailer');

/**
 * Get all employees with optional company filtering
 */
exports.getEmployees = async (req, res) => {
    try {
        let sql = `
            SELECT e.id, e.company_id, e.department_id, e.employee_id_card,
                   e.name, e.email, e.phone, e.position,
                   c.name as company_name, u.role as role_name, u.role_id,
                   d.name as department_name
            FROM employees e
            JOIN companies c ON e.company_id = c.id
            LEFT JOIN users u ON u.email = e.email AND u.company_id = e.company_id
            LEFT JOIN departments d ON e.department_id = d.id
        `;
        let params = [];
        let conditions = [];

        // 1. Check for explicit company filter in query (Superadmin or filtered view)
        if (req.query.company_id) {
            conditions.push('e.company_id = ?');
            params.push(req.query.company_id);
        }

        // 2. If not super admin, enforce access restrictions
        if (req.user && req.user.role !== 'SUPER_ADMIN') {
            if (req.user.company_id) {
                // If they tried to filter for another company, this will override it or we could throw error.
                // For safety, we enforce their own company.
                conditions.length = 0; // Clear previous
                params.length = 0;     // Clear previous
                conditions.push('e.company_id = ?');
                params.push(req.user.company_id);
            }
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY e.id DESC';

        const [rows] = await db.execute(sql, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[EmployeeController] getEmployees error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
    }
};

/**
 * Get all company memberships for a specific email
 */
exports.getEmployeeMemberships = async (req, res) => {
    const { email } = req.params;
    try {
        const [rows] = await db.execute(
            'SELECT company_id FROM employees WHERE email = ?',
            [email]
        );
        const companyIds = rows.map(r => r.company_id);
        res.json({ success: true, data: companyIds });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new employee and their user account
 */
exports.createEmployee = async (req, res) => {
    const fs = require('fs');
    const logPath = require('path').join(__dirname, '..', 'server_debug.log');
    const log = (msg) => {
        const time = new Date().toISOString();
        console.log(`[CREATE_EMP] ${msg}`);
        try { fs.appendFileSync(logPath, `[${time}] [CREATE_EMP] ${msg}\n`); } catch (e) { }
    };

    let { name, email, role, role_id, company_id, company_ids, department_id, employee_id_card, position, phone, password, auto_generate_password } = req.body;
    if (email) email = email.trim();

    log(`Start - name: ${name}, email: ${email}, company_ids: ${JSON.stringify(company_ids)}, company_id: ${company_id}`);

    // Support for multiple companies
    const targetCompanyIds = company_ids && Array.isArray(company_ids) && company_ids.length > 0
        ? company_ids
        : [company_id];

    log(`Target IDs to process: ${JSON.stringify(targetCompanyIds)}`);

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const createdEmployees = [];

        for (const targetId of targetCompanyIds) {
            log(`Processing company_id: ${targetId}`);

            // Enforce limits and privileges
            const [companyRows] = await connection.execute('SELECT name, client_id, can_add_employee FROM companies WHERE id = ?', [targetId]);
            if (companyRows.length === 0) {
                log(`Company ${targetId} not found, skipping...`);
                continue;
            }

            const company = companyRows[0];

            // 1. Check Privilege
            if (company.can_add_employee === false) {
                log(`Company ${targetId} lacks privilege, skipping...`);
                continue;
            }

            // 2. Check Client Limit
            if (company.client_id) {
                const clientLimitStatus = await checkClientLimit(company.client_id, 'employees');
                if (clientLimitStatus.exceeded) {
                    log(`Client Limit Exceeded for company ${targetId}, skipping...`);
                    continue;
                }
            }

            // 3. Check Company Limit
            const companyLimitStatus = await checkCompanyLimit(targetId, 'employees');
            if (companyLimitStatus.exceeded) {
                log(`Company Limit Exceeded for company ${targetId}, skipping...`);
                continue;
            }

            // 4. Create Employee Record
            log(`Inserting employee for company ${targetId}...`);
            const [empRows] = await connection.execute(
                'INSERT INTO employees (company_id, name, email, department_id, employee_id_card, position, phone) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
                [targetId, name, email, department_id, employee_id_card, position, phone]
            );
            const employeeId = empRows.insertId;
            log(`Inserted employee ID: ${employeeId}`);

            // 5. Create User Account with Login Credentials
            if (email) {
                log(`Creating user account for ${email} in company ${targetId}...`);
                let finalPassword;
                if (auto_generate_password) {
                    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
                    finalPassword = Array.from({ length: 8 }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
                } else {
                    finalPassword = password || 'employee123';
                }

                const hashedPassword = await bcrypt.hash(finalPassword, 10);

                await connection.execute(
                    'INSERT INTO users (name, email, password, role, role_id, company_id, client_id, status, force_reset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [name, email, hashedPassword, 'EMPLOYEE', role_id || null, targetId, company.client_id || null, 'ACTIVE', true]
                );
                log(`User account created`);

                // Send Welcome Email
                sendWelcomeTempPassword({
                    name: name,
                    email: email,
                    tempPassword: finalPassword,
                    companyName: company.name
                }).catch(err => log(`Email Error: ${err.message}`));
            }

            createdEmployees.push({ id: employeeId, company_id: targetId });
        }

        await connection.commit();
        log(`Transaction committed, total created: ${createdEmployees.length}`);
        res.status(201).json({
            success: true,
            message: `Successfully created ${createdEmployees.length} employee record(s).`,
            data: createdEmployees
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(e => log(`Rollback error: ${e.message}`));
        log(`Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Update employee record
 */
exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    let { name, email, department_id, employee_id_card, position, phone, role_id } = req.body;
    if (email) email = email.trim();

    let connection;
    const fs = require('fs');
    const logPath = require('path').join(__dirname, '..', 'server_debug.log');
    const log = (msg) => {
        const time = new Date().toISOString();
        console.log(msg);
        try { fs.appendFileSync(logPath, `[${time}] ${msg}\n`); } catch (e) { }
    };

    try {
        log(`[updateEmployee] Starting update for ID: ${id}`);
        log(`[updateEmployee] Payload: ${JSON.stringify(req.body)}`);
        connection = await db.getConnection();
        log(`[updateEmployee] Got connection from pool`);
        await connection.beginTransaction();
        log(`[updateEmployee] Transaction started`);

        // 1. Get original email before update to find linked user
        log(`[updateEmployee] Fetching original email for ID: ${id}`);
        const [originalEmp] = await connection.execute('SELECT email, company_id FROM employees WHERE id = ?', [id]);

        if (!originalEmp || originalEmp.length === 0) {
            log(`[updateEmployee] Employee with ID ${id} not found`);
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const oldEmail = originalEmp[0].email;
        const employeeCompanyId = originalEmp[0].company_id;
        log(`[updateEmployee] Original email: ${oldEmail}, Company ID: ${employeeCompanyId}`);

        // 2. Update employee table
        log(`[updateEmployee] Updating employees table...`);
        const [empUpdateResult] = await connection.execute(
            'UPDATE employees SET name=?, email=?, department_id=?, employee_id_card=?, position=?, phone=? WHERE id=?',
            [name, email, department_id, employee_id_card, position, phone, id]
        );
        log(`[updateEmployee] Employees table updated. Affected rows: ${empUpdateResult.affectedRows}`);

        log(`[updateEmployee] Updating linked user account. New Email: ${email}, Old Email: ${oldEmail}`);
        const [userUpdateResult] = await connection.execute(
            'UPDATE users SET name=?, email=?, role_id=? WHERE email=? AND company_id = ?',
            [name, email, role_id || null, oldEmail, employeeCompanyId]
        );
        log(`[updateEmployee] Users table updated. Affected rows: ${userUpdateResult.affectedRows}`);

        // 3. Handle memberships (Company IDs)
        const { company_ids } = req.body;
        log(`[updateEmployee] CHECK: company_ids defined? ${!!company_ids}, IsArray? ${Array.isArray(company_ids)}`);
        if (company_ids && Array.isArray(company_ids)) {
            log(`[updateEmployee] Synchronizing memberships. Payload IDs: ${JSON.stringify(company_ids)}`);

            // A. Remove memberships NOT in the list
            log(`[updateEmployee] Removing memberships not in: ${JSON.stringify(company_ids)}`);
            const [currentMemberships] = await connection.execute(
                'SELECT company_id FROM employees WHERE email = ?',
                [email]
            );
            const currentIds = currentMemberships.map(m => m.company_id);
            log(`[updateEmployee] Current memberships IDs: ${JSON.stringify(currentIds)}`);

            for (const currentId of currentIds) {
                if (!company_ids.includes(currentId)) {
                    log(`[updateEmployee] Removing membership for company ${currentId}`);
                    // Delete employee record
                    await connection.execute(
                        'DELETE FROM employees WHERE email = ? AND company_id = ?',
                        [email, currentId]
                    );
                    // Optionally delete user record if you want total removal
                    await connection.execute(
                        'DELETE FROM users WHERE email = ? AND company_id = ?',
                        [email, currentId]
                    );
                }
            }

            // B. Add new memberships
            for (const targetId of company_ids) {
                const [existing] = await connection.execute(
                    'SELECT id FROM employees WHERE email = ? AND company_id = ?',
                    [email, targetId]
                );

                if (existing.length === 0) {
                    log(`[updateEmployee] Creating new membership for company ${targetId}`);
                    await connection.execute(
                        'INSERT INTO employees (company_id, name, email, department_id, employee_id_card, position, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [targetId, name, email, department_id, employee_id_card, position, phone]
                    );

                    const [compRows] = await connection.execute('SELECT client_id FROM companies WHERE id = ?', [targetId]);
                    const clientId = compRows[0]?.client_id || null;

                    const [existingUser] = await connection.execute('SELECT id FROM users WHERE email = ? AND company_id = ?', [email, targetId]);
                    if (existingUser.length === 0) {
                        const [currentUser] = await connection.execute('SELECT password, role, role_id FROM users WHERE email = ? AND company_id = ? LIMIT 1', [oldEmail, employeeCompanyId]);
                        if (currentUser.length > 0) {
                            await connection.execute(
                                'INSERT INTO users (name, email, password, role, role_id, company_id, client_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                [name, email, currentUser[0].password, currentUser[0].role, currentUser[0].role_id, targetId, clientId, 'ACTIVE']
                            );
                        }
                    }
                } else {
                    log(`[updateEmployee] Membership for company ${targetId} already exists`);
                }
            }
        }

        await connection.commit();
        log(`[updateEmployee] Success`);
        res.json({ success: true, message: 'Employee updated successfully' });
    } catch (error) {
        if (connection) await connection.rollback().catch(e => log(`Rollback error: ${e.message}`));
        log(`[updateEmployee] Error: ${error.message}`);
        log(`[updateEmployee] Stack: ${error.stack}`);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Delete employee record and their linked user account
 */
exports.deleteEmployee = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Get employee email & company_id to find linked user
        const [empRows] = await connection.execute(
            'SELECT email, company_id FROM employees WHERE id = ?',
            [req.params.id]
        );

        if (empRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const { email, company_id } = empRows[0];

        // Delete linked user account first (if exists)
        if (email) {
            await connection.execute(
                'DELETE FROM users WHERE email = ? AND company_id = ?',
                [email, company_id]
            );
        }

        // Delete employee record
        await connection.execute('DELETE FROM employees WHERE id = ?', [req.params.id]);

        await connection.commit();
        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => { });
        console.error('[deleteEmployee] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

