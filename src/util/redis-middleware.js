const { setRedisCache, getRedisCache } = require('../util/redis-util')
const responsehanlder = require('./response-handler');

const setCacheImage = (fileName, data) => {
    console.log('setCacheImage', fileName);
    setRedisCache(fileName, data, 60 * 60 * 24 * 30); // expiry after a month
}

const getCacheImage = async (req, res, next) => {
    try {
        const filename = req.params.filename;
        const data = await getRedisCache(filename);
        if (data && data !== null) {
            console.log('getCacheImage', filename);
            const file = Buffer.from(data.data);;
            res.send(file);
        } else {
            next();
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
}

module.exports = { setCacheImage, getCacheImage };