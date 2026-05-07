const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const uuid4 = require("uuid").v4;
const path = require("path");

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// S3 Storage configuration
const s3Storage = multerS3({
    s3: s3,
    bucket: S3_BUCKET_NAME,
    acl: 'public-read', // Makes files publicly accessible
    contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically detect content type
    key: function (req, file, cb) {
        // Supported image formats
        const match = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
        
        // Generate unique filename with original extension
        const fullName = uuid4().replace(/-/g, "") + path.extname(file.originalname);
        
        // Check if file type is supported
        if (match.indexOf(file.mimetype) === -1) {
            // For unsupported formats, still upload but you might want to handle this differently
            return cb(null, fullName);
        }
        
        // For supported image formats
        cb(null, fullName);
    },
    // Optional: Add file size limits
    // limits: {
    //     fileSize: 10 * 1024 * 1024 // 10MB limit
    // },
    // Optional: Add metadata
    metadata: function (req, file, cb) {
        cb(null, {
            fieldName: file.fieldname,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
        });
    }
});

// File filter function (optional - for additional validation)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // You can either reject the file or allow it (depending on your requirements)
        // To reject: cb(new Error('Invalid file type. Only images are allowed.'), false);
        // To allow: cb(null, true);
        cb(null, true); // Allowing all files for now (matching original behavior)
    }
};

// Create multer upload instance
const upload = multer({
    storage: s3Storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit (adjust as needed)
    }
});

// Error handling middleware (optional - use this in your routes)
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size allowed is 50MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files. Maximum allowed is based on your route configuration.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field name. Expected field name is "image".'
            });
        }
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
        return res.status(400).json({
            error: error.message
        });
    }
    
    // AWS S3 specific errors
    if (error.code === 'NetworkingError') {
        return res.status(500).json({
            error: 'Network error occurred while uploading to S3.'
        });
    }
    
    if (error.code === 'NoSuchBucket') {
        return res.status(500).json({
            error: 'S3 bucket not found.'
        });
    }
    
    // Generic error
    console.error('Upload error:', error);
    return res.status(500).json({
        error: 'An error occurred during file upload.'
    });
};

// Enhanced upload object with additional methods
const enhancedUpload = {
    // Single file upload
    single: (fieldName = 'image') => upload.single(fieldName),
    
    // Multiple files upload (array)
    array: (fieldName = 'image', maxCount = 10) => upload.array(fieldName, maxCount),
    
    // Multiple files with different field names
    fields: (fields) => upload.fields(fields),
    
    // Any files
    any: () => upload.any(),
    
    // No files (only text fields)
    none: () => upload.none(),
    
    // Error handling middleware
    handleError: handleUploadError,
    
    // Utility function to delete uploaded file from S3 (in case of application errors)
    deleteFromS3: async (key) => {
        try {
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: key
            };
            await s3.deleteObject(params).promise();
            console.log(`Successfully deleted ${key} from S3`);
            return true;
        } catch (error) {
            console.error(`Error deleting ${key} from S3:`, error);
            return false;
        }
    },
    
    // Utility function to get S3 URL
    getS3Url: (key) => {
        return `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    },
    
    // Utility function to get CDN URL (if CDN is configured)
    getCdnUrl: (key) => {
        if (process.env.CDN_BASE_URL) {
            return `${process.env.CDN_BASE_URL}/${key}`;
        }
        return enhancedUpload.getS3Url(key);
    }
};

module.exports = enhancedUpload;

// Usage examples (comment these out in production):
/*

// Example usage in routes:

// Single file upload
app.post('/upload/single', enhancedUpload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
        message: 'File uploaded successfully',
        file: {
            filename: req.file.key, // S3 key
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            location: req.file.location, // S3 URL
            cdnUrl: enhancedUpload.getCdnUrl(req.file.key)
        }
    });
});

// Multiple files upload
app.post('/upload/multiple', enhancedUpload.array('image', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
        filename: file.key,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        location: file.location,
        cdnUrl: enhancedUpload.getCdnUrl(file.key)
    }));
    
    res.json({
        message: 'Files uploaded successfully',
        files: files
    });
});

// Error handling middleware
app.use(enhancedUpload.handleError);

*/