const db = require('./config/db');
db.execute('SELECT host, username, from_email FROM smtp_configs WHERE is_active = true').then(([r]) => {
    console.log('HOST:', r[0].host);
    console.log('USER:', r[0].username);
    console.log('FROM:', r[0].from_email);
    process.exit(0);
});
