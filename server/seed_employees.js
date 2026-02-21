const db = require('./config/db');

async function sedEmployees() {
    try {
        const companyId = 78;
        const employees = [
            ['John Doe', 'john.doe@hynccvcv.com', 'Manager', '+971 50 123 4567'],
            ['Jane Smith', 'jane.smith@hynccvcv.com', 'Supervisor', '+971 50 234 5678'],
            ['Robert Brown', 'robert.b@hynccvcv.com', 'Technician', '+971 50 345 6789']
        ];

        for (const [name, email, pos, phone] of employees) {
            await db.execute(
                'INSERT INTO employees (company_id, name, email, position, phone) VALUES (?, ?, ?, ?, ?)',
                [companyId, name, email, pos, phone]
            );
            console.log(`Inserted employee: ${name}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

sedEmployees();
