const db = require('../config/db');

/**
 * Generates an auto-sequential ID based on the format [COMPANY]-[YEAR]-[DAY]-[MONTH]-[XXX]
 */
const generateAutoID = async (
    companyId,
    fieldKey,
    detailTable,
    modulePrefix = 'p',
    idCode = null,
    connection = null
) => {
    const ids = await generateNextIDs(companyId, fieldKey, detailTable, 1, modulePrefix, idCode, connection);
    return ids[0];
};

/**
 * Generates multiple auto-sequential IDs
 */
const generateNextIDs = async (
    companyId,
    fieldKey,
    detailTable,
    count = 1,
    modulePrefix = 'p',
    idCode = null,
    connection = null
) => {
    const dbClient = connection || db;
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    let finalCode = idCode;
    if (!finalCode) {
        if (modulePrefix.toLowerCase() === 'v') finalCode = 'VH';
        else if (modulePrefix.toLowerCase() === 'p') finalCode = 'PR';
        else finalCode = modulePrefix.substring(0, 2).toUpperCase() || 'AS';
    }

    const prefixPart = `${finalCode}-${year}-${day}-${month}`;
    const searchPattern = `${prefixPart}-%`;

    try {
        const [last] = await dbClient.execute(
            `SELECT field_value FROM ${detailTable} 
             WHERE field_value LIKE ? 
             ORDER BY field_value DESC LIMIT 1`,
            [searchPattern]
        );

        let startCounter = 1;
        if (last.length > 0) {
            const lastValue = last[0].field_value;
            const parts = lastValue.split('-');
            const lastCounter = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastCounter)) {
                startCounter = lastCounter + 1;
            }
        }

        const ids = [];
        for (let i = 0; i < count; i++) {
            ids.push(`${prefixPart}-${String(startCounter + i).padStart(3, '0')}`);
        }
        return ids;
    } catch (error) {
        console.error('[generateNextIDs] Query Error:', error);
        return Array.from({ length: count }, (_, i) =>
            `${prefixPart}-${String(i + 1).padStart(3, '0')}`
        );
    }
};

const generateFileName = async (moduleName, companyId, detailTable, originalName = 'document.pdf', customDate = null) => {
    const now = customDate ? new Date(customDate) : new Date();
    // Validate date
    const finalDate = isNaN(now.getTime()) ? new Date() : now;

    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, '0');
    const day = String(finalDate.getDate()).padStart(2, '0');
    const datePart = `${year}-${month}-${day}`;

    // Prefix mapping: Premises/Asset -> premises, Vehicle -> v
    const modChar = (moduleName || '').toLowerCase().startsWith('v') ? 'v' : 'premises';

    // Target Format: premises-YYYY-MM-DD-XXX
    const prefix = `${modChar}-${datePart}`;
    const pattern = `%${prefix}-%`;
    const ext = originalName.split('.').pop();
    console.log('[generateFileName] Target:', { prefix, pattern, moduleName, companyId });

    try {
        const [last] = await db.execute(
            `SELECT field_value FROM ${detailTable} WHERE company_id = ? AND field_value LIKE ? ORDER BY field_value DESC LIMIT 1`,
            [companyId, pattern]
        );

        let counter = 100;
        if (last.length > 0) {
            const val = last[0].field_value;
            // Expected format: /uploads/.../p-YY-MM-DD-XXX.pdf
            const namePart = val.split('/').pop().split('.')[0];
            const parts = namePart.split('-');
            const lastCounter = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastCounter)) {
                counter = lastCounter + 1;
            }
        }

        return `${prefix}-${String(counter).padStart(3, '0')}.${ext}`;
    } catch (error) {
        console.error('Error generating file name:', error);
        return `${prefix}-${Math.floor(100 + Math.random() * 899)}.${ext}`;
    }
};

module.exports = {
    generateAutoID,
    generateNextIDs,
    generateFileName
};
