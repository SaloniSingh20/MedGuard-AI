const { extractTextFromImage } = require("./services/ocrService");
const { analyzeMedicine: analyzeWithOllama } = require("./services/aiService");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mapAiStatus(status) {
  const normalized = String(status || "SUSPICIOUS").toUpperCase();
  if (normalized === "SAFE") return "authentic";
  if (normalized === "FAKE") return "counterfeit";
  return "suspicious";
}

function extractEvidence(ocrText) {
  const text = String(ocrText || "");
  const lower = text.toLowerCase();

  const manufacturer =
    /(?:manufactured\s*by|mfd\s*by|marketed\s*by|manufacturer|company|pharma|laboratories|ltd|limited|pvt\.?\s*ltd\.?|inc\.?|healthcare|biotech|lifesciences)/i.test(text) ||
    /\b(cipla|sun\s*pharma|dr\.?\s*reddy|lupin|mankind|zydus|glenmark|torrent|abbott|bayer|pfizer|novartis)\b/i.test(lower);

  const batchMatch =
    text.match(/(?:batch|lot|b\.?\s*no\.?|bn)\s*[:\-]?\s*([A-Z0-9\-]{3,})/i) ||
    text.match(/\b([A-Z]{2,5}[\-\/]?[A-Z0-9]{3,8})\b/);
  const batch = Boolean(batchMatch?.[1]);

  const expiry =
    /(?:exp|expiry|expires)\s*[:\-]?\s*(?:0?[1-9]|1[0-2])[\/-](?:20)?\d{2,4}/i.test(text) ||
    /(?:0?[1-9]|1[0-2])[\/-](?:20)?\d{2,4}\s*(?:exp|expiry)/i.test(text);

  const dosage = /\b\d{1,4}\s?(mg|ml|mcg|g)\b/i.test(text) || /\b(tablet|capsule|syrup|injection)\b/i.test(lower);

  return {
    manufacturer,
    batch,
    expiry,
    dosage,
    signalScore: [manufacturer, batch, expiry, dosage].filter(Boolean).length,
    extractedBatch: batchMatch?.[1] || null,
  };
}

function hasSevereCounterfeitSignal(reason, issues) {
  const source = [String(reason || ""), ...(Array.isArray(issues) ? issues : [])].join(" ").toLowerCase();
  return /(forged|tamper|tampered|blacklist|invalid\s*qr|counterfeit\s*network|duplicate\s*batch|packaging\s*cloned)/.test(
    source
  );
}

function evaluateBlockchainSignal(evidence) {
  const token = String(evidence?.extractedBatch || "").toUpperCase().trim();
  const hasLetters = /[A-Z]/.test(token);
  const hasDigits = /\d/.test(token);
  const hasDelimiter = /[-/]/.test(token);
  const plausibleLength = token.length >= 6 && token.length <= 14;
  const repeatedPattern = /^(.)\1+$/.test(token) || /(0000|1111|XXXX|AAAA|BBBB|ZZZZ)/.test(token);

  let trust = 0;
  if (evidence?.manufacturer) trust += 28;
  if (evidence?.expiry) trust += 22;
  if (plausibleLength) trust += 16;
  if (hasLetters && hasDigits) trust += 20;
  if (hasDelimiter) trust += 8;
  if (repeatedPattern) trust -= 26;
  if (!token) trust = 0;

  const clampedTrust = clamp(Math.round(trust), 0, 100);
  const risk = clamp(100 - clampedTrust, 0, 100);

  return {
    trust: clampedTrust,
    risk,
    onChainMatch: clampedTrust >= 65,
  };
}

function applyStrictAuthenticGate(aiResult, evidence) {
  const initialStatus = mapAiStatus(aiResult.status);
  const initialConfidence = Number.isFinite(Number(aiResult.confidence))
    ? clamp(Math.round(Number(aiResult.confidence)), 0, 100)
    : 50;
  const severe = hasSevereCounterfeitSignal(aiResult.reason, aiResult.detected_issues);
  const issueCount = Array.isArray(aiResult.detected_issues) ? aiResult.detected_issues.length : 0;
  const blockchain = evaluateBlockchainSignal(evidence);

  let finalStatus = initialStatus;
  let finalScore = initialConfidence;

  const coreFieldCount = [evidence.manufacturer, evidence.batch, evidence.expiry].filter(Boolean).length;
  const hasAllCoreFields = coreFieldCount === 3;
  const strongAuthenticEvidence = coreFieldCount >= 2 && (Boolean(evidence.dosage) || blockchain.trust >= 58);
  const weakEvidence = evidence.signalScore <= 1;

  // Guardrail for authentic: require strong core evidence, but avoid over-penalizing minor OCR misses.
  if (finalStatus === "authentic" && (!strongAuthenticEvidence || finalScore < 72)) {
    finalStatus = "suspicious";
    finalScore = Math.min(Math.max(finalScore, 58), 78);
  }

  // Evidence-first promotion for clearly complete, clean packs.
  if (strongAuthenticEvidence && evidence.signalScore >= 3 && !severe && issueCount <= 1 && finalScore >= 64) {
    finalStatus = "authentic";
    finalScore = Math.max(finalScore, Math.round((76 + blockchain.trust * 0.18)));
  }

  if (finalStatus === "suspicious" && hasAllCoreFields && evidence.signalScore >= 3 && finalScore >= 74 && !severe && issueCount <= 2) {
    finalStatus = "authentic";
    finalScore = Math.max(finalScore, Math.round((78 + blockchain.trust * 0.12)));
  }

  if (
    (severe && finalScore >= 68) ||
    (initialStatus === "counterfeit" && finalScore >= 72 && (blockchain.risk >= 76 || issueCount >= 3 || weakEvidence)) ||
    (weakEvidence && issueCount >= 3 && finalScore >= 55) ||
    (blockchain.risk >= 75 && issueCount >= 2 && finalScore >= 52)
  ) {
    finalStatus = "counterfeit";
    finalScore = Math.max(finalScore, Math.round(80 + blockchain.risk * 0.12));
  }

  // Pull overly harsh counterfeit predictions back when evidence quality is decent.
  if (finalStatus === "counterfeit" && strongAuthenticEvidence && !severe && issueCount <= 1 && blockchain.risk < 70) {
    finalStatus = "suspicious";
    finalScore = Math.min(finalScore, 79);
  }

  if (finalStatus === "counterfeit" && !severe && evidence.signalScore >= 3 && issueCount < 2) {
    finalStatus = "suspicious";
    finalScore = Math.min(finalScore, 80);
  }

  // Promote borderline clean packs to authentic when all core fields are present.
  if (finalStatus === "suspicious" && hasAllCoreFields && evidence.signalScore === 4 && finalScore >= 70 && !severe && issueCount <= 1) {
    finalStatus = "authentic";
    finalScore = Math.max(finalScore, Math.round((76 + blockchain.trust * 0.15)));
  }

  // Final balancing: complete evidence with no strong risk should not remain suspicious.
  if (finalStatus === "suspicious" && strongAuthenticEvidence && !severe && issueCount <= 1 && finalScore >= 60) {
    finalStatus = "authentic";
    finalScore = Math.max(finalScore, Math.round((74 + blockchain.trust * 0.14)));
  }

  // Positive lift: if evidence is mostly complete and blockchain trust is decent, avoid excessive negative bias.
  if (finalStatus === "suspicious" && evidence.signalScore >= 3 && blockchain.trust >= 58 && !severe && issueCount <= 2 && finalScore >= 58) {
    finalStatus = "authentic";
    finalScore = Math.max(finalScore, 72);
  }

  if (finalStatus === "suspicious" && blockchain.risk >= 82 && (severe || issueCount >= 2)) {
    finalStatus = "counterfeit";
    finalScore = Math.max(finalScore, 84);
  }

  return {
    status: finalStatus,
    score: clamp(finalScore, 0, 100),
    evidence: {
      ...evidence,
      blockchain,
    },
  };
}

function statusToPrediction(status) {
  if (status === "authentic") return "SAFE";
  if (status === "counterfeit") return "FAKE";
  return "SUSPICIOUS";
}

module.exports = async function analyzeMedicine(imagePath, options = {}) {
  const extractedText = await extractTextFromImage(imagePath);
  const aiResult = await analyzeWithOllama(extractedText);
  const evidence = extractEvidence(extractedText);
  const gated = applyStrictAuthenticGate(aiResult, evidence);

  const confidence = clamp(gated.score / 100, 0, 1);

  return {
    result: statusToPrediction(gated.status),
    status: gated.status,
    confidence,
    authenticity_score: gated.score,
    batch_number: options.batchNumber || evidence.extractedBatch || null,
    extracted_text: extractedText,
    ai_result: {
      status: statusToPrediction(gated.status),
      confidence: gated.score,
      reason: aiResult.reason,
      detected_issues: aiResult.detected_issues || [],
      evidence: gated.evidence,
    },
    diagnostics: {
      provider: "ollama",
      model: process.env.OLLAMA_MODEL || "llama3",
      reason: aiResult.reason,
      detected_issues: aiResult.detected_issues || [],
      evidence: gated.evidence,
      medicine_name: options.medicineName || "Unknown Medicine",
    },
  };
};
