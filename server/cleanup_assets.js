const fs = require('fs');
const path = 'd:\\Asset Web\\apps\\web\\src\\screens\\AssetsScreen.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    let lines = content.split('\n');

    const brokenIndex = lines.findIndex(l => l.includes('onEditPress={() => setViewMode(false)}'));
    if (brokenIndex > -1) {
        lines.splice(brokenIndex, 2);
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Cleaned up broken layout triggers!');
    } else {
        console.log('Broken layout not found!');
    }
} catch (e) {
    console.error('Cleanup error:', e.message);
}
