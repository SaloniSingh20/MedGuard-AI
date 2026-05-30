const fs = require('fs');
const path = require('path');

let createWorker = null;
try {
  ({ createWorker } = require('tesseract.js'));
} catch {
  // tesseract.js not available
}

// Path to local eng.traineddata in the backend root
const LANG_PATH = path.resolve(__dirname, '..');

async function extractTextFromImage(imagePath) {
  try {
    await fs.promises.access(imagePath, fs.constants.R_OK);
  } catch {
    console.warn('[OCR] File not accessible:', imagePath);
    return { text: '', confidence: 0, method: 'file-error' };
  }

  if (createWorker) {
    // Single PSM 6 pass (uniform block) — best for medicine labels, 2× faster than dual-pass
    const best = await runTesseract(imagePath, 6);

    const cleaned = cleanOcrText(best.text);
    const hasPharmText = hasPharmaSignals(cleaned);

    // High-quality OCR with pharmaceutical content
    if (best.confidence >= 30 && cleaned.length >= 40 && hasPharmText) {
      console.log(`[OCR] Good: ${cleaned.length} chars, conf=${best.confidence}%, psm=${best.psm}`);
      return { text: cleaned, confidence: best.confidence, method: `tesseract-psm${best.psm}` };
    }

    // Acceptable OCR — has pharmaceutical text even if confidence is low
    if (cleaned.length >= 30 && hasPharmText) {
      console.log(`[OCR] Acceptable: ${cleaned.length} chars, conf=${best.confidence}%`);
      return { text: cleaned, confidence: Math.max(best.confidence, 20), method: 'tesseract-low' };
    }

    // Has content but no pharma keywords — return it so AI can judge
    if (best.confidence >= 40 && cleaned.length >= 60) {
      console.log(`[OCR] Non-pharma text: ${cleaned.length} chars, conf=${best.confidence}%`);
      return { text: cleaned, confidence: best.confidence, method: 'tesseract-nonpharma' };
    }

    // Poor OCR (garbage / too short / no pharma signals) — use demo fallback
    console.warn(`[OCR] Insufficient (${cleaned.length} chars, ${best.confidence}% conf) — demo fallback`);
  } else {
    console.warn('[OCR] tesseract.js not available');
  }

  return generateDemoFallback(path.basename(imagePath || ''));
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
      // Whitelist: letters, digits, common pharma punctuation
      tessedit_char_whitelist:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
        '0123456789 .,/:%-()&@#!+*\'"',
    });

    const { data } = await worker.recognize(imagePath);
    await worker.terminate();

    return {
      text: data.text || '',
      confidence: Math.round(data.confidence || 0),
      psm,
    };
  } catch (err) {
    console.warn(`[OCR] Tesseract PSM${psm} error:`, err.message);
    return { text: '', confidence: 0, psm };
  }
}

function hasPharmaSignals(text) {
  return (
    /\b(tablet|capsule|syrup|injection|cream|ointment|drops|gel|suspension|inhaler|powder|solution)\b/i.test(text) ||
    /\b(batch|lot|b\.?\s*no|mfg|exp|expiry|manufacture)\b/i.test(text) ||
    /\b(pharma|laboratories?|labs|healthcare|ltd|limited|pvt)\b/i.test(text) ||
    /\b\d{1,4}\s*(mg|ml|mcg|g|iu)\b/i.test(text) ||
    /\b(composition|contains|ingredient|dosage|schedule\s*[hgx])\b/i.test(text)
  );
}

function cleanOcrText(raw) {
  return raw
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')   // strip non-ASCII
    .replace(/\|/g, 'I')                     // common OCR mistake: | → I
    .replace(/0/g, (m, offset, str) => {     // keep 0 as-is (not replacing)
      return m;
    })
    .replace(/\n{3,}/g, '\n\n')              // collapse excessive blank lines
    .replace(/[ \t]{3,}/g, '  ')             // collapse excessive spaces
    .replace(/^\s+|\s+$/g, '')               // trim
    .trim();
}

// ─── Demo Fallback ────────────────────────────────────────────────────────────
// Used when Tesseract cannot extract text (e.g. non-medicine images in dev/demo).
// Seeded by filename hash for consistent results per upload.

const DEMO_MEDICINES = [
  {
    name: 'PARACETAMOL', strength: '500mg', form: 'Tablets',
    batch: 'PCM-2024-0312', mfg: 'March 2024', exp: '02/2026',
    company: 'Cipla Ltd.', address: 'Cipla House, Mumbai - 400 098, India',
    composition: 'Paracetamol BP 500mg',
    storage: 'Store below 30°C in a dry place. Protect from light.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 18.50',
  },
  {
    name: 'AMOXICILLIN', strength: '250mg', form: 'Capsules',
    batch: 'AMX-2024-1104', mfg: 'November 2023', exp: '10/2025',
    company: 'Sun Pharmaceutical Industries Ltd.',
    address: 'SPARC, Tandalja, Vadodara - 390 020, India',
    composition: 'Amoxicillin Trihydrate IP Equivalent to Amoxicillin 250mg',
    storage: 'Store in a cool, dry place. Protect from light.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 55.00',
  },
  {
    name: 'METFORMIN HYDROCHLORIDE', strength: '500mg', form: 'Tablets',
    batch: 'MET-2024-0812', mfg: 'August 2024', exp: '07/2027',
    company: "Dr. Reddy's Laboratories Ltd.",
    address: '8-2-337, Road No. 3, Banjara Hills, Hyderabad - 500 034, India',
    composition: 'Metformin Hydrochloride IP 500mg',
    storage: 'Store below 25°C. Keep away from moisture.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 30.20',
  },
  {
    name: 'AZITHROMYCIN', strength: '500mg', form: 'Tablets',
    batch: 'AZI-2024-0604', mfg: 'June 2024', exp: '05/2027',
    company: 'Lupin Ltd.',
    address: 'Lupin Research Park, Nande, Pune - 412 115, India',
    composition: 'Azithromycin Dihydrate IP Equivalent to Azithromycin 500mg',
    storage: 'Store below 30°C. Protect from moisture and light.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 98.00',
  },
  {
    name: 'ATORVASTATIN CALCIUM', strength: '10mg', form: 'Tablets',
    batch: 'ATV-2023-1209', mfg: 'December 2023', exp: '11/2026',
    company: 'Mankind Pharma Ltd.',
    address: '208, Okhla Industrial Area, Phase-III, New Delhi - 110 020, India',
    composition: 'Atorvastatin Calcium Trihydrate IP Equivalent to Atorvastatin 10mg',
    storage: 'Store below 30°C. Keep in a dry place.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 42.00',
  },
  {
    name: 'IBUPROFEN', strength: '400mg', form: 'Tablets IP',
    batch: 'IBU-2024-0509', mfg: 'May 2024', exp: '04/2027',
    company: 'Torrent Pharmaceuticals Ltd.',
    address: 'Village Bhat, Dist. Gandhinagar - 382 428, Gujarat, India',
    composition: 'Ibuprofen IP 400mg',
    storage: 'Store below 30°C. Protect from moisture.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 24.00',
  },
  {
    name: 'OMEPRAZOLE', strength: '20mg', form: 'Capsules',
    batch: 'OMP-2024-0307', mfg: 'March 2024', exp: '02/2027',
    company: 'Alkem Laboratories Ltd.',
    address: 'Devashish, Bajaj Marg, Worli, Mumbai - 400 018, India',
    composition: 'Omeprazole IP 20mg (As Enteric Coated Pellets)',
    storage: 'Store below 25°C. Protect from moisture and light.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 35.50',
  },
  {
    name: 'CETIRIZINE HYDROCHLORIDE', strength: '10mg', form: 'Tablets',
    batch: 'CTZ-2024-0715', mfg: 'July 2024', exp: '06/2027',
    company: 'Glenmark Pharmaceuticals Ltd.',
    address: 'B/2, Mahalaxmi Chambers, 22 Bhulabhai Desai Road, Mumbai - 400 026',
    composition: 'Cetirizine Hydrochloride IP 10mg',
    storage: 'Store below 30°C in dry place.',
    schedule: 'SCHEDULE H', mrp: 'MRP Rs. 19.00',
  },
];

function generateDemoFallback(filename) {
  const seed = filename.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const m = DEMO_MEDICINES[seed % DEMO_MEDICINES.length];

  const text = [
    `${m.name} ${m.strength} ${m.form}`,
    ``,
    `Composition:`,
    `Each ${m.form.split(' ')[0].toLowerCase()} contains:`,
    `${m.composition}`,
    ``,
    `Batch No.: ${m.batch}`,
    `Mfg. Date: ${m.mfg}`,
    `Exp. Date: ${m.exp}`,
    ``,
    `Manufactured & Marketed by:`,
    `${m.company}`,
    `${m.address}`,
    ``,
    `${m.schedule} - Rx Only`,
    `Not to be sold without the prescription of a Registered Medical Practitioner.`,
    ``,
    `${m.mrp} (Incl. of all taxes)`,
    ``,
    `${m.storage}`,
    `Keep out of reach of children.`,
    `For external use only - Do not swallow.`,
    ``,
    `Country of Origin: India`,
  ].join('\n');

  return { text, confidence: 0, method: 'demo-fallback' };
}

module.exports = { extractTextFromImage };
