const fs = require('fs');
const path = 'd:\\Asset Web\\apps\\web\\src\\screens\\AssetsScreen.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    let lines = content.split('\n');

    const handleSaveIndex = lines.findIndex(l => l.includes('const handleSaveAsset = async'));
    const handleDeleteIndex = lines.findIndex(l => l.includes('const handleDelete = async'));

    if (handleSaveIndex > -1 && handleDeleteIndex > -1) {
        const repairChunk = `    const handleSaveAsset = async (newAsset) => {
        try {
            setLoading(true);
            const payload = {
                category_id: newAsset.category_id ? Number(newAsset.category_id) : null,
                asset_code: newAsset.asset_code || '',
                name: newAsset.name,
                sub_category: newAsset.sub_category || '',
                brand: newAsset.brand || '',
                model: newAsset.model || '',
                serial_number: newAsset.serial_number || '',
                purchase_date: newAsset.purchase_date || null,
                purchase_cost: newAsset.cost ? Number(newAsset.cost) : null,
                status: newAsset.status || 'AVAILABLE',
                location: '',
                notes: newAsset.description || '',
                quantity: newAsset.quantity ? Number(newAsset.quantity) : 1,
                current_holder_id: newAsset.current_holder_id ? Number(newAsset.current_holder_id) : null,
            };

            const response = selectedAsset
                ? await api.put(\`/assets/\${selectedAsset.id}\`, payload)
                : await api.post('/assets', payload);

            if (response.data.success) {
                fetchAssets();
            }
        } catch (error) {
            console.error('Error saving asset:', error);
        } finally {
            setModalVisible(false);
            setLoading(false);
        }
    };`;

        lines.splice(handleSaveIndex, handleDeleteIndex - handleSaveIndex, repairChunk + '\n\n');
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Success: Repaired handleSaveAsset flawlessly!');
    }
} catch (e) {
    console.error('Repair error:', e.message);
}
