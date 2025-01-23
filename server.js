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

    await page.goto('https://www.google.com');

    // Wait for the search input field to be present on the page
    await page.waitForSelector('input#input.truncate');

    // Type the search query into the Google search input field
    await page.type('input#input.truncate', query);

    // Press Enter to submit the search query
    await page.keyboard.press('Enter');

    // Wait for the search results to load using a specific selector
    await page.waitForSelector('h3');

    const screenshotPath = 'screenshot.png';

    // Wait for a brief moment to allow any dynamic content to load
    await page.waitForTimeout(2000);

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
