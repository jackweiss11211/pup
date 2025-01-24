const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const archiver = require('archiver');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve the index.html file when the client accesses the root endpoint
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// POST endpoint for handling search requests
app.post('/search', async (req, res) => {
  const { query } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the search page
  await page.goto(`https://www.google.com/search?q=${query}`);

  // Wait for the page to signal that it has finished loading
  await page.waitForNavigation({ waitUntil: 'load' });

  // Take a screenshot of the search results
  await page.screenshot({ path: 'screenshot.png' });

  // Get the HTML content of the search results
  const htmlContent = await page.content();

  // Create a zip file with the screenshot and HTML content
  const output = fs.createWriteStream('results.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
  });
  archive.pipe(output);
  archive.file('screenshot.png', { name: 'screenshot.png' });
  archive.append(htmlContent, { name: 'search_results.html' });
  await archive.finalize();

  // Send the zip file as the response
  res.download('results.zip');

  // Close the browser
  await browser.close();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
