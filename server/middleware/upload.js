const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|rtf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt, rtf)'));
  }
};

// Storage configuration
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  // Use Cloudinary for production
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'skillswap',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
      resource_type: 'auto',
      public_id: (req, file) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        return `${file.fieldname}-${uniqueName}`;
      }
    }
  });
} else {
  // Use local storage for development
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Use image filter for avatar uploads, document filter for others
    if (file.fieldname === 'avatar') {
      imageFilter(req, file, cb);
    } else {
      documentFilter(req, file, cb);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
  }
  
  if (error.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// Specialized upload configurations
const avatarUpload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
  },
  fileFilter: imageFilter
});

const documentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
  },
  fileFilter: documentFilter
});

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
module.exports.avatarUpload = avatarUpload;
module.exports.documentUpload = documentUpload;
