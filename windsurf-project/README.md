# Google Search Screenshot Generator

## Description
This Express.js application allows users to input a search query and receive a zip file containing:
- A full-page screenshot of the Google search results
- The HTML source of the search results page

## Prerequisites
- Node.js (v14 or later)
- npm (Node Package Manager)

## Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm start` to launch the server

## Usage
1. Open `http://localhost:3000` in your web browser
2. Enter a search query in the input field
3. Click "Generate Search Results Zip"
4. A zip file will be downloaded containing the screenshot and HTML

## Dependencies
- Express.js
- Puppeteer (for web scraping and screenshots)
- Archiver (for creating zip files)
- CORS (for handling cross-origin requests)

## Notes
- Ensure you have a stable internet connection
- The application requires Chromium to be installed (handled by Puppeteer)
- Temporary files are automatically cleaned up after download
