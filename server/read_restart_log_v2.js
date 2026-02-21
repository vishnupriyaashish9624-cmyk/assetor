const fs = require('fs');
const path = 'server_restart.log';
let data = '';
try {
    data = fs.readFileSync(path, 'utf16le');
} catch (e) {
    data = fs.readFileSync(path, 'utf8');
}
console.log(data.split('\n').slice(-50).join('\n'));
