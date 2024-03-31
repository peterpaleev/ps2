require('dotenv').config();
const fs = require('fs').promises;
const axios = require('axios');
const downscaleImageToUnder1MB = require('./downscaleProcessor');

exports.processImageWithReplicate = async (imageBuffer) => {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const headers = {
        "Authorization": `Token ${replicateToken}`,
        "Content-Type": "application/json",
    };

    // Downscale the image
    const downscaledImageBuffer = await downscaleImageToUnder1MB(imageBuffer);
    const imageBase64 = downscaledImageBuffer.toString('base64');

    const input = {
        image: `data:image/jpeg;base64,${imageBase64}`,
        style: "Video game",
        prompt: "pixelated glitchart of close-up of (subject}, ps1 playstation psx gamecube game radioactive dreams screencapture, bryce 3d",
        // prompt: "anime style, realistic, detailed, colorful, vibrant, high resolution",
        // negative_prompt: "bruises under the eyes, realistic, tired, sad, depressed, sick",
        lora_scale: 1,
        control_depth_strength: 0.4,
        denoising_strength: 0.4,
        prompt_strength: 8.54,
        instant_id_strength: 0.8,
    };

    // Wrap the prediction and polling in a Promise
    return new Promise(async (resolve, reject) => {
        try {
            const predictionResponse = await axios.post('https://api.replicate.com/v1/predictions', {
                version: "35cea9c3164d9fb7fbd48b51503eabdb39c9d04fdaef9a68f368bed8087ec5f9",
                input: input
            }, { headers });

            const predictionId = predictionResponse.data.id;
            console.log(`Prediction requested with ID: ${predictionId}`);

            // Polling function to check the prediction status
            const pollPredictionStatus = async () => {
                try {
                    const statusResponse = await axios.get(`https://api.replicate.com/v1/predictions/${predictionId}`, { headers });
                    const status = statusResponse.data.status;
                    console.log(`Current status: ${status}`);

                    if (status === "succeeded") {
                        console.log(`Output: ${statusResponse.data.output}`);
                        resolve(statusResponse.data.output[0]); // Assuming the output is an array of URLs
                    } else if (status === "failed") {
                        console.error("Prediction failed.");
                        reject(new Error("Prediction failed"));
                    } else {
                        // Wait 2 seconds before polling again
                        setTimeout(pollPredictionStatus, 2000);
                    }
                } catch (error) {
                    console.error('Error checking prediction status:', error.response ? error.response.data : error.message);
                    reject(error);
                }
            };

            pollPredictionStatus();
        } catch (error) {
            console.error('Error making prediction request:', error.response ? error.response.data : error.message);
            reject(error);
        }
    });
};
