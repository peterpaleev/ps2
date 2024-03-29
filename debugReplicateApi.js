const fs = require('fs').promises;
const { processImageWithReplicate } = require('./replicateApi');
const downscaleImageToUnder1MB = require('./downscaleProcessor'); // Include if you intend to downscale

async function debugProcessImage() {
    try {
        // Load the test image
        const imagePath = './test.jpg'; // Adjust the path if necessary
        //let imageBuffer = await fs.readFile(imagePath);

        // Optional: Downscale the image if it's part of your processing workflow
        // If your processing does not require downscaling, you can comment out the next line
        //imageBuffer = await downscaleImageToUnder1MB(imageBuffer);

        // Convert the image buffer to Base64 (if required by your processing function)
        //const imageBase64 = imageBuffer.toString('base64');

        // Debugging the processing function
        // Adapt the function call according to how `processImageWithReplicate` is implemented
        // For instance, if it expects a base64 string directly:
        const result = await processImageWithReplicate(imagePath);

        console.log('Processing result:', result);
    } catch (error) {
        console.error('Error during debug process:', error);
    }
}

debugProcessImage();
