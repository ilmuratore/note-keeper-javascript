const crypto = require('crypto');

const generateEncryptionKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

const encryptionKey = generateEncryptionKey();
console.log('Encryption Key: ' , encryptionKey);