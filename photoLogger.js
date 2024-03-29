const fs = require('fs');
const path = require('path');

// Define the base analytics directory
const analyticsDir = path.join(__dirname, 'analytics');

// Directories for saving photos within the analytics directory
const originalPhotosDir = path.join(analyticsDir, 'original_photos');
const generatedPhotosDir = path.join(analyticsDir, 'generated_photos');
const csvFilePath = path.join(analyticsDir, 'photo_processing_log.csv');

// Ensure the analytics directory and subdirectories exist
if (!fs.existsSync(analyticsDir)) fs.mkdirSync(analyticsDir);
if (!fs.existsSync(originalPhotosDir)) fs.mkdirSync(originalPhotosDir);
if (!fs.existsSync(generatedPhotosDir)) fs.mkdirSync(generatedPhotosDir);

// CSV Header: Now includes ChatId
if (!fs.existsSync(csvFilePath)) {
    fs.writeFileSync(csvFilePath, 'Index,Username,Index of Photos of Username,Sent Photo Path,Generated Photo Path,Time,ChatId\n');
}

// Keep track of photo counts per user
const userPhotoCounts = {};

// Function to log a photo processing event, now includes chatId
async function logPhotoProcessingEvent(username, sentPhotoPath, generatedPhotoPath, chatId) {
    const allEvents = Object.values(userPhotoCounts).reduce((acc, count) => acc + count, 0);
    const index = allEvents + 1;
    const userIndex = (userPhotoCounts[username] = (userPhotoCounts[username] || 0) + 1);
    const now = new Date().toISOString();

    const csvLine = `${index},${username},${userIndex},${sentPhotoPath},${generatedPhotoPath},${now},${chatId}\n`;
    fs.appendFileSync(csvFilePath, csvLine);
}

async function saveAndLogPhotoEvent(username, sentPhotoPromise, generatedPhotoPromise, chatId) {
    const userIndex = (userPhotoCounts[username] || 0) + 1;
    const originalPhotoPath = path.join(originalPhotosDir, `${username}-${userIndex}.jpg`);
    const generatedPhotoPath = path.join(generatedPhotosDir, `${username}-${userIndex}.jpg`);

    try {
        const sentPhotoBuffer = await sentPhotoPromise;
        const generatedPhotoBuffer = await generatedPhotoPromise;

        fs.writeFileSync(originalPhotoPath, sentPhotoBuffer);
        fs.writeFileSync(generatedPhotoPath, generatedPhotoBuffer);

        await logPhotoProcessingEvent(username, originalPhotoPath, generatedPhotoPath, chatId);
    } catch (error) {
        console.error("Error saving or logging photo event:", error);
        if (!fs.existsSync(originalPhotoPath)) {
            await logPhotoProcessingEvent(username, originalPhotoPath, 'failed', chatId);
        }
    }
}

module.exports = {
    saveAndLogPhotoEvent,
};
