require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { processImageWithReplicate } = require('./replicateApi');
const downscaleImageToUnder1MB = require('./downscaleProcessor');
const { saveAndLogPhotoEvent } = require('./photoLogger');


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Messages for easy editing
const messages = {
    processingImage: 'Processing your image...',
    stillProcessingImage: 'Still processing your image...',
    imageProcessed: 'Вот, вы в гта:',
    sendPhotoPrompt: 'Please send a photo. For now, only photos with faces are supported.',
    adviceAfterFirstImage: 'У бота скоро апдейт! Может будет недоспупен какаое то время! если знаете хоть чуть чуть как на сервер залить код - пишите @peterpaleev',
    failureNotice: 'Failed to process the image.',
};

const stickerFileId = 'CAACAgIAAxkBAAICCmYErU_olH7b4WTrotj02_tRC30nAAJMAANkYXEuHN64INZvSHA0BA';

// Track if the advice after first image has been sent for each chat
const adviceSentForChat = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;

    if (msg.photo) {
        console.log(msg.from); // Log user info

        const fileId = msg.photo[msg.photo.length - 1].file_id;

        // Initialize adviceSentForChat[chatId] if it's undefined for the current chat
        if (adviceSentForChat[chatId] === undefined) {
            adviceSentForChat[chatId] = false; // This ensures every chat has its own tracking
        }
        
        try {
            const fileUrl = await bot.getFileLink(fileId);
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data);

            // Send initial processing message
            const processingMessage = await bot.sendMessage(chatId, messages.processingImage);
            let processingMessageId = processingMessage.message_id;

            // Set a 1 second timeout to send a sticker if processing is long
            setTimeout(async () => {
                const sentSticker = await bot.sendSticker(chatId, stickerFileId);
                stickerMessageId = sentSticker.message_id; // Store sticker message ID
            }, 1000);

            // Set a 5 second timeout to edit the processing message if still processing
            setTimeout(() => {
                bot.editMessageText(messages.stillProcessingImage, {chat_id: chatId, message_id: processingMessageId});
            }, 8000);

            const processedImageUrl = await processImageWithReplicate(imageBuffer, chatId);
            
            // Delete the sticker message if processing is complete
            if (stickerMessageId) {
                await bot.deleteMessage(chatId, stickerMessageId);
            }

            if (processingMessageId) {
                await bot.deleteMessage(chatId, processingMessageId);
            }

            bot.sendMessage(chatId, messages.imageProcessed);
            bot.sendPhoto(chatId, processedImageUrl);

            if (!adviceSentForChat[chatId]) {
                bot.sendMessage(chatId, messages.adviceAfterFirstImage);
                adviceSentForChat[chatId] = true;
            }

            const sentPhotoBuffer = Buffer.from(response.data); // Assuming this is your sent photo buffer
            // out of processedImageUrl we need to get the buffer
            const generatedPhotoBuffer = getImageBufferFromUrl(processedImageUrl);
            const username = msg.from.username || msg.from.id; // Use username or user ID if username is not set


            await saveAndLogPhotoEvent(username, sentPhotoBuffer, generatedPhotoBuffer);

        } catch (err) {
            console.error(err);
            bot.sendMessage(chatId, messages.failureNotice);
        }
    } else {
        bot.sendMessage(chatId, messages.sendPhotoPrompt);
        console.log(msg.text); // Log the message sent by the user
        console.log(msg.from); // Log user info

    }
});

async function getImageBufferFromUrl(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });

    return response.data;
}


console.log('✅ Bot is running...');
