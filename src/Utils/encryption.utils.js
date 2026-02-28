import crypto from "node:crypto";
import fs from "node:fs";

const ENCRYPTION_SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY)
const IV_LENGTH = process.env.IV_LENGTH

export const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_SECRET_KEY, iv);

    let encryptedData = cipher.update(text, 'utf-8', 'hex');

    encryptedData += cipher.final('hex');

    return `${iv.toString('hex')}:${encryptedData}`;
}

export const decrypt = (encryptData) => {

    const [iv, encryptedText] = encryptData.split(':');

    const binaryLikeIv = Buffer.from(iv, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_SECRET_KEY, binaryLikeIv);

    let decryptedData = decipher.update(encryptedData, 'hex', 'utf-8');

    decryptedData += decipher.final('utf-8');

    return decryptedData

}


if (fs.existsSync('publicKey.pem') && fs.existsSync('privateKey.pem')) {

    console.log('Keys already exist');

} else {

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {

        modulusLength: 2048,

        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        }

    })

    fs.writeFileSync('publicKey.pem', publicKey);
    fs.writeFileSync('privateKey.pem', privateKey);
}


export const assymetricEncryption = (text) => {

    const publicKey = fs.readFileSync('publicKey.pem', 'utf-8');
    const bufferedText = Buffer.from(text);

    const encryptedData = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        bufferedText
    )

    return encryptedData.toString('hex');
}

export const assymetricDecryption = (text) => {

    const privateKey = fs.readFileSync('privateKey.pem', 'utf-8');

    const bufferedText = Buffer.from(text, 'hex');

    const decryptedData = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        bufferedText
    )

    return decryptedData.toString('utf-8');
}
