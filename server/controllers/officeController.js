const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const EXCLUDED_KEYS = new Set([
    'premise_type', 'premises_name', 'building_name', 'premises_use', 'country', 'city', 'full_address', 'location_notes', 'status', 'document_name', 'document_path', 'document_mime', 'google_map_url', 'capacity', 'address_line2', 'landmark', 'parking_available', 'parking_area',
    'area_id', 'company_module_id',
    'buy_date', 'purchase_value', 'property_size_sqft', 'title_deed_ref', 'owner_name', 'renewal_required', 'renewal_date', 'insurance_required', 'insurance_expiry', 'notes', 'floors_count', 'depreciation_rate', 'electricity_available', 'water_available', 'internet_available',
    'landlord_name', 'landlord_contact_person', 'landlord_phone', 'landlord_email', 'contract_start', 'contract_end', 'monthly_rent', 'yearly_rent', 'security_deposit', 'renewal_reminder_date', 'payment_frequency', 'next_payment_date', 'late_fee_terms',
    'electricity_no', 'water_no', 'internet_provider', 'utility_notes',
    'owned', 'rental', 'utilities', 'documents', 'id', 'premise_id', 'company_id', 'created_at', 'updated_at', 'document_url'
]);

// List Premises
// List Premises
exports.getPremises = async (req, res) => {
    const { type, search, page, limit } = req.query;
    const companyId = req.companyId || (req.user && req.user.company_id);

    console.log('[getPremises] Request received:', { type, search, page, limit });
    console.log('[getPremises] Context:', {
        user: req.user ? { id: req.user.id, role: req.user.role, company_id: req.user.company_id } : 'null',
        resolvedCompanyId: companyId
    });

    // Pagination Logic
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    const isPaginated = !!page; // Only paginate if page is strictly provided

    // List only if type is explicitly one of the valid ENUM values
    const isSummaryView = !type || type === 'undefined' || type === 'null' || type === '';

    try {
        if (!req.user) {
            console.error('[getPremises] req.user is undefined!');
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        let query = '';
        let params = [];
        let countQuery = '';
        let countParams = [];

        // If it's a summary view or no valid type is provided, fetch all premises
        if (isSummaryView) {
            let whereClause = companyId ? 'WHERE p.company_id = ?' : 'WHERE 1=1';
            let searchClause = '';

            if (companyId) {
                params.push(companyId);
                countParams.push(companyId);
            }

            if (search && search !== 'undefined') {
                searchClause = ` AND (p.premises_name LIKE ? OR p.building_name LIKE ? OR p.city LIKE ?)`;
                const searchParam = `%${search}%`;
                params.push(searchParam, searchParam, searchParam);
                countParams.push(searchParam, searchParam, searchParam);
            }

            countQuery = `SELECT COUNT(*) as total FROM office_premises p ${whereClause} ${searchClause}`;
            query = `
                SELECT p.*, a.name as area,
                       o.buy_date, o.purchase_value, o.owner_name, o.property_size_sqft, o.floors_count,
                       r.landlord_name, r.landlord_phone, r.contract_start, r.contract_end, r.monthly_rent, r.payment_frequency
                FROM office_premises p
                LEFT JOIN area a ON p.area_id = a.id
                LEFT JOIN office_owned_details o ON p.premise_id = o.premise_id
                LEFT JOIN office_rental_details r ON p.premise_id = r.premise_id
                ${whereClause} ${searchClause} 
                ORDER BY p.created_at DESC
            `;
        } else {
            // Typed View
            if (!['OWNED', 'RENTAL'].includes(type)) {
                return res.status(400).json({ success: false, message: 'Invalid premise type' });
            }

            let searchClause = '';
            const typeWhere = companyId ? 'p.company_id = ? AND p.premise_type = ?' : 'p.premise_type = ?';

            params = companyId ? [companyId, type] : [type];
            countParams = companyId ? [companyId, type] : [type];

            if (search) {
                searchClause = ` AND (p.premises_name LIKE ? OR p.building_name LIKE ? OR p.city LIKE ?)`;
                const searchParam = `%${search}%`;
                params.push(searchParam, searchParam, searchParam);
                countParams.push(searchParam, searchParam, searchParam);
            }

            const baseUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5031';
            const docCol = `, p.document_name, p.document_path, p.document_mime, 
                a.name as area,
                CASE WHEN p.document_path IS NOT NULL THEN CONCAT('${baseUrl}', p.document_path) ELSE NULL END as document_url`;

            countQuery = `SELECT COUNT(*) as total FROM office_premises p WHERE ${typeWhere} ${searchClause}`;

            if (type === 'OWNED') {
                query = `
                    SELECT p.*, d.buy_date, d.purchase_value, d.owner_name, d.property_size_sqft, d.floors_count ${docCol}
                    FROM office_premises p
                    LEFT JOIN area a ON p.area_id = a.id
                    LEFT JOIN office_owned_details d ON p.premise_id = d.premise_id
                    WHERE ${typeWhere} ${searchClause}
                    ORDER BY p.created_at DESC
                `;
            } else {
                query = `
                    SELECT p.*, d.landlord_name, d.contract_end, d.monthly_rent, d.yearly_rent, d.payment_frequency, d.landlord_phone ${docCol}
                    FROM office_premises p
                    LEFT JOIN area a ON p.area_id = a.id
                    LEFT JOIN office_rental_details d ON p.premise_id = d.premise_id
                    WHERE ${typeWhere} ${searchClause}
                    ORDER BY p.created_at DESC
                `;
            }
        }

        // Apply Pagination
        if (isPaginated) {
            query += ` LIMIT ? OFFSET ?`;
            params.push(limitNum, offset);
        } else {
            query += ` LIMIT 1000`; // Safety limit
        }

        console.log('[getPremises] Executing Query:', query.replace(/\s+/g, ' ').trim());
        console.log('[getPremises] Parameters:', params);

        // Execute queries
        const [countRows] = await db.execute(countQuery, countParams);
        const totalItems = countRows[0]?.total || 0;
        const [rows] = await db.execute(query, params);

        console.log(`[getPremises] Found ${rows.length} rows. Total items: ${totalItems}`);

        res.json({
            success: true,
            data: rows,
            pagination: isPaginated ? {
                totalItems,
                totalPages: Math.ceil(totalItems / limitNum),
                currentPage: pageNum,
                itemsPerPage: limitNum
            } : null
        });

    } catch (error) {
        console.error('Error fetching premises:', error);
        try { fs.appendFileSync(path.join(__dirname, '..', 'server_log.txt'), `[ERROR] getPremises Failed: ${error.message}\nStack: ${error.stack}\n`); } catch (e) { }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get Single Premise
exports.getPremiseById = async (req, res) => {
    const { id } = req.params;
    let companyId = req.companyId || (req.user && req.user.company_id);

    if (!companyId && req.user) {
        try {
            const [u] = await db.execute('SELECT company_id FROM users WHERE id = ?', [req.user.id]);
            if (u.length > 0) companyId = u[0].company_id;
        } catch (e) { }
    }

    try {
        const queryParams = [id];
        let whereClause = 'WHERE p.premise_id = ?';
        if (companyId) {
            whereClause += ' AND p.company_id = ?';
            queryParams.push(companyId);
        }

        const [baseRows] = await db.execute(
            `SELECT premise_type FROM office_premises p ${whereClause} `,
            queryParams
        );

        if (baseRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Premise not found' });
        }

        const type = baseRows[0].premise_type;
        let query = '';

        const baseUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5026';
        const docCol = `, CASE WHEN p.document_path IS NOT NULL THEN CONCAT('${baseUrl}', p.document_path) ELSE NULL END as document_url`;

        if (type === 'OWNED') {
            query = `
                SELECT p.*, d.* ${docCol} 
                FROM office_premises p
                LEFT JOIN office_owned_details d ON p.premise_id = d.premise_id
                ${whereClause}
        `;
        } else {
            query = `
                SELECT p.*, d.* ${docCol} 
                FROM office_premises p
                LEFT JOIN office_rental_details d ON p.premise_id = d.premise_id
                ${whereClause}
        `;
        }

        const [rows] = await db.execute(query, queryParams);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Premise not found' });

        const premiseData = rows[0];

        // Fetch Utilities
        const [utilRows] = await db.execute('SELECT * FROM office_premises_utilities WHERE premise_id = ?', [id]);
        premiseData.utilities = utilRows.length > 0 ? utilRows[0] : {};

        // Fetch Documents
        const [docRows] = await db.execute('SELECT * FROM office_premises_documents WHERE premise_id = ?', [id]);
        premiseData.documents = docRows.map(d => ({
            ...d,
            document_url: baseUrl + d.file_path
        }));

        // Fetch Dynamic Fields
        const [dynamicRows] = await db.execute('SELECT field_key, field_value FROM premises_module_details WHERE premise_id = ?', [id]);
        dynamicRows.forEach(row => {
            premiseData[row.field_key] = row.field_value;
        });

        res.json({ success: true, data: premiseData });

    } catch (error) {
        console.error('Error fetching premise:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add Document to Premise
exports.addPremiseDocument = async (req, res) => {
    const { id } = req.params;
    let companyId = req.companyId || (req.user && req.user.company_id);
    if (!companyId && req.user) {
        try {
            const [u] = await db.execute('SELECT company_id FROM users WHERE id = ?', [req.user.id]);
            if (u.length > 0) companyId = u[0].company_id;
        } catch (e) { }
    }

    const { name, content, mime_type } = req.body; // Expecting base64 content

    if (!name || !content) {
        return res.status(400).json({ success: false, message: 'Missing name or content' });
    }

    try {
        // Validate premise ownership
        const [check] = await db.execute('SELECT premise_id FROM office_premises WHERE premise_id = ? AND company_id = ?', [id, companyId]);
        if (check.length === 0) return res.status(404).json({ success: false, message: 'Premise not found' });

        // Save file
        const base64Data = content.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
        const uploadDir = path.join(__dirname, '../uploads/premises');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const uniqueName = `${Date.now()}_${name.replace(/\s+/g, '_')} `;
        const filePath = path.join(uploadDir, uniqueName);
        fs.writeFileSync(filePath, base64Data, 'base64');
        const relativePath = `/ uploads / premises / ${uniqueName} `;

        await db.execute(
            'INSERT INTO office_premises_documents (company_id, premise_id, file_name, file_path, mime_type) VALUES (?, ?, ?, ?, ?)',
            [companyId, id, name, relativePath, mime_type || 'application/octet-stream']
        );

        res.json({ success: true, message: 'Document added', path: relativePath });
    } catch (error) {
        console.error('Add document error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Helper to sanitize inputs
const toDbDate = (val) => (val && val !== '' ? val : null);
const toDbNum = (val) => (val && val !== '' && !isNaN(val) ? parseFloat(val) : 0);
const toDbInt = (val) => (val && val !== '' && !isNaN(val) ? parseInt(val, 10) : 0);
const toDbBool = (val) => (val ? 1 : 0);
const toDbStr = (val) => (val && val.trim() !== '' ? val.trim() : null);

// Create Premise
exports.createPremise = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let companyId = req.companyId || (req.user && req.user.company_id);
        // Robustness: Fetch if missing
        if (!companyId && req.user) {
            const [u] = await connection.execute('SELECT company_id FROM users WHERE id = ?', [req.user.id]);
            if (u.length > 0) companyId = u[0].company_id;
        }

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company Identification Missing. Please login again.' });
        }

        const body = req.body;

        console.log('Creating premise payload:', JSON.stringify(body, null, 2));

        // 1. Insert Base
        const insertBaseQuery = `INSERT INTO office_premises
            (company_id, premise_type, premises_name, building_name, premises_use, country, area_id, company_module_id, city, full_address, location_notes, status, document_name, document_path, document_mime, google_map_url, capacity, address_line2, landmark, parking_available, parking_area)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const baseParams = [
            companyId,
            body.premise_type,
            toDbStr(body.premises_name),
            toDbStr(body.building_name),
            toDbStr(body.premises_use),
            toDbStr(body.country),
            toDbInt(body.area_id),
            toDbInt(body.company_module_id),
            toDbStr(body.city),
            toDbStr(body.full_address),
            toDbStr(body.location_notes),
            body.status || 'ACTIVE',
            toDbStr(body.document_name),
            toDbStr(body.document_path),
            toDbStr(body.document_mime),
            toDbStr(body.google_map_url),
            toDbInt(body.capacity),
            toDbStr(body.address_line2),
            toDbStr(body.landmark),
            toDbBool(body.parking_available),
            toDbStr(body.parking_area)
        ];

        const [rows] = await connection.execute(insertBaseQuery + ' RETURNING premise_id', baseParams);
        const premiseId = rows[0].premise_id;

        // 2. Insert Details
        if (body.premise_type === 'OWNED' && body.owned) {
            const owned = body.owned;
            const insertOwnedQuery = `INSERT INTO office_owned_details
            (premise_id, buy_date, purchase_value, property_size_sqft, title_deed_ref, owner_name, renewal_required, renewal_date, insurance_required, insurance_expiry, notes, floors_count, depreciation_rate, electricity_available, water_available, internet_available)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const ownedParams = [
                premiseId,
                toDbDate(owned.buy_date),
                toDbNum(owned.purchase_value),
                toDbNum(owned.property_size_sqft),
                toDbStr(owned.title_deed_ref),
                toDbStr(owned.owner_name),
                toDbBool(owned.renewal_required),
                toDbDate(owned.renewal_date),
                toDbBool(owned.insurance_required),
                toDbDate(owned.insurance_expiry),
                toDbStr(owned.notes),
                toDbInt(owned.floors_count),
                toDbNum(owned.depreciation_rate),
                toDbBool(owned.electricity_available),
                toDbBool(owned.water_available),
                toDbBool(owned.internet_available)
            ];

            await connection.execute(insertOwnedQuery, ownedParams);

        } else if (body.premise_type === 'RENTAL' && body.rental) {
            const rental = body.rental;
            const insertRentalQuery = `INSERT INTO office_rental_details
            (premise_id, landlord_name, landlord_contact_person, landlord_phone, landlord_email, contract_start, contract_end, monthly_rent, yearly_rent, security_deposit, renewal_reminder_date, payment_frequency, next_payment_date, late_fee_terms, notes)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const rentalParams = [
                premiseId,
                toDbStr(rental.landlord_name),
                toDbStr(rental.landlord_contact_person),
                toDbStr(rental.landlord_phone),
                toDbStr(rental.landlord_email),
                toDbDate(rental.contract_start),
                toDbDate(rental.contract_end),
                toDbNum(rental.monthly_rent),
                toDbNum(rental.yearly_rent),
                toDbNum(rental.security_deposit),
                toDbDate(rental.renewal_reminder_date),
                rental.payment_frequency || 'MONTHLY',
                toDbDate(rental.next_payment_date),
                toDbStr(rental.late_fee_terms),
                toDbStr(rental.notes)
            ];

            await connection.execute(insertRentalQuery, rentalParams);
        }

        // 3. Insert Utilities
        if (body.utilities) {
            const utils = body.utilities;
            const insertUtilsQuery = `INSERT INTO office_premises_utilities
            (premise_id, company_id, electricity_no, water_no, internet_provider, utility_notes)
        VALUES(?, ?, ?, ?, ?, ?)`;
            await connection.execute(insertUtilsQuery, [
                premiseId, companyId,
                toDbStr(utils.electricity_no),
                toDbStr(utils.water_no),
                toDbStr(utils.internet_provider),
                toDbStr(utils.utility_notes)
            ]);
        }

        // 4. Insert Dynamic Fields
        console.log('[DEBUG] Create Body Keys:', Object.keys(body));
        const dynamicEntries = Object.entries(body).filter(([key, val]) => !EXCLUDED_KEYS.has(key) && val !== undefined && val !== null);
        console.log('[DEBUG] Dynamic Entries to Save:', dynamicEntries);
        if (dynamicEntries.length > 0) {
            const dynamicValues = dynamicEntries.map(([key, val]) => [premiseId, companyId, key, typeof val === 'object' ? JSON.stringify(val) : String(val)]);
            const placeholders = dynamicValues.map(() => '(?, ?, ?, ?)').join(', ');
            await connection.execute(
                `INSERT INTO premises_module_details(premise_id, company_id, field_key, field_value) VALUES ${placeholders} `,
                dynamicValues.flat()
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Premise created', data: { id: premiseId } });

    } catch (error) {
        await connection.rollback();
        console.error('CRITICAL DB ERROR (Create):', {
            message: error.message,
            code: error.code,
            sql: error.sql,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({
            success: false,
            message: 'Database error occurred',
            error: {
                code: error.code,
                sqlMessage: error.sqlMessage
            }
        });
    } finally {
        connection.release();
    }
};

// Update Premise
exports.updatePremise = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        let companyId = req.companyId || (req.user && req.user.company_id);
        // Robustness: Fetch if missing
        if (!companyId && req.user) {
            const [u] = await connection.execute('SELECT company_id FROM users WHERE id = ?', [req.user.id]);
            if (u.length > 0) companyId = u[0].company_id;
        }

        const body = req.body;

        console.log(`Updating premise ${id} payload: `, JSON.stringify(body, null, 2));

        // Verify ownership
        const [check] = await connection.execute(
            'SELECT premise_id FROM office_premises WHERE premise_id = ? AND company_id = ?',
            [id, companyId]
        );

        if (check.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Premise not found' });
        }

        // 1. Update Base
        const updateBaseQuery = `UPDATE office_premises SET
        premises_name =?, building_name =?, premises_use =?, country =?, area_id =?, company_module_id =?, city =?, full_address =?, location_notes =?, status =?,
            document_name =?, document_path =?, document_mime =?, google_map_url =?, capacity =?, address_line2 =?, landmark =?,
            parking_available =?, parking_area =?
                WHERE premise_id =? AND company_id =? `;

        const baseParams = [
            toDbStr(body.premises_name),
            toDbStr(body.building_name),
            toDbStr(body.premises_use),
            toDbStr(body.country),
            toDbInt(body.area_id),
            toDbInt(body.company_module_id),
            toDbStr(body.city),
            toDbStr(body.full_address),
            toDbStr(body.location_notes),
            body.status || 'ACTIVE',
            toDbStr(body.document_name),
            toDbStr(body.document_path),
            toDbStr(body.document_mime),
            toDbStr(body.google_map_url),
            toDbInt(body.capacity),
            toDbStr(body.address_line2),
            toDbStr(body.landmark),
            toDbBool(body.parking_available),
            toDbStr(body.parking_area),
            id, companyId
        ];

        await connection.execute(updateBaseQuery, baseParams);

        // 2. Update Details
        if (body.premise_type === 'OWNED' && body.owned) {
            const owned = body.owned;
            const updateOwnedQuery = `UPDATE office_owned_details SET
        buy_date =?, purchase_value =?, property_size_sqft =?, title_deed_ref =?, owner_name =?,
            renewal_required =?, renewal_date =?, insurance_required =?, insurance_expiry =?, notes =?,
            floors_count =?, depreciation_rate =?, electricity_available =?, water_available =?, internet_available =?
                WHERE premise_id =? `;

            const ownedParams = [
                toDbDate(owned.buy_date),
                toDbNum(owned.purchase_value),
                toDbNum(owned.property_size_sqft),
                toDbStr(owned.title_deed_ref),
                toDbStr(owned.owner_name),
                toDbBool(owned.renewal_required),
                toDbDate(owned.renewal_date),
                toDbBool(owned.insurance_required),
                toDbDate(owned.insurance_expiry),
                toDbStr(owned.notes),
                toDbInt(owned.floors_count),
                toDbNum(owned.depreciation_rate),
                toDbBool(owned.electricity_available),
                toDbBool(owned.water_available),
                toDbBool(owned.internet_available),
                id
            ];

            await connection.execute(updateOwnedQuery, ownedParams);

        } else if (body.premise_type === 'RENTAL' && body.rental) {
            const rental = body.rental;
            const updateRentalQuery = `UPDATE office_rental_details SET
        landlord_name =?, landlord_contact_person =?, landlord_phone =?, landlord_email =?,
            contract_start =?, contract_end =?, monthly_rent =?, yearly_rent =?, security_deposit =?,
            renewal_reminder_date =?, payment_frequency =?, next_payment_date =?, late_fee_terms =?, notes =?
                WHERE premise_id =? `;

            const rentalParams = [
                toDbStr(rental.landlord_name),
                toDbStr(rental.landlord_contact_person),
                toDbStr(rental.landlord_phone),
                toDbStr(rental.landlord_email),
                toDbDate(rental.contract_start),
                toDbDate(rental.contract_end),
                toDbNum(rental.monthly_rent),
                toDbNum(rental.yearly_rent),
                toDbNum(rental.security_deposit),
                toDbDate(rental.renewal_reminder_date),
                rental.payment_frequency || 'MONTHLY',
                toDbDate(rental.next_payment_date),
                toDbStr(rental.late_fee_terms),
                toDbStr(rental.notes),
                id
            ];

            await connection.execute(updateRentalQuery, rentalParams);
        }

        // 3. Update Utilities
        if (body.utilities) {
            const utils = body.utilities;
            // Check existence
            const [uCheck] = await connection.execute('SELECT premise_id FROM office_premises_utilities WHERE premise_id = ?', [id]);
            if (uCheck.length > 0) {
                await connection.execute(
                    `UPDATE office_premises_utilities SET electricity_no =?, water_no =?, internet_provider =?, utility_notes =? WHERE premise_id =? `,
                    [toDbStr(utils.electricity_no), toDbStr(utils.water_no), toDbStr(utils.internet_provider), toDbStr(utils.utility_notes), id]
                );
            } else {
                await connection.execute(
                    `INSERT INTO office_premises_utilities(premise_id, company_id, electricity_no, water_no, internet_provider, utility_notes) VALUES(?, ?, ?, ?, ?, ?)`,
                    [id, companyId, toDbStr(utils.electricity_no), toDbStr(utils.water_no), toDbStr(utils.internet_provider), toDbStr(utils.utility_notes)]
                );
            }
        }

        // 4. Update Dynamic Fields (Delete All + Insert)
        await connection.execute('DELETE FROM premises_module_details WHERE premise_id = ?', [id]);

        const dynamicEntries = Object.entries(body).filter(([key, val]) => !EXCLUDED_KEYS.has(key) && val !== undefined && val !== null);
        if (dynamicEntries.length > 0) {
            const dynamicValues = dynamicEntries.map(([key, val]) => [id, companyId, key, typeof val === 'object' ? JSON.stringify(val) : String(val)]);
            const placeholders = dynamicValues.map(() => '(?, ?, ?, ?)').join(', ');
            await connection.execute(
                `INSERT INTO premises_module_details(premise_id, company_id, field_key, field_value) VALUES ${placeholders} `,
                dynamicValues.flat()
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Premise updated' });

    } catch (error) {
        await connection.rollback();
        console.error('CRITICAL DB ERROR (Update):', {
            message: error.message,
            code: error.code,
            sql: error.sql,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({
            success: false,
            message: 'Update failed',
            error: {
                code: error.code,
                sqlMessage: error.sqlMessage
            }
        });
    } finally {
        connection.release();
    }
};

// Delete Premise
exports.deletePremise = async (req, res) => {
    const { id } = req.params;
    const companyId = req.companyId || (req.user && req.user.company_id);

    try {
        const [rows] = await db.execute(
            'DELETE FROM office_premises WHERE premise_id = ? AND company_id = ? RETURNING premise_id',
            [id, companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Premise not found' });
        }

        res.json({ success: true, message: 'Premise deleted' });
    } catch (error) {
        console.error('Error deleting premise:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



// Upload File (Base64 approach)
exports.uploadFile = async (req, res) => {
    try {
        const { name, content } = req.body; // content is base64 string
        if (!name || !content) {
            return res.status(400).json({ success: false, message: 'Missing name or content' });
        }

        // Clean base64 header if present (e.g. "data:application/pdf;base64,")
        const base64Data = content.replace(/^data:([A-Za-z-+\/]+);base64,/, '');

        // Ensure directory exists (recursively is safer)
        const uploadDir = path.join(__dirname, '../uploads/premises');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueName = `${Date.now()}_${name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, uniqueName);

        fs.writeFileSync(filePath, base64Data, 'base64');

        // Return relative path for DB
        const relativePath = `/uploads/premises/${uniqueName}`;
        res.json({ success: true, path: relativePath });

    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
};
exports.getPropertyTypes = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM property_types ORDER BY id');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
