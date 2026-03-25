const fs = require('fs');
const path = require('path');

const filePath = 'd:\\Asset Web\\apps\\web\\src\\components\\modals\\VehicleWizardModal.js';

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Use regex to remove the block
    const regex = /\{!isConfigured && \([\s\S]*?Configuration Missing[\s\S]*?\}\)/m;

    if (regex.test(content)) {
        console.log("Match found!");
        content = content.replace(regex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Successfully removed the warning alert.");
    } else {
        console.log("No match found with regex.");
        // Try exact string match look
        const startStr = '{!isConfigured && (classification.country_id || classification.vehicle_usage_id)';
        const index = content.indexOf(startStr);
        if (index !== -1) {
            console.log("Alternative match found at", index);
        }
    }
} catch (e) {
    console.error(e);
}
