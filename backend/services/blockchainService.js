let ethers = null;
try {
  ethers = require('ethers');
} catch {
  // ethers not installed — blockchain integration disabled
}

const fs = require('fs');
const path = require('path');

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || null;
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

let contractInstance = null;

function loadABI() {
  try {
    const abiPath = path.resolve(
      __dirname, '..', '..', 'blockchain', 'artifacts',
      'contracts', 'MedGuardVerification.sol', 'MedGuardVerification.json'
    );
    if (fs.existsSync(abiPath)) {
      return JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;
    }
  } catch {
    // ABI not available
  }
  return null;
}

async function getContract() {
  if (!ethers || !CONTRACT_ADDRESS) return null;
  if (contractInstance) return contractInstance;

  try {
    const abi = loadABI();
    if (!abi) return null;

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider
    );
    contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
    return contractInstance;
  } catch {
    return null;
  }
}

async function recordVerification(verificationId, batchNumber, medicineHash, verdict, confidence) {
  const contract = await getContract();
  if (!contract) return null;

  try {
    const verdictCode = verdict === 'authentic' ? 0 : verdict === 'suspicious' ? 1 : 2;
    const tx = await contract.recordVerification(
      verificationId,
      batchNumber,
      medicineHash,
      verdictCode,
      Math.round(confidence * 100)
    );
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    console.warn('[Blockchain] Failed to record verification:', err.message);
    return null;
  }
}

async function getBatchHistory(batchNumber) {
  const contract = await getContract();
  if (!contract) return [];

  try {
    const history = await contract.getBatchHistory(batchNumber);
    return history;
  } catch {
    return [];
  }
}

async function checkDuplicateBatch(batchNumber) {
  const history = await getBatchHistory(batchNumber);
  if (!history || history.length === 0) return { isDuplicate: false, count: 0, verdicts: [] };

  const verdicts = history.map((h) => (h.verdict === 0 ? 'authentic' : h.verdict === 1 ? 'suspicious' : 'counterfeit'));
  const suspiciousCount = verdicts.filter((v) => v !== 'authentic').length;

  return {
    isDuplicate: verdicts.length > 1,
    count: verdicts.length,
    verdicts,
    suspiciousCount,
    isFlaggedBatch: suspiciousCount >= 2,
  };
}

module.exports = { recordVerification, getBatchHistory, checkDuplicateBatch };
