const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the public/images directory exists
const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage }).single('image');

// Upload Controller Function
exports.uploadImage = (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Image upload failed' });
    }

    const imageUrl = `http://localhost:5000/images/${req.file.filename}`;
    res.json({ imageUrl });
  });
};
