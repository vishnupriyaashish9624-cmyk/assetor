const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/departments?company_id=X
router.get('/', async (req, res) => {
    try {
        const { company_id } = req.query;
        let sql = 'SELECT id, name, code, company_id FROM departments';
        const params = [];

        if (company_id) {
            sql += ' WHERE company_id = ?';
            params.push(company_id);
        }

        sql += ' ORDER BY name ASC';
        const [rows] = await db.execute(sql, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[Departments] GET error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/departments
router.post('/', async (req, res) => {
    try {
        const { name, code, company_id } = req.body;
        if (!name || !company_id) {
            return res.status(400).json({ success: false, message: 'name and company_id are required' });
        }
        const [result] = await db.execute(
            'INSERT INTO departments (name, code, company_id) VALUES (?, ?, ?) RETURNING id',
            [name, code || null, company_id]
        );
        res.status(201).json({ success: true, data: { id: result[0].id, name, code, company_id } });
    } catch (error) {
        console.error('[Departments] POST error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/departments/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Department deleted' });
    } catch (error) {
        console.error('[Departments] DELETE error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
