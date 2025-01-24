const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const app = express();
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
async function takeScreenshotAndHTML(query) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://www.google.com/search?q=${query}`);

  // Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });

  // Get the HTML content
  const htmlContent = await page.content();
  fs.writeFileSync('search-results.html', htmlContent);

  await browser.close();
}

function createZip() {
  const zipFilePath = path.join(__dirname, 'search-results.zip'); // Full path to save the zip file
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log('Zip file created');
  });

  archive.pipe(output);
  archive.file('screenshot.png', { name: 'screenshot.png' });
  archive.file('search-results.html', { name: 'search-results.html' });
  archive.finalize();
}

app.post('/search', async (req, res) => {
  const query = req.body.query;

  try {
    await takeScreenshotAndHTML(query);
    createZip();
    const zipFilePath = path.join(__dirname, 'search-results.zip'); // Full path to the zip file
    res.download(zipFilePath);
  } catch (error) {
    console.error('Error processing search:', error);
    res.status(500).send('Error processing search');
  }
});

const PORT = process.env.PORT || 3000; // Use environment variable for port or default to 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
