const GridFsStream = require('gridfs-stream');
const mongoose = require('mongoose');
const { getCacheImage } = require('../util/redis-middleware');
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');
const { getAllImageDownLoadList } = require('../util/image-download-util');
//const conn = mongoose.connection;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();
const conn = remoteMongoDb;
let gfs;
let gridFSBucket;

conn.once('open', () => {
    gfs = GridFsStream(conn.db, mongoose.mongo);
    gfs.collection('photos');
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'photos'
    });
});

const readImage = async (req, res) => {
    try {
        const filename = req.params.filename;
        if (gfs) {
            const file = await gfs.files.findOne({ filename });
            if (file && file._id) {
                const readStream = gridFSBucket.openDownloadStream(file._id);
                const chunks = [];
                readStream.on("data", (data) => {
                    chunks.push(data)
                })
                    .on("end", () => {
                        const file = Buffer.concat(chunks);
                        res.send(file);
                    }
                    );
                //readStream.pipe(res);
            }
            else {
                res.status(500).send({ error: `Cannot read property _id` });
            }
        } else {
            res.status(500).send({ error: 'error while readImage gfs not defined' });
        }
    } catch (error) {
        console.log('error while readImage ', error);
        res.status(500).send({ error });
    }
}
const deleteImage = async (filename) => {
    try {
        // const file = await gfs.files.findOne({ filename });
        // if (file && file._id) {
        //     gridFSBucket.delete(file._id, (res) => {
        //     });
        // }
        const status = await deleteFromS3(filename);
        return status;
    } catch (e) {
        console.log('Error while ')
    }
}
const deleteMultiImages = async (filenameArr) => {
    const promiseArr = [];
    filenameArr.forEach(filename => {
        promiseArr.push(deleteImage(filename))
    });
    return await Promise.all(promiseArr);
}
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
    } catch (e) {
        console.log('error while fetching local image ', e);
        next();
    }
}
const readAndSaveImage = (fileList, index) => {
    try {
        if (index < fileList.length) {
            const file = fileList[index]
            const filename = file.filename;
            const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
            fs.readFile(filepath, (err, data) => {
                if (!err && data) {
                    console.log('file already exist', index);
                    index++;
                    readAndSaveImage(fileList, index);
                } else {
                    const readStream = gridFSBucket.openDownloadStream(file._id);
                    const chunks = [];
                    readStream.on("data", (data) => {
                        chunks.push(data)
                    })
                        .on("end", () => {
                            const file = Buffer.concat(chunks);
                            fs.writeFile(filepath, file, (err) => {
                                console.log(filename, 'file saved', index);
                                index++;
                                readAndSaveImage(fileList, index);
                            });
                        }
                        );
                }
            });
        } else {
            console.log(index, 'files saved ')
        }
    } catch (e) {
        console.log('error while saving imgage in server for index', index, e);
    }
}
const saveImageInServer = async () => {
    try {
        console.log('saveImageInServer initited');
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
                console.log('saveImageInServer filelength', files.length);
                readAndSaveImage(files, 0);
            }
        }
    } catch (e) {
        console.log('error while saveImageInServer', e);
    }
}
const readAndSaveSpecificImage = async (fileList, index) => {
    try {
        if (index < fileList.length) {
            const indexfile = fileList[index]
            const filename = indexfile.imageUrl;
            const filepath = path.join(__dirname, '../../public/serverimages/' + filename);
            fs.readFile(filepath, async (err, data) => {
                if (!err && data) {
                    index++;
                    readAndSaveSpecificImage(fileList, index);
                } else {
                    if (gfs) {
                        const file = await gfs.files.findOne({ filename });
                        if (file && file._id) {
                            const readStream = gridFSBucket.openDownloadStream(file._id);
                            const chunks = [];
                            readStream.on("data", (data) => {
                                chunks.push(data)
                            })
                                .on("end", () => {
                                    const file = Buffer.concat(chunks);
                                    fs.writeFile(filepath, file, (err) => {
                                        index++;
                                        readAndSaveSpecificImage(fileList, index);
                                    });
                                }
                                );
                        } else {
                            index++;
                            readAndSaveSpecificImage(fileList, index);
                        }
                    }

                }
            });
        } else {
            console.log(index, 'files saved ')
        }
    } catch (e) {
        console.log('error while saving imgage in server for index', index, e);
    }
}
const loadSpecificInServer = async () => {
    try {
        const list = await getAllImageDownLoadList();
        console.log('loadSpecificInServer', list.length);
        if (list && list.length > 0) {
            readAndSaveSpecificImage(list, 0);
            //console.log('loadSpecificInServer',list[0]);
        }
    } catch (e) {
        console.log('error while loadSpecificInServer', e);
    }
}

let config = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
};
// console.log('s3 config ',config);
const s3 = new AWS.S3(config);

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_PATH_PREFIX = process.env.S3_PATH_PREFIX;
const CDN_BASE_URL = process.env.CDN_BASE_URL;

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

const getS3ImageURL = async (req, res) => {
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
const readS3Image = async (req, res) => {
    try {
        const filename = req.params.filename;        
        // First, try to read from S3
        try {
            const s3Buffer = await downloadFromS3(filename);
            if (s3Buffer) {
                res.set('Cache-Control', 'max-age=3153600');
                console.log('read from s3',filename);
                return res.send(s3Buffer);
            }else{
                console.log('read from mongoDB',filename);
                readImage(req, res);
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

const deleteS3Image = async (filename) => {
    try {
        const s3DeletedFile = await deleteFromS3(filename);         
        console.log(`Deleted ${filename} from s3`);
        return s3DeletedFile;
    } catch (error) {
        console.error('Error in deleteImage:', error);
        return 'ERROR';
    }
};

const deleteMultiS3Images = async (filenameArr) => {
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
    readImage,
    deleteImage,
    deleteMultiImages,
    getCacheImage,
    getLocalImage,
    saveImageInServer,
    loadSpecificInServer,
    getS3ImageURL,
    readS3Image,
    deleteS3Image,
    deleteMultiS3Images
}
