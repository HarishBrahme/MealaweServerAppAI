const { serverLog } = require('./firebasedb-util');
const { deskDyneHttpCall } = require('./http-api-handler');

const deskdyneAPIUtil = async (payload) => {
    console.log(payload);
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.DESKDYNE_URL}/api/` + payload.urlQuery;
            const method = payload.method;
            const headers = {
                'authorization': process.env.DESKDYNE_SECRET
            }
            const data = payload.data;
            let response = await deskDyneHttpCall(url, method, data, headers);
            resolve(response)
        } catch (error) {
            console.log('deskdyneAPIUtil error ', error);
            reject('error while calling deskdyne api')
        }
    });
}

const getDeskDyneToken = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${process.env.DESKDYNE_URL}/authadmin/getAdminToken`;
            const method = 'GET';
            const headers = {
                'authorization': process.env.DESKDYNE_SECRET
            }
            const data = null
            // console.log('getDeskDyneToken ',url,method,data,headers)  
            let response = await deskDyneHttpCall(url, method, data, headers);
            resolve(response)
        } catch (error) {
            // console.log('deskdyneAPIUtil error ',error);
            reject('error while calling deskdyne api')
        }
    });
}

module.exports = { deskdyneAPIUtil, getDeskDyneToken }