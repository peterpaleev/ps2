// downscaleProcessor.js

const sharp = require('sharp');

async function downscaleImageToUnder1MB(imageBuffer) {
    let outputBuffer = await sharp(imageBuffer)
        .resize({ 
            width: 512, 
            height: 512, 
            fit: sharp.fit.inside, 
            withoutEnlargement: true 
        })
        .toBuffer();

    return outputBuffer;
    //save the image with name oldName + '_compressed.jpg'
    // sharp(outputBuffer)
    //     .toFile('new.jpg', (err, info) => {
    //         if (err) {
    //             console.error(err);
    //         } else {
    //             console.log('Image successfully downscaled and saved!');
    //         }
    //     });
}

module.exports = downscaleImageToUnder1MB;
