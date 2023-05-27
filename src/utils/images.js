
const Jimp = require('jimp');

exports.combineImages = async (imagePath1, imagePath2, outputPath) => {
    try {
        // Read both images
        const image1 = await Jimp.read(imagePath1);
        const image2 = await Jimp.read(imagePath2);

        // Resize images to have the same height
        const maxHeight = Math.max(image1.getHeight(), image2.getHeight());
        image1.resize(Jimp.AUTO, maxHeight);
        image2.resize(Jimp.AUTO, maxHeight);

        // Create a new image with twice the width
        const combinedWidth = image1.getWidth() + image2.getWidth();
        const combinedImage = new Jimp(combinedWidth, maxHeight);

        // Paste the first image on the left
        combinedImage.blit(image1, 0, 0);

        // Paste the second image on the right
        combinedImage.blit(image2, image1.getWidth(), 0);

        // Save the combined image
        await combinedImage.writeAsync(outputPath);
    } catch (error) {
        console.error('Error combining images:', error);
    }
}
