/**
 * MedGuard AI — Core Analysis Pipeline
 *
 * Pipeline:
 *   Image → OCR (Tesseract.js) → LLM (Ollama/llama3) → DB Validation → Confidence Fusion → Verdict
 *
 * Confidence weights:
 *   OCR quality  15%
 *   LLM analysis 50%
 *   Field count  25%
 *   DB lookup    10%
 */

const { extractTextFromImage } = require('./services/ocrService');
const { analyzeMedicine: analyzeWithAI } = require('./services/aiService');
const {
  validateMedicineName,
  validateManufacturer,
  validateBatchNumber,
  validateExpiryDate,
  validateComposition,
} = require('./data/medicineDatabase');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function mapStatus(s) {
  const u = String(s || '').toUpperCase();
  if (u === 'SAFE' || u === 'AUTHENTIC') return 'authentic';
  if (u === 'FAKE' || u === 'COUNTERFEIT') return 'counterfeit';
  return 'suspicious';
}

// ─── Field Extractor ──────────────────────────────────────────────────────────

function extractFields(text) {
  const t = String(text || '');

  // Batch number
  const batchRx = t.match(/(?:batch|lot|b\.?\s*no\.?|bn)\s*[:\-#\.]?\s*([A-Z0-9][A-Z0-9\-\/]{2,16})/i);
  const batchNum = batchRx?.[1]?.toUpperCase()?.trim() || null;

  // Expiry date
  const expRx = t.match(/(?:exp(?:iry|iration)?|use\s*(?:before|by))\s*[:\-\.]?\s*((?:0?[1-9]|1[0-2])[\/\-](?:20)?\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[\-,]?\s*(?:20)?\d{2,4})/i);
  const expiryStr = expRx?.[1]?.trim() || null;

  // Manufacturer
  const mfrRx = t.match(/(?:manufactured\s*(?:and\s*)?(?:marketed\s*)?by|marketed\s*by|mfr\.|manufacturer\s*:|company\s*:)\s*([^\n]{4,80})/i);
  const mfrStr = mfrRx?.[1]?.trim() || null;

  // Dosage
  const dosageRx = t.match(/\b(\d{1,4}\s*(?:mg|ml|mcg|g|iu|%))\b/i);
  const dosageStr = dosageRx?.[1]?.trim() || null;

  // Composition
  const compRx = t.match(/(?:composition|each\s+\w+\s+contains|contains)\s*[:\-]?\s*([^\n]{8,120})/i);
  const compStr = compRx?.[1]?.trim() || null;

  // Boolean presence flags (10 fields)
  const present = {
    medicine_name: /\b(tablet|capsule|syrup|injection|cream|ointment|drops|gel|suspension|inhaler)\b/i.test(t) || validateMedicineName(t).valid,
    manufacturer: /\b(pharma|laboratories?|labs|healthcare|biotech|lifesciences|ltd|limited|pvt|inc|industries)\b/i.test(t),
    batch_number: Boolean(batchNum) || /\b(batch|lot|b\.?\s*no)\b/i.test(t),
    expiry_date: Boolean(expiryStr) || (/\b(exp|expiry)\b/i.test(t) && /\d{2}[\/\-]\d{2,4}/.test(t)),
    mfg_date: /\b(mfg|mfd|manufacture[d]?\s*(?:date)?|date\s*of\s*manufacture)\b/i.test(t),
    dosage: Boolean(dosageStr),
    composition: /\b(composition|contains|active\s*ingredient|each\s+\w+\s+contains)\b/i.test(t),
    storage: /\b(store|storage|keep\s+(?:in|at|below)|protect\s+from)\b/i.test(t),
    regulatory: /\b(ip\b|b\.?p\.?\b|u\.?s\.?p\.?\b|schedule\s*[hgx]|rx\s*only|prescription\s*only)\b/i.test(t),
    country_origin: /\b(india|germany|usa|uk|france|switzerland|country\s*of\s*origin|made\s*in)\b/i.test(t),
  };

  const fieldCount = Object.values(present).filter(Boolean).length;

  // Database validations
  const mfrValidation = validateManufacturer(mfrStr || t);
  const batchValidation = validateBatchNumber(batchNum || '');
  const expiryValidation = validateExpiryDate(expiryStr || t);
  const compValidation = validateComposition(compStr || t);
  const medValidation = validateMedicineName(t);

  // Red flags
  const redFlags = [];

  const years = [...t.matchAll(/\b(20\d{2})\b/g)].map(m => parseInt(m[1]));
  const now = new Date();
  if (years.length >= 2) {
    const span = Math.max(...years) - Math.min(...years);
    if (span > 10) redFlags.push('Implausible date span on packaging (>10 years)');
  }
  if (years.some(y => y < 2005)) redFlags.push('Suspected pre-2005 manufacture date');
  if (years.some(y => y > now.getFullYear() + 10)) redFlags.push('Suspicious far-future date');
  if (expiryValidation.expired) redFlags.push('Product appears to be past its expiry date');
  if (batchValidation.suspicious) redFlags.push('Batch number matches known fake pattern');
  if (/\b(copy|duplicate|repackaged|not\s*for\s*retail|sample\s*only|not\s*for\s*sale)\b/i.test(t)) {
    redFlags.push('Suspicious packaging disclaimer');
  }
  if (/\b(guarant[a-z]+|certif[a-z]+\s*original|100%\s*genuine|verified\s*original)\b/i.test(t) &&
      !mfrValidation.valid) {
    redFlags.push('Unverified authenticity claim from unknown manufacturer');
  }

  return {
    present,
    fieldCount,
    batchNum,
    expiryStr,
    mfrStr,
    dosageStr,
    compStr,
    mfrValidation,
    batchValidation,
    expiryValidation,
    compValidation,
    medValidation,
    redFlags,
  };
}

// ─── Confidence Fusion Engine ─────────────────────────────────────────────────
// Weights: OCR 15% | LLM 50% | Field Presence 25% | DB Validation 10%

function fuseConfidence(aiResult, fields, ocrConfidence, ocrMethod) {
  const aiConf = clamp(Number(aiResult.confidence) || 50, 0, 100);

  // OCR weight: reduce weight when OCR gave no pharma signals (garbage extraction)
  const isGarbageOcr = ocrMethod === 'tesseract-nonpharma' || (ocrConfidence < 20 && fields.fieldCount === 0);
  const effectiveOcrScore = isGarbageOcr ? Math.min(ocrConfidence, 15) : clamp(ocrConfidence, 0, 100);

  // Field completeness score (0-100)
  const fieldScore = clamp(Math.round((fields.fieldCount / 10) * 100), 0, 100);

  // Database validation score (0-100)
  const dbScore = clamp(Math.round(
    fields.mfrValidation.score * 0.35 +
    fields.batchValidation.score * 0.25 +
    (fields.expiryValidation.valid ? (fields.expiryValidation.expired ? 40 : 100) : 0) * 0.25 +
    fields.compValidation.score * 0.15
  ), 0, 100);

  // Fused score — when OCR is garbage, AI + fields carry the weight
  const ocrWeight = isGarbageOcr ? 0.05 : 0.15;
  const aiWeight = isGarbageOcr ? 0.60 : 0.50;
  const fieldWeight = 0.25;
  const dbWeight = isGarbageOcr ? 0.10 : 0.10;

  let fused = Math.round(
    effectiveOcrScore * ocrWeight +
    aiConf * aiWeight +
    fieldScore * fieldWeight +
    dbScore * dbWeight
  );

  // Adjustments
  fused -= fields.redFlags.length * 7;
  if (fields.mfrValidation.score >= 90) fused += 4;
  if (fields.compValidation.pharmaRef) fused += 3;
  if (fields.expiryValidation.expired) fused -= 12;
  if (fields.medValidation.score >= 80) fused += 3;

  return clamp(Math.round(fused), 5, 98);
}

// ─── Verdict Logic ────────────────────────────────────────────────────────────

function determineVerdict(aiResult, fields, fusedScore) {
  const aiStatus = mapStatus(aiResult.status);
  const hasSevereFlag = aiResult.detected_issues?.some(i =>
    /forged|tamper|blacklist|counterfeit.network|duplicate.batch|packaging.clone/i.test(i)
  ) || false;

  const corePresent = fields.present.batch_number && fields.present.expiry_date && fields.present.manufacturer;
  const strongEvidence = fields.fieldCount >= 6;
  const weakEvidence = fields.fieldCount <= 2;
  const manyRedFlags = fields.redFlags.length >= 2;

  let status = aiStatus;

  // Override rules — evidence beats AI opinion

  // COUNTERFEIT upgrades
  if (hasSevereFlag && fusedScore >= 60) {
    status = 'counterfeit';
  }
  if (manyRedFlags && weakEvidence) {
    status = 'counterfeit';
  }
  if (fields.batchValidation.suspicious) {
    status = status === 'authentic' ? 'suspicious' : status;
  }
  if (fields.expiryValidation.expired && status === 'authentic') {
    status = 'suspicious';
  }

  // Pull back from COUNTERFEIT when evidence is solid
  if (status === 'counterfeit' && strongEvidence && !hasSevereFlag && fields.redFlags.length === 0) {
    status = 'suspicious';
  }

  // AUTHENTIC requires proof
  if (status === 'authentic' && !strongEvidence) {
    status = 'suspicious';
  }
  if (status === 'authentic' && !corePresent) {
    status = 'suspicious';
  }

  // Promote to AUTHENTIC when evidence is overwhelming
  if (strongEvidence && corePresent && fields.redFlags.length === 0 && fusedScore >= 68 && !hasSevereFlag) {
    if (fields.mfrValidation.valid || fields.compValidation.pharmaRef) {
      status = 'authentic';
    }
  }

  // Ensure score makes sense for each verdict — no hard floors that make every result identical
  let finalScore = fusedScore;
  if (status === 'counterfeit') finalScore = clamp(finalScore, 62, 98);
  if (status === 'authentic') finalScore = clamp(finalScore, 65, 98);
  // suspicious: let the score float freely so different inputs give different results

  return { status, score: clamp(finalScore, 5, 98) };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

module.exports = async function analyzeMedicine(imagePath, options = {}) {
  // Step 1: OCR
  const ocrResult = await extractTextFromImage(imagePath);
  const extractedText = typeof ocrResult === 'object' ? (ocrResult.text || '') : String(ocrResult || '');
  const ocrConfidence = typeof ocrResult === 'object' ? (ocrResult.confidence ?? 50) : 50;
  const ocrMethod = typeof ocrResult === 'object' ? (ocrResult.method || 'unknown') : 'legacy';

  console.log(`[Pipeline] OCR=${ocrMethod}, conf=${ocrConfidence}%, chars=${extractedText.length}`);

  // When OCR completely failed, return an honest "unreadable" result rather than
  // running full analysis on demo text (which would give falsely high scores).
  if (ocrMethod === 'demo-fallback') {
    const score = 32;
    return {
      result: 'SUSPICIOUS',
      status: 'suspicious',
      confidence: score / 100,
      authenticity_score: score,
      batch_number: options.batchNumber || null,
      extracted_text: '',
      ai_result: {
        status: 'SUSPICIOUS',
        confidence: score,
        reason: 'OCR could not extract readable pharmaceutical text from this image. ' +
          'Please upload a well-lit, in-focus photograph of the medicine label.',
        detected_issues: [
          'No readable text extracted from image',
          'Ensure medicine label is fully visible and well-lit',
          'Try a closer shot — label text must fill the frame',
        ],
        fields_found: {},
        evidence: { fieldCount: 0, ocrMethod, ocrConfidence: 0, redFlags: [] },
      },
      diagnostics: { ocrMethod, ocrConfidence: 0, fieldCount: 0, fusedScore: score, finalScore: score, redFlags: [], aiProvider: 'rule-based', aiModel: 'none', medicine_name: options.medicineName || 'Unknown' },
    };
  }

  // Step 2: AI Analysis (Ollama + fallback)
  const aiResult = await analyzeWithAI(extractedText);

  // Step 3: Field Extraction + DB Validation
  const fields = extractFields(extractedText);

  // Step 4: Confidence Fusion
  const fusedScore = fuseConfidence(aiResult, fields, ocrConfidence, ocrMethod);

  // Step 5: Verdict
  const { status, score } = determineVerdict(aiResult, fields, fusedScore);

  const confidence = clamp(score / 100, 0, 1);
  const batchNumber = options.batchNumber || fields.batchNum || null;

  // Merge AI issues + red flags
  const allIssues = [...(aiResult.detected_issues || []), ...fields.redFlags]
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .slice(0, 10);

  return {
    result: status === 'authentic' ? 'SAFE' : status === 'counterfeit' ? 'FAKE' : 'SUSPICIOUS',
    status,
    confidence,
    authenticity_score: score,
    batch_number: batchNumber,
    extracted_text: extractedText,
    ai_result: {
      status: status === 'authentic' ? 'SAFE' : status === 'counterfeit' ? 'FAKE' : 'SUSPICIOUS',
      confidence: score,
      reason: aiResult.reason,
      detected_issues: allIssues,
      fields_found: aiResult.fields_found || fields.present,
      evidence: {
        fieldCount: fields.fieldCount,
        fieldsPresent: fields.present,
        extractedBatch: fields.batchNum,
        extractedExpiry: fields.expiryStr,
        extractedManufacturer: fields.mfrStr,
        extractedDosage: fields.dosageStr,
        redFlags: fields.redFlags,
        mfrValidation: fields.mfrValidation,
        batchValidation: fields.batchValidation,
        expiryValidation: fields.expiryValidation,
        ocrMethod,
        ocrConfidence,
      },
    },
    diagnostics: {
      ocrMethod,
      ocrConfidence,
      fieldCount: fields.fieldCount,
      fusedScore,
      finalScore: score,
      redFlags: fields.redFlags,
      aiProvider: 'ollama',
      aiModel: process.env.OLLAMA_MODEL || 'llama3',
      dbValidation: {
        manufacturer: fields.mfrValidation,
        batch: fields.batchValidation,
        expiry: fields.expiryValidation,
        composition: fields.compValidation,
        medicine: fields.medValidation,
      },
      medicine_name: options.medicineName || 'Unknown',
    },
  };
};
