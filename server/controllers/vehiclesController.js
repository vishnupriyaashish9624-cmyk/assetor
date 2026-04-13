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
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
        console.log('[VehiclesController] User Role:', req.user?.role, 'req.companyId:', req.companyId);

        let whereClause = 'WHERE 1=1';
        let params = [];

        // Allow filtering by a specific company if requested, otherwise show all vehicles for user's client
        if (req.query.company_id) {
            whereClause += ' AND v.company_id = ?';
            params.push(req.query.company_id);
        } else if (!isSuperAdmin && req.user?.client_id) {
            // COMPANY_ADMIN: only show vehicles from companies under their client group
            whereClause += ' AND v.company_id IN (SELECT id FROM companies WHERE client_id = ?)';
            params.push(req.user.client_id);
        }

        if (search) {
            whereClause += ' AND (v.vehicle_name ILIKE ? OR v.license_plate ILIKE ? OR v.driver ILIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        const countQuery = `SELECT COUNT(*) as total FROM vehicles v ${whereClause}`;
        const [countRows] = await db.execute(countQuery, params);
        const totalItems = parseInt(countRows[0]?.total || 0);

        const dataQuery = `
            SELECT 
                v.*, 
                c.country_name as country, 
                a.name as area, 
                pt.name as property_type_name, 
                pmt.type_name as vehicle_type_name, 
                v.region, 
                vu.name as vehicle_usage_name,
                co.name as company_name,
                COALESCE(vn.field_value, v.vehicle_name) as vehicle_name
            FROM vehicles v 
            LEFT JOIN countries c ON v.country_id = c.id
            LEFT JOIN area a ON v.area_id = a.id
            LEFT JOIN property_types pt ON v.property_type_id = pt.id
            LEFT JOIN premises_types pmt ON v.premises_type_id = pmt.id
            LEFT JOIN vehicle_usage vu ON v.vehicle_usage_id = vu.id
            LEFT JOIN companies co ON v.company_id = co.id
            LEFT JOIN LATERAL (
                SELECT field_value FROM vehicle_module_details 
                WHERE vehicle_id = v.vehicle_id AND field_key LIKE '%vehicle_name%'
                ORDER BY id DESC LIMIT 1
            ) vn ON true
            ${whereClause} 
            ORDER BY v.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(dataQuery, [...params, limitNum, offset]);
        console.log('[VehiclesController] Result rows count:', rows.length);
        if (rows.length > 0) console.log('[VehiclesController] Row 0 company:', rows[0].company_name);

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

        let companyId = req.companyId || (req.user && req.user.company_id) || 1;
        const body = req.body;

        // Allow overriding company_id from body
        if (body.company_id) {
            companyId = parseInt(body.company_id);
        }

        let finalVehicleName = body.vehicle_name || body.name;

        // Extract native vehicle fields that might be buried in 'secXXX_' namespaces
        // Field keys may have trailing underscores (e.g. sec125_vehicle_name_)
        Object.keys(body).forEach(key => {
            if (key.startsWith('sec') && key.includes('vehicle_name')) finalVehicleName = finalVehicleName || body[key];
            if (key.startsWith('sec') && (key.includes('license_plate') || key.includes('plate_no'))) body.license_plate = body.license_plate || body[key];
            if (key.startsWith('sec') && key.includes('_driver')) body.driver = body.driver || body[key];
            if (key.startsWith('sec') && key.includes('chassis_no')) body.chassis_no = body.chassis_no || body[key];
        });

        if (!finalVehicleName || finalVehicleName.trim() === '') {
            if (body.manufacturer && body.model) {
                finalVehicleName = `${body.manufacturer} ${body.model}`;
            } else if (body.asset_code) {
                finalVehicleName = `Vehicle ${body.asset_code}`;
            } else {
                finalVehicleName = `Vehicle-${Date.now().toString().slice(-6)}`;
            }
        }

        // 1. Check for duplicate (License Plate or Name)
        let duplicateQuery = 'SELECT vehicle_id FROM vehicles WHERE company_id = ? AND (';
        let duplicateParams = [companyId];
        let conditions = [];

        // Only check for duplicate name if it's explicitly provided by the user (not auto-generated by us)
        if (body.vehicle_name || body.name) {
            conditions.push('vehicle_name = ?');
            duplicateParams.push(finalVehicleName.trim());
        }

        if (body.license_plate && typeof body.license_plate === 'string' && body.license_plate.trim()) {
            conditions.push('license_plate = ?');
            duplicateParams.push(body.license_plate.trim());
        }

        let existing = [];
        if (conditions.length > 0) {
            duplicateQuery += conditions.join(' OR ') + ')';
            [existing] = await connection.execute(duplicateQuery, duplicateParams);
        }

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
                `SELECT f.field_key, f.meta_json, f.section_id
                 FROM module_section_fields f 
                 JOIN module_sections s ON f.section_id = s.id 
                 WHERE s.module_id IN (2, 6) AND f.field_type = 'auto_generated' AND (f.company_id = ? OR f.company_id = 1)`,
                [companyId]
            );

            for (const f of autoFields) {
                const compositeKey = `sec${f.section_id}_${f.field_key}`;
                // Check both raw and composite key
                const currentVal = body[compositeKey] || body[f.field_key];
                if (!currentVal || currentVal === '[SYSTEM GENERATED]') {
                    const meta = typeof f.meta_json === 'string' ? JSON.parse(f.meta_json) : (f.meta_json || {});
                    const generatedId = await generateAutoID(companyId, f.field_key, 'vehicle_module_details', 'v', meta.id_code, connection);
                    body[compositeKey] = generatedId;
                }
            }
        } catch (autoErr) {
            console.error('[createVehicle] Auto-ID generation failed:', autoErr);
        }

        const ensureInt = (val) => {
            if (val === undefined || val === null || val === '') return null;
            const n = parseInt(val);
            return isNaN(n) ? null : n;
        };

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
            finalVehicleName,
            body.license_plate !== undefined ? body.license_plate : null,
            body.type !== undefined ? body.type : null,
            body.driver !== undefined ? body.driver : null,
            body.status || 'ACTIVE',
            ensureInt(body.country_id),
            ensureInt(body.property_type_id),
            ensureInt(body.premises_type_id),
            ensureInt(body.area_id),
            body.vehicle_usage || body.usage || '',
            body.region !== undefined ? body.region : null,
            ensureInt(body.vehicle_usage_id)
        ];

        const [rows] = await connection.execute(insertQuery, params);
        const vehicleId = rows.insertId;

        // Dynamic Fields - Protect core fields from being duplicated or overwriting main table
        const excludedKeys = [
            'vehicle_name', 'name', 'license_plate', 'type', 'driver', 'status',
            'country_id', 'property_type_id', 'premises_type_id', 'area_id',
            'vehicle_usage', 'usage', 'images', 'vehicle_id', 'region',
            'vehicle_usage_id', 'company_id', 'created_at', 'updated_at'
        ];
        const dynamicEntries = Object.entries(body).filter(([key, val]) =>
            !excludedKeys.includes(key) &&
            val !== null &&
            val !== undefined &&
            val !== ''
        );

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
        require('fs').writeFileSync('last_error.txt', error.stack || String(error));
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

        let companyId = req.companyId || (req.user && req.user.company_id) || 1;
        const body = req.body;

        // Allow overriding company_id from body
        if (body.company_id) {
            companyId = parseInt(body.company_id);
        }

        // Safely resolve the real numeric vehicle ID
        // The URL param could accidentally be a string (like an auto-generated field value)
        let vehicleId = parseInt(id);
        if (isNaN(vehicleId) && body.vehicle_id) vehicleId = parseInt(body.vehicle_id);
        if (isNaN(vehicleId)) throw new Error(`Invalid vehicle ID: ${id}`);
        console.log('[updateVehicle] Resolved vehicleId:', vehicleId);

        const [existing] = await connection.execute('SELECT vehicle_name FROM vehicles WHERE vehicle_id = ?', [vehicleId]);
        if (existing.length === 0) throw new Error('Vehicle not found');

        let finalVehicleName = body.vehicle_name || body.name;

        // Extract native vehicle fields that might be buried in 'secXXX_' namespaces
        // Field keys may have trailing underscores (e.g. sec125_vehicle_name_)
        Object.keys(body).forEach(key => {
            if (key.startsWith('sec') && key.includes('vehicle_name')) finalVehicleName = finalVehicleName || body[key];
            if (key.startsWith('sec') && (key.includes('license_plate') || key.includes('plate_no'))) body.license_plate = body.license_plate || body[key];
            if (key.startsWith('sec') && key.includes('_driver')) body.driver = body.driver || body[key];
            if (key.startsWith('sec') && key.includes('chassis_no')) body.chassis_no = body.chassis_no || body[key];
        });

        if (!finalVehicleName || finalVehicleName.trim() === '') {
            if (body.manufacturer && body.model) {
                finalVehicleName = `${body.manufacturer} ${body.model}`;
            } else if (body.asset_code) {
                finalVehicleName = `Vehicle ${body.asset_code}`;
            } else {
                finalVehicleName = existing[0].vehicle_name || `Vehicle-${Date.now().toString().slice(-6)}`;
            }
        }

        const ensureInt = (val) => {
            if (val === undefined || val === null || val === '') return null;
            const n = parseInt(val);
            return isNaN(n) ? null : n;
        };

        const updateQuery = `
            UPDATE vehicles SET
                vehicle_name = ?, license_plate = ?, type = ?, driver = ?, status = ?,
                country_id = ?, property_type_id = ?, premises_type_id = ?, area_id = ?,
                vehicle_usage = ?, region = ?, vehicle_usage_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE vehicle_id = ? AND company_id = ?
        `;
        const params = [
            finalVehicleName,
            body.license_plate !== undefined ? body.license_plate : null,
            body.type !== undefined ? body.type : null,
            body.driver !== undefined ? body.driver : null,
            body.status || 'ACTIVE',
            ensureInt(body.country_id),
            ensureInt(body.property_type_id),
            ensureInt(body.premises_type_id),
            ensureInt(body.area_id),
            body.vehicle_usage || body.usage || '',
            body.region !== undefined ? body.region : null,
            ensureInt(body.vehicle_usage_id),
            vehicleId,
            companyId
        ];

        await connection.execute(updateQuery, params);

        // Update Dynamic Fields
        await connection.execute('DELETE FROM vehicle_module_details WHERE vehicle_id = ?', [vehicleId]);
        const excludedKeys = [
            'vehicle_name', 'name', 'license_plate', 'type', 'driver', 'status',
            'country_id', 'property_type_id', 'premises_type_id', 'area_id',
            'vehicle_usage', 'usage', 'images', 'vehicle_id', 'region',
            'vehicle_usage_id', 'company_id', 'created_at', 'updated_at'
        ];
        const dynamicEntries = Object.entries(body).filter(([key, val]) =>
            !excludedKeys.includes(key) &&
            val !== null &&
            val !== undefined &&
            val !== ''
        );

        if (dynamicEntries.length > 0) {
            for (const [key, value] of dynamicEntries) {
                await connection.execute(
                    'INSERT INTO vehicle_module_details (vehicle_id, company_id, field_key, field_value) VALUES (?, ?, ?, ?)',
                    [vehicleId, companyId, key, String(value)]
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
