const multer = require("multer");
const uuid4 = require("uuid").v4;
const path = require("path");

const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

// AWS S3 Configuration
let config = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
};
// console.log('s3 config ',config);
const s3 = new AWS.S3(config);

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_PATH_PREFIX = 'content/video';
const CDN_BASE_URL = process.env.CDN_BASE_URL;

// S3 Storage configuration
const s3Storage = multerS3({
    s3: s3,
    bucket: S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
         console.log('multerS3 start cb ',cb);
        const match = ['video/mp4','video/mov','video/avi','video/mkv']; 
        const fullName = uuid4().replace(/-/g, "") + path.extname(file.originalname);    
        file.filename = fullName;  
        if (match.indexOf(file.mimetype) === -1) {
            return cb(null, false);
        } 
        console.log('multerS3 fullName',fullName);
        cb(null, S3_PATH_PREFIX + `/${fullName}`);
    },
    metadata: function (req, file, cb) {
        cb(null, {
            fieldName: file.fieldname,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            filename: file.filename
        });
    }
});

const fileFilter = (req, file, cb) => {
   console.log('fileFilter',file, cb);   
    const allowedTypes = ['video/mp4','video/mov','video/avi','video/mkv'];    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// Create multer upload instance
const uploadS3 = multer({
    storage: s3Storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit (adjust as needed)
    }
});

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
const upload = {
    single: (fieldName = 'video') => uploadS3.single(fieldName),
    array: (fieldName = 'video', maxCount = 10) => uploadS3.array(fieldName, maxCount),
    fields: (fields) => uploadS3.fields(fields),
    any: () => uploadS3.any(),
    none: () => uploadS3.none(),
    handleError: handleUploadError,
    deleteFromS3: async (key) => {
        try {
            const params = {
                Bucket: S3_BUCKET_NAME,
                Key: S3_PATH_PREFIX + `/${key}`
            };
            await s3.deleteObject(params).promise();
            console.log(`Successfully deleted ${key} from S3`);
            return true;
        } catch (error) {
            console.error(`Error deleting ${key} from S3:`, error);
            return false;
        }
    },
    getS3Url: (key) => {
        return `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    },
    getCdnUrl: (key) => {
        if (process.env.CDN_BASE_URL) {
            return `${process.env.CDN_BASE_URL}/${key}`;
        }
        return upload.getS3Url(key);
    }
};

module.exports = upload;