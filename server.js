const express = require('express');
const puppeteer = require('puppeteer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/search', async (req, res) => {
    const { query } = req.body;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${query}`);

    const screenshotPath = 'screenshot.png';
    const htmlContent = await page.content();

    await page.screenshot({ path: screenshotPath });

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
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
