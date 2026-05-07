const GridFsStream = require('gridfs-stream');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const { getCacheImage } = require('../util/redis-middleware');
const fs = require('fs');
const path = require('path');
const { getAllImageDownLoadList } = require('../util/image-download-util');

const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();
const conn = remoteMongoDb;
let gfs;
let gridFSBucket;

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_PATH_PREFIX = process.env.S3_PATH_PREFIX;
const CDN_BASE_URL = process.env.CDN_BASE_URL;

conn.once('open', () => {
    gfs = GridFsStream(conn.db, mongoose.mongo);
    gfs.collection('photos');
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'photos'
    });
});

// S3 Utility Functions
const uploadToS3 = async (filename, buffer, contentType = 'image/jpeg') => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: S3_PATH_PREFIX + filename,
            Body: buffer,
            ContentType: contentType
        };
        
        const result = await s3.upload(params).promise();
        console.log(`Successfully uploaded ${filename} to S3:`, result.Location);
        return result;
    } catch (error) {
        console.error(`Error uploading ${filename} to S3:`, error.message);
        throw error;
    }
};

const downloadFromS3 = async (filename) => {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: S3_PATH_PREFIX + filename
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
            Key: S3_PATH_PREFIX + filename
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

// Updated Core Functions
const readImage = async (req, res, count) => {
    try {
        count++;
        const filename = req.params.filename;
        
        // First, try to read from S3
        try {
            const s3Buffer = await downloadFromS3(filename);
            if (s3Buffer) {
                // Save to local cache if needed
                const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
                fs.writeFile(filepath, s3Buffer, (err) => { 
                    if (err) console.error('Error writing to local cache:', err);
                });
                
                // Option to return CDN URL instead of file content (commented for now)
                // if (CDN_BASE_URL) {
                //     const cdnUrl = `${CDN_BASE_URL}/${S3_PATH_PREFIX}/${filename}`;
                //     return res.json({ url: cdnUrl });
                // }
                
                res.set('Cache-Control', 'max-age=3153600');
                return res.send(s3Buffer);
            }
        } catch (s3Error) {
            console.error('S3 read failed, falling back to GridFS:', filename, s3Error.message);
        }
        
        // Fallback to GridFS
        if (gfs) {
            const file = await gfs.files.findOne({ filename });
            if (file && file._id) {
                const readStream = gridFSBucket.openDownloadStream(file._id);
                const chunks = [];
                
                readStream.on("data", (data) => {
                    chunks.push(data);
                })
                .on("end", async () => {
                    const fileBuffer = Buffer.concat(chunks);
                    
                    // Save to local cache
                    const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
                    fs.writeFile(filepath, fileBuffer, (err) => {
                        if (err) console.error('Error writing to local cache:', err);
                    });
                    
                    // Upload to S3 for future requests (migration strategy)
                    try {
                        await uploadToS3(filename, fileBuffer);
                        console.log('Successfully migrated file to S3 during read:', filename);
                    } catch (uploadError) {
                        console.error('Error uploading to S3 during read:', filename, uploadError.message);
                    }
                    
                    res.set('Cache-Control', 'max-age=3153600');
                    res.send(fileBuffer);
                })
                .on("error", (error) => {
                    console.error('GridFS read stream error:', filename, error);
                    res.status(500).send({ error: 'Error reading from GridFS' });
                });
            } else {
                res.status(404).send({ error: 'File not found' });
            }
        } else {
            res.status(500).send({ error: 'Database connection not available' });
        }
    } catch (error) {
        console.error('Error while readImage:', filename, error);
        res.status(500).send({ error: error.message });
    }
};

const deleteImage = async (filename) => {
    try {
        let result = 'NA';
        
        // Delete from both S3 and GridFS
        const s3DeletePromise = deleteFromS3(filename);
        
        const file = await gfs.files.findOne({ filename });
        let gridfsDeletePromise = Promise.resolve(true);
        
        if (file && file._id) {
            gridfsDeletePromise = new Promise((resolve, reject) => {
                gridFSBucket.delete(file._id, (error) => {
                    if (error) {
                        console.error('Error deleting from GridFS:', error);
                        reject(error);
                    } else {
                        resolve(true);
                    }
                });
            });
            result = file._id;
        }
        
        // Wait for both deletions
        await Promise.allSettled([s3DeletePromise, gridfsDeletePromise]);
        
        // Delete local file if exists
        const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
        fs.unlink(filepath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Error deleting local file:', err);
            }
        });
        
        console.log(`Deleted ${filename}, GridFS ID: ${result}`);
        return result;
    } catch (error) {
        console.error('Error in deleteImage:', error);
        return 'ERROR';
    }
};

const deleteMultiImages = async (filenameArr) => {
    const promiseArr = [];
    filenameArr.forEach(filename => {
        promiseArr.push(deleteImage(filename));
    });
    return await Promise.all(promiseArr);
};

const getLocalImage = async (req, res, next) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
        
        fs.readFile(filepath, (err, data) => {
            if (!err && data) {
                res.set('Cache-Control', 'max-age=3153600');
                res.sendFile(filepath);
            } else {
                next();
            }
        });
    } catch (error) {
        console.log('Error while fetching local image:', error);
        next();
    }
};

const readAndSaveImage = async (fileList, index) => {
    try {
        if (index < fileList.length) {
            const file = fileList[index];
            const filename = file.filename;
            const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
            
            // Check if file exists locally
            fs.readFile(filepath, async (err, data) => {
                if (!err && data) {
                    console.log('File already exists locally:', index);
                    
                    // Check if exists in S3, if not upload it
                    try {
                        const existsInS3 = await checkS3FileExists(filename);
                        if (!existsInS3) {
                            await uploadToS3(filename, data);
                            console.log('Uploaded existing local file to S3:', filename);
                        }
                    } catch (s3Error) {
                        console.error('Error checking/uploading to S3:', s3Error);
                    }
                    
                    readAndSaveImage(fileList, index + 1);
                } else {
                    // Read from GridFS and save both locally and to S3
                    const readStream = gridFSBucket.openDownloadStream(file._id);
                    const chunks = [];
                    
                    readStream.on("data", (data) => {
                        chunks.push(data);
                    })
                    .on("end", async () => {
                        const fileBuffer = Buffer.concat(chunks);
                        
                        // Save locally
                        fs.writeFile(filepath, fileBuffer, (err) => {
                            if (err) console.error('Error saving locally:', err);
                        });
                        
                        // Upload to S3
                        try {
                            await uploadToS3(filename, fileBuffer);
                            console.log('Successfully uploaded to S3 during batch processing:', filename);
                        } catch (s3Error) {
                            console.error('Error uploading to S3 during batch processing:', filename, s3Error.message);
                        }
                        
                        console.log(`${filename} file saved locally and uploaded to S3, index: ${index}`);
                        readAndSaveImage(fileList, index + 1);
                    })
                    .on("error", (error) => {
                        console.error('Error reading from GridFS:', error);
                        readAndSaveImage(fileList, index + 1);
                    });
                }
            });
        } else {
            console.log(`${index} files processed`);
        }
    } catch (error) {
        console.log('Error while saving image in server for index', index, error);
        readAndSaveImage(fileList, index + 1);
    }
};

// Should deprecate this and use CDN URL directly
const saveImageInServer = async () => {
    try {
        console.log('saveImageInServer initiated');
        if (gfs) {
            const collection = await gfs.collection('photos');
            const cursor = await collection.find({ filename: { $exists: true } });
            const files = [];
            let count = 0;
            
            while (await cursor.hasNext()) {
                const file = await cursor.next();
                files.push(file);
                count++;
            }
            
            console.log('saveImageInServer started', files.length, count);
            if (files && files.length > 0) {
                console.log('saveImageInServer fileLength:', files.length);
                readAndSaveImage(files, 0);
            }
        }
    } catch (error) {
        console.log('Error while saveImageInServer:', error);
    }
};

// Should deprecate this and use CDN URL directly
const readAndSaveSpecificImage = async (fileList, index) => {
    try {
        if (index < fileList.length) {
            const indexFile = fileList[index];
            const filename = indexFile.imageUrl;
            const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
            
            fs.readFile(filepath, async (err, data) => {
                if (!err && data) {
                    // File exists locally, check and upload to S3 if needed
                    try {
                        const existsInS3 = await checkS3FileExists(filename);
                        if (!existsInS3) {
                            await uploadToS3(filename, data);
                            console.log('Uploaded existing local file to S3:', filename);
                        }
                    } catch (s3Error) {
                        console.error('Error checking/uploading to S3:', filename, s3Error.message);
                    }
                    
                    readAndSaveSpecificImage(fileList, index + 1);
                } else {
                    // Try to read from GridFS
                    if (gfs) {
                        const file = await gfs.files.findOne({ filename });
                        if (file && file._id) {
                            const readStream = gridFSBucket.openDownloadStream(file._id);
                            const chunks = [];
                            
                            readStream.on("data", (data) => {
                                chunks.push(data);
                            })
                            .on("end", async () => {
                                const fileBuffer = Buffer.concat(chunks);
                                
                                // Save locally
                                fs.writeFile(filepath, fileBuffer, (err) => {
                                    if (err) console.error('Error saving locally:', err);
                                });
                                
                                // Upload to S3
                                try {
                                    await uploadToS3(filename, fileBuffer);
                                    console.log('Successfully uploaded to S3 during specific processing:', filename);
                                } catch (s3Error) {
                                    console.error('Error uploading to S3 during specific processing:', filename, s3Error.message);
                                }
                                
                                readAndSaveSpecificImage(fileList, index + 1);
                            })
                            .on("error", (error) => {
                                console.error('GridFS read error:', error);
                                readAndSaveSpecificImage(fileList, index + 1);
                            });
                        } else {
                            readAndSaveSpecificImage(fileList, index + 1);
                        }
                    } else {
                        readAndSaveSpecificImage(fileList, index + 1);
                    }
                }
            });
        } else {
            console.log(`${index} files processed`);
        }
    } catch (error) {
        console.log('Error while saving image in server for index', index, error);
        readAndSaveSpecificImage(fileList, index + 1);
    }
};

// Should deprecate this and use CDN URL directly
const loadSpecificInServer = async () => {
    try {
        const list = await getAllImageDownLoadList();
        console.log('loadSpecificInServer:', list.length);
        if (list && list.length > 0) {
            readAndSaveSpecificImage(list, 0);
        }
    } catch (error) {
        console.log('Error while loadSpecificInServer:', error);
    }
};

// Additional utility functions for enhanced functionality

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
    readImage,
    deleteImage,
    deleteMultiImages,
    getCacheImage,
    getLocalImage,
    saveImageInServer,
    loadSpecificInServer,
    migrateImagesToS3,
    // Export S3 utilities for potential external use
    uploadToS3,
    downloadFromS3,
    deleteFromS3,
    // Export additional utility functions
    getCdnUrl,
    imageExistsInS3
};