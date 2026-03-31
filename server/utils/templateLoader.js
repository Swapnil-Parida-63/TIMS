import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Reads an image file and returns a data: URI string (base64-encoded).
 * Returns an empty string if the file cannot be read.
 */
const toDataUri = async (filePath, mimeType) => {
  try {
    const data = await fs.readFile(filePath, 'base64');
    return `data:${mimeType};base64,${data}`;
  } catch (e) {
    console.error(`[templateLoader] Failed to embed image: ${filePath}`, e.message);
    return '';
  }
};

/**
 * Loads an HTML template file, embeds images as base64 data URIs so
 * Puppeteer can render them without network or file:// access, and
 * replaces all {{key}} placeholders with values from the data object.
 *
 * @param {string} templateName - filename inside server/templates/
 * @param {Object} data - key/value pairs to inject
 * @returns {Promise<string>} - final HTML string ready for Puppeteer
 */
export const loadTemplate = async (templateName, data = {}) => {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  let html = await fs.readFile(templatePath, 'utf-8');

  // ── 1. Embed logo (logo.png lives in templates/) ──────────────────────────
  const logoPng  = path.join(TEMPLATES_DIR, 'logo.png');
  const logoDataUri = await toDataUri(logoPng, 'image/png');

  // Replace any relative src="logo.png" reference
  html = html.replace(/src=["']logo\.png["']/gi, `src="${logoDataUri}"`);

  // ── 2. Embed background watermark (Background-logo.jpeg) ──────────────────
  const bgJpeg  = path.join(TEMPLATES_DIR, 'Background-logo.jpeg');
  const bgDataUri = await toDataUri(bgJpeg, 'image/jpeg');

  // Replace url('Background-logo.jpeg') in CSS (handles single/double quotes)
  html = html.replace(/url\(["']?Background-logo\.jpeg["']?\)/gi, `url("${bgDataUri}")`);

  // ── 3. Replace all {{key}} placeholders ───────────────────────────────────
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, value ?? '');
  }

  // ── 4. Strip any remaining un-replaced {{...}} placeholders → empty string
  html = html.replace(/\{\{[^}]+\}\}/g, '');

  return html;
};
