const fs = require('fs');
try {
    const data = fs.readFileSync('server_restart.log', 'utf16le');
    console.log(data);
} catch (e) {
    console.log(fs.readFileSync('server_restart.log', 'utf8'));
}
