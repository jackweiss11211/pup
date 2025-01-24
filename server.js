const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const archiver = require('archiver');

puppeteer.use(StealthPlugin());

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

  // Launch Puppeteer browser with stealth mode
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set a custom user-agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');

  // Set a longer timeout for navigation
  await page.goto(`https://www.google.com/search?q=${query}`, { waitUntil: 'networkidle2', timeout: 60000 });

  // Take a screenshot of the search results
  await page.screenshot({ path: 'screenshot.png' });

  // Get the HTML content of the search results
  const htmlContent = await page.content();

  // Create a zip file with the screenshot and HTML content
  const output = fs.createWriteStream('results.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
  });

  output.on('close', () => {
    // Send the zip file as the response
    res.download('results.zip', (err) => {
      if (err) {
        console.error('Error downloading the zip file:', err);
        res.status(500).send('Error downloading the zip file');
      }

      // Clean up the files
      fs.unlinkSync('screenshot.png');
      fs.unlinkSync('results.zip');
    });
  });

  archive.on('error', (err) => {
    console.error('Archive error:', err);
    res.status(500).send('Error creating the archive');
  });

  archive.pipe(output);
  archive.file('screenshot.png', { name: 'screenshot.png' });
  archive.append(htmlContent, { name: 'search_results.html' });
  await archive.finalize();

  // Close the browser
  await browser.close();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
