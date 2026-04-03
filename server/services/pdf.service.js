import puppeteer from "puppeteer";
import fs from 'fs/promises';
import path from 'path';

/**
 * Generates a PDF from an HTML string and saves it to the given file path.
 * @returns {Promise<string>} - The file path where the PDF was saved
 */
export const generatePDF = async (html, filePath) => {
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
      path: filePath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
    });
    return filePath;
  } finally {
    if (browser) await browser.close();
  }
};

/**
 * Generates a PDF from an HTML string and returns it as a Buffer (no disk I/O).
 * Used for S3 uploads.
 * @returns {Promise<Buffer>} - The PDF as a Buffer
 */
export const generatePDFBuffer = async (html) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
    });
    return buffer;
  } finally {
    if (browser) await browser.close();
  }
};