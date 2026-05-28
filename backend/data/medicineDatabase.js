/**
 * Pharmaceutical reference database for medicine authenticity validation.
 * Sources: WHO Essential Medicines List, FDA Orange Book, Indian Pharmacopoeia,
 *          Central Drugs Standard Control Organisation (CDSCO) approved drugs.
 */

// ─── Approved Medicine Names ────────────────────────────────────────────────

const APPROVED_MEDICINES = new Set([
  // Analgesics & Antipyretics
  'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'diclofenac',
  'naproxen', 'nimesulide', 'mefenamic acid', 'tramadol', 'codeine',
  'morphine', 'oxycodone', 'ketorolac', 'piroxicam', 'indomethacin',
  'aceclofenac', 'etoricoxib', 'celecoxib',

  // Antibiotics & Antimicrobials
  'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
  'metronidazole', 'clarithromycin', 'cefixime', 'cephalexin', 'ampicillin',
  'penicillin', 'clindamycin', 'erythromycin', 'tetracycline', 'amoxicillin clavulanate',
  'augmentin', 'co-amoxiclav', 'levofloxacin', 'norfloxacin', 'ofloxacin',
  'ceftriaxone', 'cefuroxime', 'linezolid', 'vancomycin', 'meropenem',
  'piperacillin tazobactam', 'trimethoprim sulfamethoxazole', 'co-trimoxazole',
  'nitrofurantoin', 'fosfomycin',

  // Cardiovascular
  'atorvastatin', 'rosuvastatin', 'simvastatin', 'lovastatin', 'pravastatin',
  'metoprolol', 'amlodipine', 'lisinopril', 'losartan', 'ramipril',
  'enalapril', 'hydrochlorothiazide', 'furosemide', 'digoxin', 'warfarin',
  'clopidogrel', 'atenolol', 'propranolol', 'verapamil', 'diltiazem',
  'nifedipine', 'spironolactone', 'bisoprolol', 'carvedilol', 'telmisartan',
  'valsartan', 'irbesartan', 'olmesartan', 'nebivolol', 'isosorbide',
  'nitroglycerin', 'aspirin', 'ticagrelor', 'rivaroxaban', 'apixaban',
  'dabigatran', 'heparin', 'enoxaparin',

  // Diabetes & Endocrine
  'metformin', 'glipizide', 'glyburide', 'glimepiride', 'glibenclamide',
  'insulin', 'sitagliptin', 'pioglitazone', 'repaglinide', 'acarbose',
  'empagliflozin', 'dapagliflozin', 'canagliflozin', 'liraglutide',
  'levothyroxine', 'thyroxine', 'carbimazole', 'propylthiouracil',

  // Respiratory
  'salbutamol', 'albuterol', 'budesonide', 'montelukast', 'theophylline',
  'ipratropium', 'salmeterol', 'formoterol', 'tiotropium', 'fluticasone',
  'beclomethasone', 'prednisolone', 'dexamethasone',

  // Antihistamines & Allergy
  'cetirizine', 'loratadine', 'fexofenadine', 'chlorphenamine', 'chlorpheniramine',
  'diphenhydramine', 'levocetirizine', 'desloratadine', 'hydroxyzine',
  'promethazine', 'azelastine',

  // Gastrointestinal
  'omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole', 'rabeprazole',
  'ranitidine', 'famotidine', 'cimetidine', 'metoclopramide', 'domperidone',
  'ondansetron', 'granisetron', 'loperamide', 'lactulose', 'bisacodyl',
  'senna', 'magnesium hydroxide', 'aluminum hydroxide', 'sucralfate',
  'mesalazine', 'sulfasalazine',

  // Neurological & Psychiatric
  'diazepam', 'alprazolam', 'lorazepam', 'clonazepam', 'phenytoin',
  'carbamazepine', 'valproate', 'sodium valproate', 'levodopa', 'carbidopa',
  'amitriptyline', 'fluoxetine', 'sertraline', 'escitalopram', 'citalopram',
  'paroxetine', 'venlafaxine', 'duloxetine', 'olanzapine', 'risperidone',
  'quetiapine', 'haloperidol', 'lithium', 'lamotrigine', 'topiramate',
  'gabapentin', 'pregabalin', 'levetiracetam',

  // Vitamins & Supplements
  'vitamin c', 'ascorbic acid', 'vitamin d', 'cholecalciferol', 'vitamin b12',
  'cyanocobalamin', 'folic acid', 'folate', 'iron sulfate', 'ferrous sulfate',
  'calcium carbonate', 'zinc sulfate', 'zinc acetate', 'magnesium sulfate',
  'multivitamin', 'vitamin e', 'tocopherol', 'vitamin a', 'retinol', 'vitamin k',
  'thiamine', 'riboflavin', 'niacin', 'pyridoxine',

  // Antimalarials & Antiparasitic
  'chloroquine', 'hydroxychloroquine', 'artemether lumefantrine', 'quinine',
  'mefloquine', 'primaquine', 'albendazole', 'mebendazole', 'ivermectin',
  'praziquantel',

  // Antifungals & Antivirals
  'fluconazole', 'itraconazole', 'clotrimazole', 'ketoconazole', 'terbinafine',
  'acyclovir', 'valacyclovir', 'oseltamivir', 'tenofovir', 'lamivudine',
  'efavirenz', 'nevirapine',

  // Steroids & Immunosuppressants
  'prednisolone', 'prednisone', 'dexamethasone', 'hydrocortisone',
  'methylprednisolone', 'betamethasone', 'triamcinolone', 'methotrexate',
  'azathioprine', 'cyclosporine', 'tacrolimus',

  // Urological
  'tamsulosin', 'finasteride', 'dutasteride', 'sildenafil', 'tadalafil',
  'oxybutynin', 'solifenacin',

  // Ophthalmological
  'timolol', 'latanoprost', 'brimonidine', 'dorzolamide', 'atropine',

  // Dermatological
  'clotrimazole', 'miconazole', 'mupirocin', 'fusidic acid', 'benzoyl peroxide',
  'tretinoin', 'adapalene', 'azelaic acid',
]);

// ─── Approved Manufacturers ─────────────────────────────────────────────────

const APPROVED_MANUFACTURERS = new Set([
  // Top Indian Pharmaceutical Companies
  'cipla', 'cipla ltd', 'cipla limited',
  'sun pharma', 'sun pharmaceutical', 'sun pharmaceutical industries',
  'sun pharmaceutical industries ltd', 'sun pharmaceutical industries limited',
  "dr reddy's", "dr. reddy's", "dr reddy's laboratories", "dr. reddy's laboratories",
  "dr. reddy's laboratories ltd", "dr. reddy's laboratories limited",
  'lupin', 'lupin ltd', 'lupin limited', 'lupin pharmaceuticals',
  'mankind pharma', 'mankind pharma ltd', 'mankind pharmaceuticals',
  'zydus', 'cadila', 'zydus cadila', 'zydus healthcare', 'zydus lifesciences',
  'torrent', 'torrent pharma', 'torrent pharmaceuticals', 'torrent pharmaceuticals ltd',
  'glenmark', 'glenmark pharmaceuticals', 'glenmark pharmaceuticals ltd',
  'alkem', 'alkem laboratories', 'alkem laboratories ltd',
  'alembic', 'alembic pharmaceuticals', 'alembic pharmaceuticals ltd',
  'abbott india', 'abbott india ltd', 'abbott laboratories',
  'pfizer india', 'pfizer limited',
  'glaxosmithkline', 'gsk', 'gsk pharmaceuticals', 'gsk india',
  'novartis india', 'novartis',
  'sanofi india', 'sanofi',
  'wockhardt', 'wockhardt ltd',
  'ipca', 'ipca laboratories', 'ipca laboratories ltd',
  'aurobindo', 'aurobindo pharma', 'aurobindo pharma ltd',
  'divi laboratories', "divi's laboratories",
  'biocon', 'biocon ltd',
  'piramal', 'piramal pharma', 'piramal healthcare',
  'emcure pharmaceuticals', 'emcure',
  'macleods pharmaceuticals', 'macleods',
  'aristo pharmaceuticals',
  'micro labs', 'micro labs ltd',
  'intas pharmaceuticals', 'intas pharma',
  'natco pharma',
  'hetero healthcare', 'hetero drugs',
  'strides pharma', 'strides arcolab',
  'granules india',
  'laurus labs',
  'bliss gvs pharma',
  'bal pharma',
  'Franco-Indian pharmaceuticals',
  'nicholas piramal',
  'ranbaxy', 'ranbaxy laboratories',
  'elder pharmaceuticals',
  'albert david',
  'unichem laboratories',
  'indoco remedies',
  'shreya life sciences',
  'east india pharmaceutical',
  'morepen laboratories',

  // Global Pharmaceutical Companies
  'pfizer', 'pfizer inc',
  'johnson & johnson', "johnson's", 'j&j',
  'roche', 'roche ltd',
  'bristol-myers squibb', 'bms',
  'eli lilly', 'lilly',
  'merck', 'merck & co', 'msd',
  'astrazeneca',
  'bayer', 'bayer ag', 'bayer pharmaceuticals',
  'boehringer ingelheim',
  'takeda',
  'amgen',
  'gilead sciences', 'gilead',
  'abbvie',
  'biogen',
  'regeneron',
  'moderna',
  'baxter international',
  'becton dickinson',
  'medtronic',
]);

// ─── Regex Patterns ──────────────────────────────────────────────────────────

const BATCH_PATTERNS = [
  /^[A-Z]{1,5}[\-\/]?\d{4,12}$/i,            // ABC-20240001, PCM-2024-0312
  /^[A-Z]{1,5}\d{4,12}[A-Z]{0,4}$/i,          // PCM20240312A
  /^\d{4,8}[A-Z]{1,6}$/i,                      // 20240312PCM
  /^[A-Z0-9]{6,18}$/i,                          // Pure alphanumeric
  /^[A-Z]{1,4}[\-\/]?[A-Z0-9]{2,4}[\-\/]?\d{4,8}$/i, // AMX-IN-20240312
];

const EXPIRY_REGEXES = [
  /\b(0?[1-9]|1[0-2])[\/\-](20\d{2})\b/,                     // MM/YYYY
  /\b(0?[1-9]|1[0-2])[\/\-](\d{2})\b/,                       // MM/YY
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[,\-\/\s]*(20\d{2}|\d{2})\b/i,  // Jan 2026
  /\b(20\d{2})[\/\-](0?[1-9]|1[0-2])\b/,                     // YYYY/MM
];

// ─── Validation Functions ────────────────────────────────────────────────────

function validateMedicineName(name) {
  if (!name || String(name).trim().length < 3) return { valid: false, score: 0 };
  const lower = String(name).toLowerCase().replace(/[^a-z0-9\s\-]/g, ' ').replace(/\s+/g, ' ').trim();

  // Direct exact match
  if (APPROVED_MEDICINES.has(lower)) return { valid: true, score: 100, match: lower };

  // Partial / contains match
  for (const med of APPROVED_MEDICINES) {
    if (lower.includes(med) || med.includes(lower)) return { valid: true, score: 85, match: med };
  }

  // Pharmaceutical suffix heuristic
  const pharmaSuffixes = /\b(cillin|mycin|oxacin|cycline|mide|pril|sartan|olol|oxetine|pine|azole|conazole|zolam|pam|lone|mab|nib|mib|tinib|zumab|mumab|lumab)\b/i;
  if (pharmaSuffixes.test(name)) return { valid: true, score: 65, match: null };

  // Known pharmaceutical word patterns
  const pharmaPattern = /\b(hydro|chloro|sulfa|nitro|benz|ampi|ceph|tetra|metho|thia|dexa)\w+\b/i;
  if (pharmaPattern.test(name)) return { valid: true, score: 55, match: null };

  return { valid: false, score: 20 };
}

function validateManufacturer(text) {
  if (!text || String(text).trim().length < 3) return { valid: false, score: 0, name: null };
  const lower = String(text).toLowerCase().replace(/\s+/g, ' ');

  // Exact match against approved manufacturers
  for (const mfr of APPROVED_MANUFACTURERS) {
    if (lower.includes(mfr)) return { valid: true, score: 100, name: mfr };
  }

  // Generic pharmaceutical company keywords
  const genericPharmaWords = [
    'pharmaceuticals', 'pharma', 'laboratory', 'laboratories', 'labs',
    'healthcare', 'medical', 'biotech', 'lifesciences', 'life sciences',
    'chemical', 'biosciences', 'medicraft', 'medico', 'medilab',
  ];
  for (const word of genericPharmaWords) {
    if (lower.includes(word)) return { valid: true, score: 60, name: null };
  }

  // Ltd / Limited / Inc keywords
  if (/\b(ltd|limited|pvt\.?\s*ltd|inc|corp|co\.|llc)\b/i.test(text)) {
    return { valid: true, score: 50, name: null };
  }

  return { valid: false, score: 10, name: null };
}

function validateBatchNumber(batch) {
  if (!batch || String(batch).trim().length < 3) return { valid: false, score: 0 };
  const clean = String(batch).toUpperCase().replace(/\s/g, '');

  // Check against known bad patterns
  const badPatterns = /^(0{4,}|1{4,}|A{4,}|X{4,}|Z{4,}|AAAA|XXXX|ZZZZ|1234|ABCD|TEST|FAKE|DUMMY)$/i;
  if (badPatterns.test(clean)) return { valid: false, score: 0, suspicious: true };

  // Check against valid patterns
  for (const pattern of BATCH_PATTERNS) {
    if (pattern.test(clean)) return { valid: true, score: 90 };
  }

  // Basic sanity: alphanumeric, reasonable length
  if (/^[A-Z0-9\-\/]{4,20}$/.test(clean)) return { valid: true, score: 65 };

  return { valid: false, score: 25 };
}

function validateExpiryDate(text) {
  if (!text || String(text).trim().length < 4) return { valid: false, score: 0, expired: false };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  for (const regex of EXPIRY_REGEXES) {
    const match = String(text).match(regex);
    if (!match) continue;

    const full = match[0];

    // Extract year
    const yearMatch = full.match(/20\d{2}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const monthMatch = full.match(/\b(0?[1-9]|1[0-2])\b/);
      const month = monthMatch ? parseInt(monthMatch[1]) : 6;

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { valid: true, score: 80, expired: true, dateStr: full };
      }
      if (year > currentYear + 10) {
        return { valid: true, score: 40, expired: false, suspicious: true, dateStr: full };
      }
      return { valid: true, score: 100, expired: false, dateStr: full };
    }

    // Two-digit year
    const yyMatch = full.match(/\/(\d{2})$/);
    if (yyMatch) {
      const year = 2000 + parseInt(yyMatch[1]);
      return {
        valid: true,
        score: 90,
        expired: year < currentYear,
        dateStr: full,
      };
    }

    return { valid: true, score: 75, expired: false, dateStr: full };
  }

  return { valid: false, score: 0, expired: false };
}

function validateComposition(text) {
  if (!text) return { valid: false, score: 0 };
  const lower = String(text).toLowerCase();

  // Pharmacopoeia references indicate legitimate labeling
  const pharmaRef = /\b(ip|bp|usp|ph\.?\s*eur|i\.p\.|b\.p\.)\b/i.test(text);
  const hasDosage = /\b\d{1,4}\s*(mg|ml|mcg|iu|%)\b/i.test(text);
  const hasIngredient = APPROVED_MEDICINES.has(lower.trim()) ||
    [...APPROVED_MEDICINES].some(m => lower.includes(m));

  let score = 0;
  if (hasIngredient) score += 50;
  if (hasDosage) score += 30;
  if (pharmaRef) score += 20;

  return { valid: score >= 30, score: Math.min(score, 100), pharmaRef, hasDosage, hasIngredient };
}

module.exports = {
  APPROVED_MEDICINES,
  APPROVED_MANUFACTURERS,
  validateMedicineName,
  validateManufacturer,
  validateBatchNumber,
  validateExpiryDate,
  validateComposition,
};
