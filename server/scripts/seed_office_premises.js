const db = require('../config/db');

async function seed() {
    try {
        const connection = await db.getConnection();
        console.log("Seeding SRS Office Premises...");

        // 1. Get a company_id
        const [companies] = await connection.execute('SELECT id FROM companies LIMIT 1');
        if (companies.length === 0) {
            console.error("No companies found!");
            process.exit(1);
        }
        const companyId = companies[0].id;
        console.log(`Using Company ID: ${companyId}`);

        // 2. Insert Owned 1 (HQ)
        const [res1] = await connection.execute(`
            INSERT INTO office_premises (company_id, premise_type, premises_name, building_name, premises_use, country, city, full_address, address_line1, address_line2, landmark, area_sqft, floors, status, capacity)
            VALUES (?, 'OWNED', 'Global HQ', 'Sky Tower', 'OFFICE', 'UAE', 'Dubai', 'Downtown Dubai', 'Downtown Dubai', 'Level 42', 'Burj Khalifa', 15000.00, 4, 'ACTIVE', 200)
        `, [companyId]);
        const id1 = res1.insertId;





        await connection.execute(`
            INSERT INTO office_owned_details (premise_id, ownership_type, buy_date, purchase_value, vendor_name, warranty_end_date, insurance_expiry, depreciation_percent, electricity_available)
            VALUES (?, 'FREEHOLD', '2020-01-15', 5000000.00, 'Emaar Properties', '2030-01-15', '2026-01-15', 2.5, 1)
        `, [id1]);

        await connection.execute(`
            INSERT INTO office_premises_utilities (premise_id, company_id, electricity_no, water_no, internet_provider, utility_notes)
            VALUES (?, ?, 'DEWA-123456', 'DEWA-789012', 'Etisalat', 'Fiber connection active')
        `, [id1, companyId]);

        await connection.execute(`
            INSERT INTO office_premises_documents (company_id, premise_id, file_name, file_path, mime_type)
            VALUES (?, ?, 'Title_Deed.pdf', '/uploads/seed/title_deed_hq.pdf', 'application/pdf')
        `, [companyId, id1]);

        // 3. Insert Owned 2 (Warehouse)
        const [res2] = await connection.execute(`
            INSERT INTO office_premises (company_id, premise_type, premises_name, building_name, premises_use, country, city, full_address, address_line1, landmark, area_sqft, floors, status)
            VALUES (?, 'OWNED', 'Main Warehouse', 'Industrial Park B', 'WAREHOUSE', 'UAE', 'Sharjah', 'Industrial Area 13', 'Industrial Area 13', 'Near Caterpillar', 50000.00, 1, 'ACTIVE')
        `, [companyId]);
        const id2 = res2.insertId;

        await connection.execute(`
            INSERT INTO office_owned_details (premise_id, ownership_type, buy_date, purchase_value, vendor_name, depreciation_percent)
            VALUES (?, 'LEASEHOLD', '2019-06-01', 2000000.00, 'Shj Municipality', 5.0)
        `, [id2]);

        // 4. Insert Rental 1 (Branch)
        const [res3] = await connection.execute(`
            INSERT INTO office_premises (company_id, premise_type, premises_name, building_name, premises_use, country, city, full_address, address_line1, status, capacity)
            VALUES (?, 'RENTAL', 'Abu Dhabi Branch', 'Al Mamoura', 'OFFICE', 'UAE', 'Abu Dhabi', 'Al Muroor Rd', 'Al Muroor Rd', 'ACTIVE', 50)
        `, [companyId]);
        const id3 = res3.insertId;

        await connection.execute(`
            INSERT INTO office_rental_details (premise_id, landlord_name, landlord_email, lease_start_date, lease_end_date, rent_amount, payment_cycle, deposit_amount)
            VALUES (?, 'AD Commercial', 'rent@adcommercial.ae', '2024-01-01', '2025-01-01', 120000.00, 'YEARLY', 10000.00)
        `, [id3]);

        await connection.execute(`
            INSERT INTO office_premises_utilities (premise_id, company_id, electricity_no)
            VALUES (?, ?, 'ADDC-998877')
        `, [id3, companyId]);

        console.log("Seeding Complete.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
}

seed();
