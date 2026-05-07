const GridFsStream = require('gridfs-stream');
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');
const { getAllImageDownLoadList } = require('../util/image-download-util');

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


const downloadFromS3 = async (filename) => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: S3_PATH_PREFIX + `/${filename}`
        };
        const result = await s3.getObject(params).promise();
        return result.Body;
    } catch (error) {
        if (error.code === 'NoSuchKey') {
            console.log(`File ${filename} not found in S3`);
            return null;
        }
        console.error(`Error downloading ${filename} from S3:`, error.message);
        throw error;
    }
};

const deleteFromS3 = async (filename) => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: S3_PATH_PREFIX + `/${filename}`
        }; 
        await s3.deleteObject(params).promise();
        console.log(`Successfully deleted ${filename} from S3`);
        return true;
    } catch (error) {
        console.error(`Error deleting ${filename} from S3:`, error.message);
        return false;
    }
};

const checkS3FileExists = async (filename) => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: S3_PATH_PREFIX + filename
        };
        
        await s3.headObject(params).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
};

const getS3VideoURL = async (req, res) => {
    try {
        const filename = req.params.filename;        
        // First, try to read from S3
        try {
            if (CDN_BASE_URL) {
                const cdnUrl = `${CDN_BASE_URL}/${S3_PATH_PREFIX}/${filename}`;
                // return res.json({ url: cdnUrl });
                console.log('getS3ImageURL',filename, cdnUrl);
                return res.send(cdnUrl);
            }
        } catch (s3Error) {
            console.error('S3 read failed', filename, s3Error.message);
            res.status(500).send({ error: 'S3 read failed' });
        }
    } catch (error) {
        console.error('Error while readImage:', filename, error);
        res.status(500).send({ error: error.message });
    }
};
const readS3Video = async (req, res) => {
    try {
        const filename = req.params.filename;        
        // First, try to read from S3
        try {
            const s3Buffer = await downloadFromS3(filename);
            if (s3Buffer) {
                res.set('Cache-Control', 'max-age=3153600');
                //console.log('read from s3',filename);
                return res.send(s3Buffer);
            }else{
                res.status(500).send({ error: 'video not found' });
            }
        } catch (s3Error) {
            console.error('S3 read failed', filename, s3Error.message);
            res.status(500).send({ error: 'S3 read failed' });
        }
    } catch (error) {
        console.error('Error while readImage:', filename, error);
        res.status(500).send({ error: error.message });
    }
};

const deleteS3Video = async (filename) => {
    try {
        const s3DeletedFile = await deleteFromS3(filename);         
        console.log(`Deleted ${filename} from s3`);
        return s3DeletedFile;
    } catch (error) {
        console.error('Error in deleteVideo:', error);
        return 'ERROR';
    }
};

const deleteMultiS3Video = async (filenameArr) => {
    const promiseArr = [];
    filenameArr.forEach(filename => {
        promiseArr.push(deleteS3Image(filename));
    });
    return await Promise.all(promiseArr);
};

// Function to get CDN URL (for future use)
const getCdnUrl = (filename) => {
    if (CDN_BASE_URL) {
        return `${CDN_BASE_URL}/${filename}`;
    }
    return null;
};

// Function to check if image exists in S3 (useful for health checks)
const imageExistsInS3 = async (filename) => {
    try {
        return await checkS3FileExists(filename);
    } catch (error) {
        console.error('Error checking image existence in S3:', filename, error.message);
        return false;
    }
};


module.exports = {
    getS3VideoURL,
    readS3Video,
    deleteS3Video,
    deleteMultiS3Video
}
