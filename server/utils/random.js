const crypto = require('crypto');

function generateTempPassword(length = 10) {
    // easy-to-type: no confusing chars (0/O, 1/l/I)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
    return out;
}

function generateToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { generateTempPassword, generateToken };
