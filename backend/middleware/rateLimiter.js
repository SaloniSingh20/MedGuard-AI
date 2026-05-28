let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  rateLimit = null;
}

const makeRateLimiter = (opts = {}) => {
  if (!rateLimit) {
    return (req, res, next) => next();
  }
  return rateLimit({
    windowMs: opts.windowMs || 15 * 60 * 1000,
    max: opts.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
    ...opts,
  });
};

const apiLimiter = makeRateLimiter({ max: 100 });
const uploadLimiter = makeRateLimiter({ windowMs: 60 * 1000, max: 10 });

module.exports = { apiLimiter, uploadLimiter };
