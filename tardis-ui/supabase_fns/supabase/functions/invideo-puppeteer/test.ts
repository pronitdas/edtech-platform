const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function getLatestFile() {
    const downloadsFolder = './'; // Adjust path if needed
    const files = fs.readdirSync(downloadsFolder)
        .filter(file => file.includes('invideo'))
        .map(file => ({
            name: file,
            time: fs.statSync(path.join(downloadsFolder, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
        console.log('No files found with "invideo" in the name.');
        return '';
    }

    console.log('Latest file:', files[0].name);
    return files[0].name;
}

async function generateVideo(text = "Imagine a world where every object tells its story. A crumpled bus ticket shares memories of an unforgettable road trip. A broken watch recounts the split-second decision that changed a life. Create a visually rich and emotionally captivating video exploring how these everyday objects hold untold tales, weaving them into a narrative that reveals the hidden connections between them and the people they’ve touched.") {
    try {
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        const page = await browser.newPage();
        await page.goto('https://ai.invideo.io/');

        // Wait for and fill the text box
        await page.waitForSelector('textarea');
        await page.type('textarea', text);

        // Click the generate button
        await page.waitForSelector('button[type="submit"]');
        await page.click('button[type="submit"]');

        // Wait and click the 'Continue' button
        await page.waitForSelector("button[aria-label='Continue']");
        await page.click("button[aria-label='Continue']");

        // Click the download button
        await page.waitForSelector("button[aria-label='Download']");
        await page.click("button[aria-label='Download']");

        // Handle download options (e.g., watermark, resolution)
        await page.waitForSelector("button[aria-label='Stock Watermark']");
        await page.click("button[aria-label='Stock Watermark']");

        await page.waitForSelector("button[aria-label='Normal']");
        await page.click("button[aria-label='Normal']");

        await page.waitForSelector("button[aria-label='480p']");
        await page.click("button[aria-label='480p']");

        await page.waitForSelector("button[aria-label='Continue Download']");
        await page.click("button[aria-label='Continue Download']");

        // Final download button
        await page.waitForSelector("button[aria-label='Download Video']");
        await page.click("button[aria-label='Download Video']");

        // Wait for the download to complete
        await page.waitForTimeout(15000); // Adjust timeout as necessary
        const latestFile = await getLatestFile();

        await browser.close();
        return latestFile;

    } catch (error) {
        console.error('Error while generating video:', error);
        return '';
    }
}

// Run the function
generateVideo();
