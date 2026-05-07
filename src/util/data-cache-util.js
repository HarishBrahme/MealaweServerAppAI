
var cacheObj = {};
checkItTimeIsValid = (dataSetTime) => {
    const timeDiff = dataSetTime - (new Date()).getTime();
    if (timeDiff > 0) {
        return true;
    } else {
        return false;
    }
}

const getCacheData = (key) => {
    const localdata = cacheObj[key];
    if (localdata) {
        if (!localdata.dataSetTime || checkItTimeIsValid(localdata.dataSetTime)) {
            return localdata.data;
        } else {
            return null;
        }
    } else {
        return null;
    }
}

const setCacheData = (key, data, time) => {
    const cacheStorageModel = {};
    const currentTime = (new Date()).getTime();
    cacheStorageModel.data = data;
    cacheStorageModel.dataSetTime = time ? currentTime + time : null;
    cacheObj[key] = cacheStorageModel;
}

const resetCacheData = (key) => {
    delete cacheObj[key];
}
const resetAllCacheData = () => {
    cacheObj = {};
}

module.exports = { getCacheData, setCacheData, resetCacheData, resetAllCacheData }