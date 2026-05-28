// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedGuardVerification
 * @notice Immutable on-chain medicine verification log with batch history and anomaly detection.
 */
contract MedGuardVerification {
    enum Verdict { AUTHENTIC, SUSPICIOUS, COUNTERFEIT }

    struct VerificationRecord {
        string verificationId;
        string batchNumber;
        bytes32 medicineHash;
        Verdict verdict;
        uint16 confidenceBps;  // confidence * 100 (e.g. 9500 = 95%)
        address verifier;
        uint256 timestamp;
    }

    // All verification records
    VerificationRecord[] private _records;

    // batch -> record indices
    mapping(string => uint256[]) private _batchIndices;

    // verificationId -> record index (+1 so 0 means not found)
    mapping(string => uint256) private _idIndex;

    address public immutable owner;

    event VerificationRecorded(
        string indexed verificationId,
        string indexed batchNumber,
        Verdict verdict,
        uint256 timestamp
    );

    event SuspiciousBatchDetected(string indexed batchNumber, uint256 flagCount);

    modifier onlyOwner() {
        require(msg.sender == owner, "MedGuard: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Record a verification result on-chain.
     * @param verificationId  Off-chain MongoDB ObjectId as string
     * @param batchNumber     Medicine batch/lot identifier
     * @param medicineHash    keccak256 of (medicineName + batchNumber)
     * @param verdict         0=AUTHENTIC, 1=SUSPICIOUS, 2=COUNTERFEIT
     * @param confidenceBps   Confidence * 100 (0-10000)
     */
    function recordVerification(
        string calldata verificationId,
        string calldata batchNumber,
        bytes32 medicineHash,
        Verdict verdict,
        uint16 confidenceBps
    ) external {
        require(bytes(verificationId).length > 0, "MedGuard: empty id");
        require(bytes(batchNumber).length > 0, "MedGuard: empty batch");
        require(_idIndex[verificationId] == 0, "MedGuard: duplicate id");

        _records.push(VerificationRecord({
            verificationId: verificationId,
            batchNumber: batchNumber,
            medicineHash: medicineHash,
            verdict: verdict,
            confidenceBps: confidenceBps,
            verifier: msg.sender,
            timestamp: block.timestamp
        }));

        uint256 idx = _records.length; // 1-based
        _idIndex[verificationId] = idx;
        _batchIndices[batchNumber].push(idx - 1); // 0-based

        emit VerificationRecorded(verificationId, batchNumber, verdict, block.timestamp);

        // Alert on suspicious batch pattern
        uint256[] storage indices = _batchIndices[batchNumber];
        if (indices.length >= 2) {
            uint256 flagCount = 0;
            for (uint256 i = 0; i < indices.length; i++) {
                if (_records[indices[i]].verdict != Verdict.AUTHENTIC) {
                    flagCount++;
                }
            }
            if (flagCount >= 2) {
                emit SuspiciousBatchDetected(batchNumber, flagCount);
            }
        }
    }

    /**
     * @notice Get all verification records for a batch.
     */
    function getBatchHistory(string calldata batchNumber)
        external
        view
        returns (VerificationRecord[] memory)
    {
        uint256[] storage indices = _batchIndices[batchNumber];
        VerificationRecord[] memory result = new VerificationRecord[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            result[i] = _records[indices[i]];
        }
        return result;
    }

    /**
     * @notice Get a single verification by its off-chain ID.
     */
    function getVerification(string calldata verificationId)
        external
        view
        returns (VerificationRecord memory)
    {
        uint256 idx = _idIndex[verificationId];
        require(idx != 0, "MedGuard: not found");
        return _records[idx - 1];
    }

    /**
     * @notice Check if a batch has suspicious history.
     */
    function isBatchSuspicious(string calldata batchNumber)
        external
        view
        returns (bool, uint256 totalCount, uint256 flaggedCount)
    {
        uint256[] storage indices = _batchIndices[batchNumber];
        totalCount = indices.length;
        flaggedCount = 0;

        for (uint256 i = 0; i < indices.length; i++) {
            if (_records[indices[i]].verdict != Verdict.AUTHENTIC) {
                flaggedCount++;
            }
        }

        return (flaggedCount >= 2, totalCount, flaggedCount);
    }

    /**
     * @notice Total number of verifications recorded.
     */
    function totalVerifications() external view returns (uint256) {
        return _records.length;
    }
}
