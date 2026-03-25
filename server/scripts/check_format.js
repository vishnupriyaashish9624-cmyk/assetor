const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'apps', 'web', 'src', 'components', 'modals', 'VehicleWizardModal.js');

try {
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.split('\n');
    lines.forEach((line, index) => {
        const tr = line.trim();
        if (tr.includes('<Dialog') || tr.includes('AlertDialog')) {
            console.log(`[FOUND] Line ${index + 1}: ${tr}`);
        }
    });
} catch (e) {
    console.error(e);
}
