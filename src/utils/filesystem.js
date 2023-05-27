const fs = require('fs')

exports.getFileDate = () => new Date().toISOString().replace(/[\-:]/g, '').replace('T', "_").split('.')[0]

exports.saveFile = (filename, data, encoding = 'base64') => {
    console.log(`Saving file: ${filename}`, typeof filename)
    fs.writeFileSync(filename, data, encoding)
}

const createDirectoryIfNotExists = (fullpath) => {
    if (!fs.existsSync(fullpath)) {
        try {
            fs.mkdirSync(fullpath, { recursive: true });
            console.log(`Directory created: ${fullpath}`);
        } catch (error) {
            console.error('Error creating directory:', error);
        }
    }
}

const deleteFilesInFolder = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
        });

        console.log(`All files deleted from folder: ${folderPath}`);
    } catch (error) {
        console.error('Error deleting files:', error);
    }
}

exports.cleanDir = deleteFilesInFolder
exports.checkDir = createDirectoryIfNotExists

exports.saveJSONToFile = (jsonData, filePath) => {
    try {
        const jsonString = JSON.stringify(jsonData, null, 2);
        fs.writeFileSync(filePath, jsonString);
        console.log(`JSON data saved to file: ${filePath}`);
    } catch (error) {
        console.error('Error saving JSON data to file:', error);
    }
}