const fs   = require('fs');
const path = require('path');

let createWorker = null;
try {
  ({ createWorker } = require('tesseract.js'));
} catch {
  // tesseract.js not available
}

// eng.traineddata is committed to the repo at backend/eng.traineddata
const LANG_PATH = path.resolve(__dirname, '..');

async function extractTextFromImage(imagePath) {
  try {
    await fs.promises.access(imagePath, fs.constants.R_OK);
  } catch {
    console.warn('[OCR] File not accessible:', imagePath);
    return { text: '', confidence: 0, method: 'file-error' };
  }

  if (!createWorker) {
    console.warn('[OCR] tesseract.js not available');
    return { text: '', confidence: 0, method: 'no-tesseract' };
  }

  // Run PSM 6 (uniform block — best for medicine labels)
  const r6 = await runTesseract(imagePath, 6);
  let best = r6;

  // If PSM 6 gave low confidence, try PSM 3 (auto) as a second attempt
  if (r6.confidence < 40 && r6.text.length < 80) {
    const r3 = await runTesseract(imagePath, 3);
    if (r3.confidence > r6.confidence || r3.text.length > r6.text.length) {
      best = r3;
      console.log(`[OCR] PSM3 won (conf=${r3.confidence}% vs ${r6.confidence}%)`);
    }
  }

  const cleaned = cleanOcrText(best.text);
  console.log(`[OCR] Extracted ${cleaned.length} chars @ ${best.confidence}% conf (psm${best.psm})`);

  // If we got any meaningful text, return it for AI analysis regardless of pharma keywords
  // The AI pipeline handles the verdict — OCR's job is just to extract text
  if (cleaned.length >= 15) {
    const hasPharm = hasPharmaSignals(cleaned);
    const method   = best.confidence >= 30 && hasPharm ? `tesseract-psm${best.psm}`
                   : best.confidence >= 30             ? 'tesseract-nonpharma'
                   :                                     'tesseract-low';
    return { text: cleaned, confidence: Math.max(best.confidence, 15), method };
  }

  // Truly empty — image is blank, wrong side of package, or too blurry
  console.warn('[OCR] No readable text extracted — image may not show a medicine label');
  return { text: '', confidence: 0, method: 'no-text' };
}

async function runTesseract(imagePath, psm) {
  try {
    const worker = await createWorker('eng', 1, {
      langPath: LANG_PATH,
      logger: () => {},
      errorHandler: () => {},
    });

    await worker.setParameters({
      tessedit_pageseg_mode: String(psm),
      tessedit_char_whitelist:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
        '0123456789 .,/:%-()&@#!+*\'"',
    });

    const { data } = await worker.recognize(imagePath);
    await worker.terminate();

    return { text: data.text || '', confidence: Math.round(data.confidence || 0), psm };
  } catch (err) {
    console.warn(`[OCR] Tesseract PSM${psm} error:`, err.message);
    return { text: '', confidence: 0, psm };
  }
}

function hasPharmaSignals(text) {
  return (
    /\b(tablet|capsule|syrup|injection|cream|ointment|drops|gel|suspension|inhaler|powder|solution|vial|ampoule)\b/i.test(text) ||
    /\b(batch|lot|b\.?\s*no|mfg|exp|expiry|manufacture|manufactured)\b/i.test(text) ||
    /\b(pharma|pharmaceutical|laboratories?|labs|healthcare|biotech|ltd|limited|pvt|inc|corp)\b/i.test(text) ||
    /\b\d{1,4}\s*(mg|ml|mcg|g|iu|%)\b/i.test(text) ||
    /\b(composition|contains|ingredient|dosage|schedule\s*[hgx]|rx\s*only|prescription)\b/i.test(text) ||
    /\b(store|storage|protect|temperature|refrigerate)\b/i.test(text) ||
    /\b(ip\b|b\.?p\.?\b|u\.?s\.?p\.?\b)\b/i.test(text)
  );
}

function cleanOcrText(raw) {
  return raw
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\|/g, 'I')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{3,}/g, '  ')
    .trim();
}

module.exports = { extractTextFromImage };
