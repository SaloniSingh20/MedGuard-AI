const mongoose = require('mongoose');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: `Invalid ${paramName}` });
  }
  next();
};

const validateImageUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image uploaded' });
  }
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({ success: false, error: 'Invalid file type. Upload an image.' });
  }
  next();
};

module.exports = { validateObjectId, validateImageUpload };
