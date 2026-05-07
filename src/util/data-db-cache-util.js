
const DBCache = require('../model/dbCache.model');


const checkItTimeIsValid = (dataSetTime) => {
    const timeDiff = dataSetTime - (new Date()).getTime();
    if (timeDiff > 0) {
        return true;
    } else {
        return false;
    }
}

const getDBCacheData = (key) => {
    return new Promise(async (resolve, reject) => {
        try {
            const dbData = await DBCache.findOne({ key });
            if (dbData && dbData._id) {
                let localdata = dbData.data;
                if (localdata) {
                    localdata = JSON.parse(localdata);
                    if (!localdata.dataSetTime || checkItTimeIsValid(localdata.dataSetTime)) {
                        return resolve(localdata.data);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        } catch (e) {
            // console.log(e);
            resolve(null);
        }
    });
}

const setDBCacheData = async (key, data, time) => {
    try {
        const nDBCache = new DBCache();
        nDBCache.key = key;
        const cacheStorageModel = {};
        const currentTime = (new Date()).getTime();
        cacheStorageModel.data = data;
        cacheStorageModel.dataSetTime = time ? currentTime + time : null;
        nDBCache.data = JSON.stringify(cacheStorageModel);
        nDBCache.createdAt = new Date();
        const dbData = await DBCache.findOne({ key });
        // console.log('getDBCacheData',dbData);
        if (dbData && dbData._id) {
            const updatedObj = {};
            updatedObj.data = JSON.stringify(cacheStorageModel);
            updatedObj.createdAt = new Date();
            const update = await DBCache.findOneAndUpdate({ key }, { $set: updatedObj }, { new: true });
        } else {
            await nDBCache.save();
        }

    } catch (e) {
        // console.log(e);
    }
}

const resetDBCacheData = async (key) => {
    try {
        await DBCache.deleteOne({ key });
    } catch (error) {
        // console.log('error while deleting resetCacheData',error)
    }
}
const resetAllDBCacheData = async () => {
    try {
        await DBCache.deleteMany({});
    } catch (error) {
        // console.log('error while deleting resetCacheData',error)
    }
}

module.exports = { getDBCacheData, setDBCacheData, resetDBCacheData, resetAllDBCacheData }