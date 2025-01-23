const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/search', async (req, res) => {
    try {
        const { query } = req.body;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate directly to the Google search results page with the query in the URL
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

        // Wait for the page to fully load by waiting for the 'load' event
        await page.waitForNavigation({ waitUntil: 'load' });

        const screenshotPath = 'screenshot.png';
        const htmlContent = await page.content();
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const zipPath = 'results.zip';
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', () => {
            res.download(zipPath);
        });

        archive.pipe(output);
        archive.append(htmlContent, { name: 'results.html' });
        archive.file(screenshotPath, { name: 'screenshot.png' });
        archive.finalize();

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('An error occurred. Please try again later.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
