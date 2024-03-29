// webhookReceiver.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhooks/replicate', (req, res) => {
    console.log('Webhook received:', req.body);
    // Logic to notify the user based on the webhook data
    // This assumes you have a mapping of Replicate prediction IDs to Telegram chat IDs
    const predictionId = req.body.id; // Example, adjust according to the actual webhook payload
    const chatId = getChatIdFromPredictionId(predictionId); // Implement this function based on your user tracking
    const resultImageUrl = req.body.output; // Or however the output image URL is provided in the webhook payload
    
    bot.sendPhoto(chatId, resultImageUrl)
       .then(() => console.log(`Image sent to chat ${chatId}`))
       .catch(err => console.error(`Failed to send image to chat ${chatId}:`, err));

    res.status(200).send('Webhook received and processed');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
