const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/search', async (req, res) => {
  const { query } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`https://www.google.com/search?q=${query}`);

  // Wait for a different selector that may indicate the search results have loaded
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
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
