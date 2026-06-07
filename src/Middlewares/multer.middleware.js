import multer from "multer";
import fs from "node:fs";
import { fileTypes, allowedFileExtensions } from "../Common/constants/files.constants.js";

// Function to check if folder exists, otherwise create it
function checkOrCreateFolder(folderPath) {
    console.log(`The folder path is ${folderPath}`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

// Upload locally
export const localUpload = ({ folderPath = "samples", limits = {} }) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const fileDir = `uploads/${folderPath}`;
            checkOrCreateFolder(fileDir);
            cb(null, fileDir);
        },
        filename: (req, file, cb) => {
            console.log("File info before uploading:", file);
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            cb(null, `${uniqueSuffix}__${file.originalname}`);
        }
    });

    const fileFilter = (req, file, cb) => {

        const fileKey = file.mimetype.split("/")[0]
        const fileType = fileTypes[fileKey.toUpperCase()]

        if (!fileType) return cb(new Error("Invalid file type"), false)

        const fileExtension = file.mimetype.split("/")[1]
        if (!allowedFileExtensions[fileKey].includes(fileExtension)) return cb(new Error("Invalid file extension"), false)

        return cb(null, true)

    }


    return multer({ limits, fileFilter, storage });
};


// Upload Hosted
export const hostUpload = ({ limits = {} }) => {

    const storage = multer.diskStorage({})
    const fileFilter = (req, file, cb) => {

        const fileKey = file.mimetype.split("/")[0]
        const fileType = fileTypes[fileKey.toUpperCase()]

        if (!fileType) return cb(new Error("Invalid file type"), false)

        const fileExtension = file.mimetype.split("/")[1]
        if (!allowedFileExtensions[fileKey].includes(fileExtension)) return cb(new Error("Invalid file extension"), false)

        return cb(null, true)
    }


    return multer({ limits, fileFilter, storage });
};