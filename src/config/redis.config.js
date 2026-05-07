const redis = require('redis');
let redisClient;

const connectRedis = () => {
    redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    }
    );
    redisClient.on('error', function (err) {
        console.log('Could not establish a connection with redis. ' + err);
    });
    redisClient.on('connect', function (err) {
        console.log('Connected to redis successfully');
    });
    return redisClient;

}
const getClient = () => {
    return redisClient;
}

module.exports = { connectRedis, getClient }