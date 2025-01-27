const express = require('express');
const puppeteer = require('puppeteer-core');
const archiver = require('archiver');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

app.post('/search', async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        // Launch browser
        const browser = await puppeteer.launch({
            headless: "new",
            executablePath: process.platform === 'win32'
                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                : process.platform === 'linux'
                    ? '/usr/bin/google-chrome'
                    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Set viewport to a reasonable size
        await page.setViewport({ width: 1280, height: 800 });
        
        // Navigate to Google and search
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle0' });
        
        // Create unique filename based on timestamp
        const timestamp = Date.now();
        const screenshotPath = path.join(tempDir, `google_search_${timestamp}.png`);
        const htmlPath = path.join(tempDir, `google_search_${timestamp}.html`);
        
        // Take screenshot
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        // Save HTML content
        const pageContent = await page.content();
        fs.writeFileSync(htmlPath, pageContent);
        
        // Close browser
        await browser.close();
        
        // Create zip file
        const zipPath = path.join(tempDir, `google_search_results_${timestamp}.zip`);
        const archive = archiver('zip', { zlib: { level: 9 } });
        const output = fs.createWriteStream(zipPath);
        
        archive.pipe(output);
        archive.file(screenshotPath, { name: 'screenshot.png' });
        archive.file(htmlPath, { name: 'page_source.html' });
        
        await archive.finalize();
        
        // Send zip file
        res.download(zipPath, `google_search_results_${timestamp}.zip`, (err) => {
            // Clean up temporary files
            fs.unlinkSync(screenshotPath);
            fs.unlinkSync(htmlPath);
            fs.unlinkSync(zipPath);
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to perform search' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
