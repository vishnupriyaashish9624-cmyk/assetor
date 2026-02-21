const fs = require('fs');
const data = fs.readFileSync('server_debug.log', 'utf8');
console.log(data);
