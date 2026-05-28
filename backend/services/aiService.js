const {
  validateMedicineName,
  validateManufacturer,
  validateBatchNumber,
  validateExpiryDate,
  validateComposition,
} = require('../data/medicineDatabase');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '20000', 10);

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(text) {
  return `You are a senior pharmaceutical quality control expert and forensic document examiner.

Analyze the following text extracted from a medicine package via OCR and classify its authenticity.

EXTRACTED TEXT:
"""
${text}
"""

AUTHENTICATION PROTOCOL:
1. Medicine name — Is it a real WHO/FDA/IP approved drug? Any unusual spelling?
2. Manufacturer — Is it a recognized Indian or global pharmaceutical company?
3. Batch number — Does it follow standard format (e.g. PCM-2024-0312, AMX20240001)?
4. Expiry date — Present, valid, and in the future? Does expiry exceed 10 years?
5. Manufacturing date — Logically before expiry? Not in the future?
6. Dosage strength — Appropriate for the medicine category (e.g. 500mg Paracetamol)?
7. Composition — Active ingredient listed with pharmacopoeia reference (IP/BP/USP)?
8. Storage instructions — Present and appropriate?
9. Regulatory compliance — Schedule H/G/X notation? Rx-only marking?
10. Red flags — Impossible dates, unknown manufacturer, poor grammar, suspicious claims?

VERDICT CRITERIA:
- SAFE (Authentic): All critical fields present, recognized manufacturer, valid dates, proper pharmacopoeia references
- SUSPICIOUS: 1-2 fields missing, unrecognized but plausible manufacturer, minor inconsistencies
- FAKE (Counterfeit): Multiple critical fields missing, unknown manufacturer with poor grammar, impossible dates, batch format violations, packaging clone indicators

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "classification": "SAFE" | "SUSPICIOUS" | "FAKE",
  "confidence": <integer 0-100>,
  "reasoning": "<2-4 sentence professional assessment explaining the verdict>",
  "anomalies": ["<specific issue 1>", "<specific issue 2>"],
  "fields_found": {
    "medicine_name": true|false,
    "manufacturer": true|false,
    "batch_number": true|false,
    "expiry_date": true|false,
    "mfg_date": true|false,
    "dosage": true|false,
    "composition": true|false,
    "storage": true|false,
    "regulatory": true|false
  }
}`;
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseOllamaResponse(rawText) {
  try {
    // Strip markdown code fences if present
    const stripped = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*"classification"[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON block found');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      status: normalizeStatus(parsed.classification),
      confidence: clampInt(parsed.confidence, 0, 100),
      reason: String(parsed.reasoning || 'AI analysis completed.').trim(),
      detected_issues: Array.isArray(parsed.anomalies)
        ? parsed.anomalies.filter(Boolean).slice(0, 10)
        : [],
      fields_found: parsed.fields_found || null,
    };
  } catch {
    return advancedRuleBasedFallback(rawText);
  }
}

function normalizeStatus(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (s === 'SAFE' || s === 'AUTHENTIC') return 'SAFE';
  if (s === 'FAKE' || s === 'COUNTERFEIT') return 'FAKE';
  return 'SUSPICIOUS';
}

function clampInt(val, min, max) {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : Math.round((min + max) / 2);
}

// ─── Advanced Rule-Based Fallback ─────────────────────────────────────────────
// Used when Ollama is unavailable or returns unparseable output.

function advancedRuleBasedFallback(text) {
  const t = String(text || '');
  if (t.trim().length < 10) {
    return {
      status: 'SUSPICIOUS',
      confidence: 45,
      reason: 'Insufficient text extracted from image. Cannot complete authentication. Please ensure the medicine label is clearly visible and well-lit.',
      detected_issues: ['Low OCR quality — insufficient text extracted for analysis'],
      fields_found: null,
    };
  }

  const lower = t.toLowerCase();

  // ── Field Detection (10 fields) ──
  const fields = {
    medicine_name: /\b(tablet|capsule|syrup|injection|cream|ointment|drops|gel|suspension|inhaler|powder|solution)\b/i.test(t) ||
      validateMedicineName(t).valid,
    manufacturer: /\b(pharma|laboratory|laboratories|labs|healthcare|biotech|lifesciences|life\s*sciences|chemical|medicraft|medico)\b/i.test(t) ||
      /\b(ltd|limited|pvt\.?\s*ltd|inc\.?|corp\.?|industries|co\.|llc)\b/i.test(t) ||
      validateManufacturer(t).valid,
    batch_number: /\b(batch|lot|b\.?\s*no\.?|bn)\s*[:\-#\.]?\s*[A-Z0-9][A-Z0-9\-]{2,}/i.test(t),
    expiry_date: /\b(exp(?:iry|iration)?|use\s*(?:before|by))\b/i.test(t) &&
      /\b(0?[1-9]|1[0-2])[\/\-]20?\d{2,4}\b/.test(t),
    mfg_date: /\b(mfg|mfd|manufacture[d]?\s*(?:date)?|date\s*of\s*manufacture)\b/i.test(t),
    dosage: /\b\d{1,4}\s*(mg|ml|mcg|g|iu|%)\b/i.test(t),
    composition: /\b(composition|contains|active\s*ingredient|each\s+\w+\s+contains)\b/i.test(t),
    storage: /\b(store|storage|keep|protect|temperature)\b/i.test(t),
    regulatory: /\b(ip\b|b\.?p\.?\b|u\.?s\.?p\.?\b|schedule\s*[hgx]|rx\s*only|prescription)\b/i.test(t),
    manufacturer_known: validateManufacturer(t).score >= 60,
  };

  const fieldCount = Object.values(fields).filter(Boolean).length;
  const maxFields = 10;

  // ── Issue Collection ──
  const issues = [];
  if (!fields.batch_number) issues.push('Missing or unreadable batch/lot number');
  if (!fields.expiry_date) issues.push('Expiry date not found or unreadable');
  if (!fields.manufacturer) issues.push('Manufacturer information missing');
  if (!fields.dosage) issues.push('Dosage strength not specified');
  if (!fields.composition) issues.push('Active ingredient/composition missing');
  if (!fields.medicine_name) issues.push('Medicine name/form unclear');
  if (!fields.regulatory) issues.push('No pharmacopoeia reference (IP/BP/USP) found');
  if (!fields.mfg_date) issues.push('Manufacturing date missing');

  // ── Red Flag Detection ──
  const redFlags = [];

  // Impossible/suspicious dates
  const yearMatches = [...t.matchAll(/\b(20\d{2})\b/g)].map(m => parseInt(m[1]));
  if (yearMatches.length >= 2) {
    const minY = Math.min(...yearMatches), maxY = Math.max(...yearMatches);
    if (maxY - minY > 10) redFlags.push('Suspicious date range (>10 years span)');
  }
  const currentYear = new Date().getFullYear();
  if (yearMatches.some(y => y < 2010)) redFlags.push('Implausible manufacturing date found');
  if (yearMatches.some(y => y > currentYear + 10)) redFlags.push('Suspicious future date (>10 years ahead)');

  // Cloning/fraud signals
  if (/\b(copy|duplicate|repackaged|not\s*for\s*retail|sample\s*only)\b/i.test(t)) {
    redFlags.push('Suspicious packaging disclaimer found');
  }
  if (/\b(guaranty|guaranted|guranteed|authnticated|authenticted)\b/i.test(t)) {
    redFlags.push('Misspelled authentication claim');
  }

  // ── Scoring — confidence varies naturally with field count + text quality ──
  let status, confidence;
  const effectiveScore = fieldCount + (fields.manufacturer_known ? 2 : 0) - redFlags.length;

  // Text quality factor (0.0–1.0): longer text = more evidence to work with
  const textQuality = Math.min(t.length / 300, 1.0);

  if (redFlags.length >= 2 || (fieldCount <= 1 && redFlags.length >= 1)) {
    status = 'FAKE';
    confidence = 65 + redFlags.length * 5;
  } else if (effectiveScore >= 9) {
    status = 'SAFE';
    confidence = 80 + Math.min(effectiveScore - 9, 4) * 4;
  } else if (effectiveScore >= 7) {
    status = 'SAFE';
    confidence = 72 + (effectiveScore - 7) * 4;
  } else if (effectiveScore >= 5) {
    status = 'SUSPICIOUS';
    confidence = Math.round(64 + (effectiveScore - 5) * 6 + textQuality * 6);
  } else if (effectiveScore >= 3) {
    status = 'SUSPICIOUS';
    confidence = Math.round(52 + (effectiveScore - 3) * 6 + textQuality * 5);
  } else if (effectiveScore >= 1) {
    status = 'SUSPICIOUS';
    confidence = Math.round(38 + effectiveScore * 7 + textQuality * 6);
  } else {
    // Zero fields — could be unreadable image or genuinely empty label
    status = 'SUSPICIOUS';
    // Score varies with text length: a screenshot with lots of text differs from a blank image
    confidence = Math.round(25 + textQuality * 15);
    issues.push('No pharmaceutical labeling fields detected — image may not show a medicine package');
  }

  confidence = clampInt(confidence, 18, 98);

  const fieldSummary = `Rule-based analysis: ${fieldCount}/${maxFields} packaging fields detected.`;
  const redFlagSummary = redFlags.length > 0 ? ` Red flags: ${redFlags.join(', ')}.` : '';
  const issueSummary = issues.length > 0
    ? ` Missing: ${issues.slice(0, 3).join(', ')}.`
    : ' All critical fields present.';

  return {
    status,
    confidence,
    reason: `${fieldSummary}${issueSummary}${redFlagSummary}`,
    detected_issues: [...issues, ...redFlags].slice(0, 8),
    fields_found: fields,
  };
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

async function analyzeMedicine(extractedText) {
  const text = String(extractedText || '').trim();

  if (text.length < 15) {
    return advancedRuleBasedFallback(text);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: buildPrompt(text),
        stream: false,
        options: {
          temperature: 0.05,
          top_p: 0.85,
          num_predict: 600,
          repeat_penalty: 1.1,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      const result = parseOllamaResponse(data.response || '');
      console.log(`[AI] Ollama(${OLLAMA_MODEL}): ${result.status} @ ${result.confidence}%`);
      return result;
    }

    console.warn('[AI] Ollama returned non-OK status:', response.status);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[AI] Ollama timed out after', OLLAMA_TIMEOUT_MS, 'ms');
    } else {
      console.warn('[AI] Ollama unavailable:', err.message);
    }
  }

  return advancedRuleBasedFallback(text);
}

module.exports = { analyzeMedicine };
