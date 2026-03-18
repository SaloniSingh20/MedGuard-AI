module.exports = function analyzeMedicine(imagePath) {
  // Simulated AI logic using dataset rules
  const fakeKeywords = ["fake", "duplicate", "low-quality"];
  const realKeywords = ["original", "verified", "genuine"];
  // Simple mock AI logic
  const random = Math.random();
  if (random > 0.5) {
    return {
      result: "REAL",
      confidence: (0.9 + Math.random() * 0.1) // float between 0.9 and 1.0
    };
  } else {
    return {
      result: "FAKE",
      confidence: (0.7 + Math.random() * 0.2) // float between 0.7 and 0.9
    };
  }
};
