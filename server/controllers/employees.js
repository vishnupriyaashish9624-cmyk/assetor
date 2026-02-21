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

        // If not super admin, filter by company/client
        if (req.user?.role !== 'SUPER_ADMIN') {
            if (req.user?.company_id) {
                sql += ' WHERE e.company_id = ?';
                params.push(req.user.company_id);
            }
        } else if (req.query.company_id) {
            sql += ' WHERE e.company_id = ?';
            params.push(req.query.company_id);
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
 * Create a new employee and their user account
 */
exports.createEmployee = async (req, res) => {
    const { name, email, role, role_id, company_id, department_id, employee_id_card, position, phone, password, auto_generate_password } = req.body;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Enforce limits and privileges
        const [companyRows] = await connection.execute('SELECT name, client_id, can_add_employee FROM companies WHERE id = ?', [company_id]);
        if (companyRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        const company = companyRows[0];

        // 1. Check Privilege
        if (company.can_add_employee === false) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'PRIVILEGE_DENIED',
                detail: 'This company does not have the privilege to add employees. Please contact your administrator.'
            });
        }

        // 2. Check Client Limit
        if (company.client_id) {
            console.log(`[createEmployee] Checking Client Limit...`);
            const clientLimitStatus = await checkClientLimit(company.client_id, 'employees');
            if (clientLimitStatus.exceeded) {
                await connection.rollback();
                console.log(`[createEmployee] Client Limit Exceeded`);
                return res.status(400).json({
                    success: false,
                    message: 'LIMIT_EXCEEDED',
                    detail: `Total employee limit for this client reached (${clientLimitStatus.limit})`
                });
            }
        }
        console.log(`[createEmployee] Client Limit Checked`);

        // 3. Check Company Limit
        const companyLimitStatus = await checkCompanyLimit(company_id, 'employees');
        if (companyLimitStatus.exceeded) {
            await connection.rollback();
            console.log(`[createEmployee] Company Limit Exceeded`);
            return res.status(400).json({
                success: false,
                message: 'LIMIT_EXCEEDED',
                detail: `Employee limit for this company reached (${companyLimitStatus.limit})`
            });
        }
        console.log(`[createEmployee] Company Limit Checked`);

        // 4. Create Employee Record
        console.log(`[createEmployee] Inserting employee...`);
        const [empRows] = await connection.execute(
            'INSERT INTO employees (company_id, name, email, department_id, employee_id_card, position, phone) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
            [company_id, name, email, department_id, employee_id_card, position, phone]
        );
        const employeeId = empRows[0].id;
        console.log(`[createEmployee] Employee row inserted, id: ${employeeId}`);

        // 5. Create User Account with Login Credentials
        if (email) {
            console.log(`[createEmployee] Creating user account for ${email}...`);
            let finalPassword;

            if (auto_generate_password) {
                // Generate random 8-character password
                const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
                finalPassword = Array.from({ length: 8 }, () => charset[Hint.getRandomInt(0, charset.length - 1)]).join('');
            } else {
                finalPassword = password || 'employee123'; // Fallback password
            }

            console.log(`[createEmployee] Hashing password...`);
            const hashedPassword = await bcrypt.hash(finalPassword, 10);
            console.log(`[createEmployee] Password hashed`);

            await connection.execute(
                'INSERT INTO users (name, email, password, role, role_id, company_id, client_id, status, force_reset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, email, hashedPassword, 'EMPLOYEE', role_id || null, company_id, company.client_id || null, 'ACTIVE', true]
            );

            console.log(`[createEmployee] User account created in DB`);

            // Send Modular Premium Welcome Email
            sendWelcomeTempPassword({
                name: name,
                email: email,
                tempPassword: finalPassword,
                companyName: company.name
            }).then(() => {
                console.log(`[Employee Created] Welcome email sent to ${email}`);
            }).catch(mailError => {
                console.error(`[Employee Created] Failed to send email to ${email}:`, mailError.message);
            });
        }

        await connection.commit();
        console.log(`[createEmployee] Transaction committed`);
        res.status(201).json({ success: true, data: { id: employeeId, ...req.body } });
        console.log(`[createEmployee] Response sent to client`);
    } catch (error) {
        if (connection) await connection.rollback().catch(e => console.error('Rollback error:', e));
        console.error('[createEmployee] Error:', error);
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
    const { name, email, department_id, employee_id_card, position, phone, role_id } = req.body;

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

