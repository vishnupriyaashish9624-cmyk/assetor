const fs = require('fs');
const log = fs.readFileSync('requests_debug.log', 'utf8').split('\n');
console.log(log.slice(-50).join('\n'));
