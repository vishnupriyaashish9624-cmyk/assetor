import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generates an auto-incrementing alphabetic code (AAA -> ZZZ)
 * @param {string} code Current 3-letter code
 * @returns {string} Next 3-letter code
 */
export const incrementAlphaCode = (code) => {
    if (!code || code.length !== 3) return 'AAA';

    let chars = code.split('');
    for (let i = chars.length - 1; i >= 0; i--) {
        if (chars[i] === 'Z') {
            chars[i] = 'A';
            if (i === 0) return 'AAA'; // Overflow back to AAA
        } else {
            chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
            return chars.join('');
        }
    }
    return 'AAA';
};

/**
 * Generates a Premises ID in format {prefix}-PR-{YY}-{MM}-{XXX}
 * @param {string} prefix Company prefix (e.g. COMP, ACME)
 * @param {Date} date optional date to use for YY and MM
 * @returns {Promise<string>}
 */
export const generatePremisesId = async (prefix = null, date = new Date()) => {
    try {
        // 1. Get Prefix from param, AsyncStorage, or default to 'COMP'
        const effectivePrefix = prefix || (await AsyncStorage.getItem('company_prefix')) || (await AsyncStorage.getItem('company_code')) || 'COMP';

        // 2. Get Date info
        const yyyy = String(date.getFullYear());
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        // 3. Get last used code for this prefix+year+month+day
        const counterKey = `premises_counter_${effectivePrefix}_${yyyy}_${mm}_${dd}`;
        const lastCode = await AsyncStorage.getItem(counterKey);

        // If no last code, start at AAA.
        const currentCode = lastCode || 'AAA';

        return `${effectivePrefix}-PR-${yyyy}-${mm}-${dd}-${currentCode}`;
    } catch (error) {
        console.error('Error generating Premises ID:', error);
        return 'COMP-PR-2026-02-26-AAA'; // Safe fallback
    }
};

/**
 * Saves the current code and prepares for the next one
 * This should be called after a successful save of a premises.
 */
export const commitPremisesId = async (id) => {
    try {
        const parts = id.split('-');
        if (parts.length < 6) return;

        // Count from the END to handle prefixes with hyphens
        const code = parts[parts.length - 1];
        const dd = parts[parts.length - 2];
        const mm = parts[parts.length - 3];
        const yyyy = parts[parts.length - 4];
        // The prefix is everything before the last 5 parts joined by hyphens
        const prefix = parts.slice(0, parts.length - 5).join('-');

        const nextCode = incrementAlphaCode(code);
        const counterKey = `premises_counter_${prefix}_${yyyy}_${mm}_${dd}`;

        await AsyncStorage.setItem(counterKey, nextCode);
    } catch (error) {
        console.error('Error committing Premises ID:', error);
    }
};
