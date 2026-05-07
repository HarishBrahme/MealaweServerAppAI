const { promisify } = require('util');
let GET_ASYNC;
let SET_ASYNC;
let SADD_ASYNC;
let SMEMBERS_ASYNC;
const intialise = () => {
    const { getClient } = require('./../config/redis.config')
    const client = getClient();
    if (client) {
        GET_ASYNC = promisify(client.get).bind(client);
        SET_ASYNC = promisify(client.set).bind(client);
        DEL_ASYNC = promisify(client.del).bind(client);
        SADD_ASYNC = promisify(client.sadd).bind(client);
        SMEMBERS_ASYNC = promisify(client.smembers).bind(client);
        //deleteRedisCache();
    }
}
const setRedisCacheList = async (key, data) => {
    if (!SET_ASYNC) {
        intialise();
    }
    try {
        // console.log('setRedisCacheList ', key, data)
        const previousData = await getRedisCachelist(key);
        // console.log('previousData', previousData);
        if (previousData && previousData.length > 0) {
            previousData.push(`${data}`);
            SADD_ASYNC([key, ...previousData], 'EX', 60 * 60 * 2);
        } else {
            SADD_ASYNC([key, `${data}`], 'EX', 60 * 60 * 2);
        }

    } catch (error) {
        // console.log('Error while storing list data into redis for key ',key, error);
    }
}
const getRedisCachelist = async (key) => {
    if (!SMEMBERS_ASYNC) {
        intialise();
    }
    try {
        const data = await SMEMBERS_ASYNC(key);
        return data;
    } catch (error) {
        // console.log('Error while fetching list data into redis for key ',key, error);
    }
}

const deleteRedisCache = (key) => {
    if (!DEL_ASYNC) {
        intialise();
    }
    try {
        DEL_ASYNC(key);
    } catch (error) {
        // console.log('Error while deleting data into redis for key ',key, error);
    }
}

const setRedisCache = (key, data, expTime) => {
    const defaultExpTime = 60 * 60 * 10;
    if (!SET_ASYNC) {
        intialise();
    }
    try {
        const stringData = JSON.stringify(data);
        SET_ASYNC(key, stringData, 'EX', expTime ? expTime : defaultExpTime);
    } catch (error) {
        // console.log('Error while storing data into redis for key ',key, error);
    }
}

const getRedisCache = async (key) => {
    if (!GET_ASYNC) {
        intialise();
    }
    try {
        const data = await GET_ASYNC(key);
        const jsondata = JSON.parse(data);
        return jsondata;
    } catch (error) {
        // console.log('Error while deleting data into redis for key ',key, error);
    }
}

module.exports = { setRedisCache, getRedisCache, deleteRedisCache, getRedisCachelist, setRedisCacheList };

