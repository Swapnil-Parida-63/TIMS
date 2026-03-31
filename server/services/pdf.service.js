import puppeteer from "puppeteer";
import fs from 'fs/promises';
import path from 'path';

/**
 * Generates a PDF from an HTML string and saves it to the given file path.
 * Enforces A4 size with proper print background and CSS page size.
 *
 * @param {string} html - Rendered HTML string
 * @param {string} filePath - Absolute path to save the PDF
 * @returns {Promise<string>} - The file path where the PDF was saved
 */
export const generatePDF = async (html, filePath) => {
  // Ensure the output directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filePath,          // ✅ Correct variable name (was `path` before, shadowed import)
      format: 'A4',
      printBackground: true,   // Renders background colors / shading
      preferCSSPageSize: true, // Respects @page CSS rules in the template
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '12mm',
        right: '12mm'
      }
    });

    return filePath;
  } finally {
    if (browser) await browser.close();
  }
};