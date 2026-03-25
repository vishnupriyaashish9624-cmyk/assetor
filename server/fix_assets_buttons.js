const fs = require('fs');
const path = 'd:\\Asset Web\\apps\\web\\src\\screens\\AssetsScreen.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    let lines = content.split('\n');

    const deleteIndex = lines.findIndex(l => l.includes('icon="delete-outline"'));
    const importIndex = lines.findIndex(l => l.includes("import AssetFormModal"));

    if (deleteIndex > -1) {
        // 1. Insert buttons before IconButton
        const spaces = lines[deleteIndex].match(/^\s*/)[0];
        lines.splice(deleteIndex - 1, 0,
            `${spaces}{asset.status === 'AVAILABLE' ? (
${spaces}    <IconButton icon="account-arrow-right" size={18} iconColor="#10B981" style={{ margin: 0 }}  onPress={() => { setSelectedAsset(asset); setAssignModalVisible(true); }} />
${spaces}) : (
${spaces}    <IconButton icon="account-arrow-left" size={18} iconColor="#F59E0B" style={{ margin: 0 }} onPress={() => handleReturnAsset(asset.id)} />
${spaces})}`
        );
        console.log('Injected Assign Buttons!');
    }

    if (importIndex > -1) {
        lines.splice(importIndex + 1, 0, "import AssignAssetModal from '../components/AssignAssetModal';");
        console.log('Injected AssignAssetModal Import!');
    }

    // Fix Modal layout hanging
    const modalIndex = lines.findIndex(l => l.includes('<AssignAssetModal'));
    if (modalIndex > -1) {
        // Fix the dangling layout if step 856 left junk
        if (lines[modalIndex + 5] && lines[modalIndex + 5].includes('onEditPress')) {
            lines.splice(modalIndex + 5, 1);
            console.log('Fixed hanging onEditPress layout bugs!');
        }
    }

    fs.writeFileSync(path, lines.join('\n'));
} catch (e) {
    console.error('Script error:', e.message);
}
