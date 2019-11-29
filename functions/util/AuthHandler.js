const crypto = require('crypto');

exports.setPassword = function (password) {
    // Hashing user's salt and password with 1000 iterations, 64 length and sha512 digest
    const salt = crypto.randomBytes(16).toString('hex');
    return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
};
