const fs = require('fs')
const path = require('path');

exports.getFileDate = () => new Date().toISOString().replace(/[\-:]/g, '').replace('T', "_").split('.')[0]

exports.saveFile = (filename, data, encoding = 'base64') => {
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

const deleteFilesOlderThanX = (folderPath, minutes = 5) => {
    try {
        // Read all files within the folder
        const files = fs.readdirSync(folderPath);

        // Get the current timestamp
        const currentTime = new Date().getTime();

        // Iterate over each file
        files.forEach((file) => {
            const filePath = `${folderPath}/${file}`;

            // Get the file's stats
            const fileStats = fs.statSync(filePath);

            // Calculate the file's age in milliseconds
            const fileAge = currentTime - fileStats.mtime.getTime();

            // Check if the file is older than 2 minutes (120,000 milliseconds)
            let milliseconds = minutes * 60000
            if (fileAge > milliseconds) {
                // Delete the file
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            }
        });

    } catch (error) {
        console.error('Error deleting files:', error);
    }
}

exports.cleanDir = deleteFilesOlderThanX
exports.pruneDir = deleteFilesInFolder
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

