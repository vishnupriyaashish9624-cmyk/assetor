const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config();

const secret = process.env.JWT_SECRET;
const payload = {
    id: 6, // Superadmin ID from my previous check
    email: 'superadmin@trakio.com',
    role: 'SUPER_ADMIN',
    company_id: 1
};

const token = jwt.sign(payload, secret);

const options = {
    hostname: 'localhost',
    port: 5032,
    path: '/api/company-modules',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    console.log(`Status: ${res.statusCode}`);
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
    process.exit(1);
});

req.end();
