const db = require('../config/db');
const { generateAutoID } = require('../utils/idGenerator');

// List Vehicles
exports.getVehicles = async (req, res) => {
    const { search, page, limit } = req.query;
    const companyId = req.companyId || (req.user && req.user.company_id) || 1;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    try {
        let whereClause = 'WHERE v.company_id = ?';
        let params = [companyId];

        if (search) {
            whereClause += ' AND (v.vehicle_name ILIKE ? OR v.license_plate ILIKE ? OR v.driver ILIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        const countQuery = `SELECT COUNT(*) as total FROM vehicles v ${whereClause}`;
        const [countRows] = await db.execute(countQuery, params);
        const totalItems = parseInt(countRows[0]?.total || 0);

        const dataQuery = `
            SELECT v.*, c.country_name as country, a.name as area, pt.name as property_type_name, pmt.type_name as vehicle_type_name, v.region, vu.name as vehicle_usage_name
            FROM vehicles v 
            LEFT JOIN countries c ON v.country_id = c.id
            LEFT JOIN area a ON v.area_id = a.id
            LEFT JOIN property_types pt ON v.property_type_id = pt.id
            LEFT JOIN premises_types pmt ON v.premises_type_id = pmt.id
            LEFT JOIN vehicle_usage vu ON v.vehicle_usage_id = vu.id
            ${whereClause} 
            ORDER BY v.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(dataQuery, [...params, limitNum, offset]);

        res.json({
            success: true,
            data: rows,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limitNum),
                currentPage: pageNum,
                itemsPerPage: limitNum
            }
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create Vehicle
exports.createVehicle = async (req, res) => {
    console.log('[VehiclesController] createVehicle called with body:', JSON.stringify(req.body));
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const companyId = req.companyId || (req.user && req.user.company_id) || 1;
        const body = req.body;

        // 1. Check for duplicate (License Plate or Name)
        let duplicateQuery = 'SELECT vehicle_id FROM vehicles WHERE company_id = ? AND (vehicle_name = ?';
        let duplicateParams = [companyId, body.vehicle_name || body.name];

        if (body.license_plate && body.license_plate.trim()) {
            duplicateQuery += ' OR license_plate = ?';
            duplicateParams.push(body.license_plate.trim());
        }
        duplicateQuery += ')';

        const [existing] = await connection.execute(duplicateQuery, duplicateParams);

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'A vehicle with this name or license plate already exists in your company.'
            });
        }

        // Auto-generate IDs for relevant fields
        try {
            const [autoFields] = await connection.execute(
                `SELECT f.field_key, f.meta_json 
                 FROM module_section_fields f 
                 JOIN module_sections s ON f.section_id = s.id 
                 WHERE s.module_id = 2 AND f.field_type = 'auto_generated' AND (f.company_id = ? OR f.company_id = 1)`,
                [companyId]
            );

            for (const f of autoFields) {
                if (!body[f.field_key] || body[f.field_key] === '[SYSTEM GENERATED]') {
                    const meta = typeof f.meta_json === 'string' ? JSON.parse(f.meta_json) : (f.meta_json || {});
                    body[f.field_key] = await generateAutoID(companyId, f.field_key, 'vehicle_module_details', 'v', meta.id_code, connection);
                }
            }
        } catch (autoErr) {
            console.error('[createVehicle] Auto-ID generation failed:', autoErr);
        }

        const insertQuery = `
            INSERT INTO vehicles (
                company_id, vehicle_name, license_plate, type, driver, status, 
                country_id, property_type_id, premises_type_id, area_id, vehicle_usage, region, vehicle_usage_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING vehicle_id
        `;
        const params = [
            companyId,
            body.vehicle_name || body.name,
            body.license_plate,
            body.type,
            body.driver,
            body.status || 'ACTIVE',
            body.country_id,
            body.property_type_id,
            body.premises_type_id,
            body.area_id,
            body.vehicle_usage || body.usage || '',
            body.region,
            body.vehicle_usage_id
        ];

        const [rows] = await connection.execute(insertQuery, params);
        const vehicleId = rows.insertId;

        // Dynamic Fields
        const excludedKeys = ['vehicle_name', 'name', 'license_plate', 'type', 'driver', 'status', 'country_id', 'property_type_id', 'premises_type_id', 'area_id', 'vehicle_usage', 'usage', 'images', 'vehicle_id'];
        const dynamicEntries = Object.entries(body).filter(([key, val]) => !excludedKeys.includes(key) && val !== null && val !== undefined);

        if (dynamicEntries.length > 0) {
            for (const [key, value] of dynamicEntries) {
                await connection.execute(
                    'INSERT INTO vehicle_module_details (vehicle_id, company_id, field_key, field_value) VALUES (?, ?, ?, ?)',
                    [vehicleId, companyId, key, String(value)]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Vehicle created successfully', data: { id: vehicleId } });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating vehicle:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    } finally {
        connection.release();
    }
};

// Get Single Vehicle
exports.getVehicleById = async (req, res) => {
    const { id } = req.params;
    const companyId = req.companyId || (req.user && req.user.company_id) || 1;

    try {
        const [rows] = await db.execute('SELECT * FROM vehicles WHERE vehicle_id = ? AND company_id = ?', [id, companyId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });

        const vehicle = rows[0];

        // Load dynamic fields
        const [details] = await db.execute('SELECT field_key, field_value FROM vehicle_module_details WHERE vehicle_id = ?', [id]);
        details.forEach(d => {
            vehicle[d.field_key] = d.field_value;
        });

        res.json({ success: true, data: vehicle });
    } catch (error) {
        console.error('Error fetching vehicle detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update Vehicle
exports.updateVehicle = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const companyId = req.companyId || (req.user && req.user.company_id) || 1;
        const body = req.body;

        const updateQuery = `
            UPDATE vehicles SET
                vehicle_name = ?, license_plate = ?, type = ?, driver = ?, status = ?,
                country_id = ?, property_type_id = ?, premises_type_id = ?, area_id = ?,
                vehicle_usage = ?, region = ?, vehicle_usage_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE vehicle_id = ? AND company_id = ?
        `;
        const params = [
            body.vehicle_name || body.name,
            body.license_plate,
            body.type,
            body.driver,
            body.status,
            body.country_id,
            body.property_type_id,
            body.premises_type_id,
            body.area_id,
            body.vehicle_usage || body.usage || '',
            body.region,
            body.vehicle_usage_id,
            id,
            companyId
        ];

        await connection.execute(updateQuery, params);

        // Update Dynamic Fields
        await connection.execute('DELETE FROM vehicle_module_details WHERE vehicle_id = ?', [id]);
        const excludedKeys = ['vehicle_name', 'name', 'license_plate', 'type', 'driver', 'status', 'country_id', 'property_type_id', 'premises_type_id', 'area_id', 'vehicle_usage', 'usage', 'images', 'vehicle_id', 'region'];
        const dynamicEntries = Object.entries(body).filter(([key, val]) => !excludedKeys.includes(key) && val !== null && val !== undefined);

        if (dynamicEntries.length > 0) {
            for (const [key, value] of dynamicEntries) {
                await connection.execute(
                    'INSERT INTO vehicle_module_details (vehicle_id, company_id, field_key, field_value) VALUES (?, ?, ?, ?)',
                    [id, companyId, key, String(value)]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Vehicle updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating vehicle:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};

// Delete Vehicle
exports.deleteVehicle = async (req, res) => {
    const { id } = req.params;
    const companyId = req.companyId || (req.user && req.user.company_id) || 1;

    try {
        const [result] = await db.execute('DELETE FROM vehicles WHERE vehicle_id = ? AND company_id = ?', [id, companyId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });

        res.json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Vehicle Usage Options
exports.getUsageOptions = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM vehicle_usage ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching usage options:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
