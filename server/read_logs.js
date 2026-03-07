const fs = require('fs');
const content = fs.readFileSync('server_stdout.log', 'utf8');
const searchString = 'CRITICAL DB ERROR';
let index = content.indexOf(searchString);
while (index !== -1) {
    console.log('--- ERROR START ---');
    console.log(content.substring(index, index + 1000));
    console.log('--- ERROR END ---');
    index = content.indexOf(searchString, index + 1);
}
