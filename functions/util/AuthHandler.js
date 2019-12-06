const crypto = require('crypto');

/**
 * Method to set salt and hash the password for a user.
 * setPassword method first creates a salt unique for every user,
 * then it hashes the salt with user password and creates a hash.
 * This hash is stored in the database as user password
 */
exports.getPasswordHash = function (password, salt) {
    // Hashing user's salt and password with 1000 iterations, 64 length and sha512 digest
    return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
};

exports.getPasswordSalt = function(){
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Method to validate password.
 * It takes the user password from the request and salt from user database entry
 * It then hashes user password and salt,
 * then checks if this generated hash is equal to user's hash in the database or not.
 * If the user's hash is equal to generated hash, then the password is correct otherwise not
 */

exports.validatePassword = function (password) {
    let hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, `sha512`).toString(`hex`);
    return this.hash === hash;
};
