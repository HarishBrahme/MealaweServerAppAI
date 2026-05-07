const https = require('https');
const PaytmChecksum = require('paytmchecksum');
const axios = require('axios');
const getPaytmCheckSum = (orderId, amount, customerPhone) => {
    return new Promise((resolve, reject) => {
        const PAYTM_MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;
        const paytmParams = {};
        paytmParams.body = {
            "requestType": "Payment",
            "mid": PAYTM_MERCHANT_ID,
            "websiteName": process.env.PAYTM_WEBSITE_NAME,
            "orderId": orderId,
            "callbackUrl": process.env.PAYTM_URL + '/theia/paytmCallback?ORDER_ID=' + orderId,
            "txnAmount": {
                "value": amount,
                "currency": "INR",
            },
            "userInfo": {
                "custId": customerPhone,
            },
        };
        // console.log('getPaytmCheckSum ======  ',paytmParams.body)
        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY)
            .then(function (checksum) {
                paytmParams.head = {
                    "signature": checksum
                };
                const options = {
                    url: process.env.PAYTM_URL + `/theia/api/v1/initiateTransaction?mid=${PAYTM_MERCHANT_ID}&orderId=${orderId}`,
                    port: 443,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                // console.log('getPaytmCheckSum options ==== ',options);

                axios({
                    method: options.method,
                    url: options.url,
                    data: { body: paytmParams.body, head: { "signature": checksum } },
                    headers: options.headers,
                    responseType: 'json',
                    timeout: 30000,
                })
                    .then((res) => {
                        const response = res.data;
                        // // console.log('Response: ', response);
                        if (response && response.body && response.body.resultInfo && response.body.resultInfo.resultStatus === 'S') {
                            resolve({ txnToken: response.body.txnToken })
                        } else {
                            reject({ error: 'error creating transaction token' })
                        }
                    })
                    .catch(error => {
                        // console.log('paytm initiate error ',error);
                        reject({ error: 'error creating transaction token' })
                    });
            });
    });
}

const verifyPaytmTransaction = (orderId) => {
    return new Promise((resolve, reject) => {
        const PAYTM_MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;
        const paytmParams = {};
        paytmParams.body = {
            "mid": PAYTM_MERCHANT_ID,
            "orderId": orderId
        };
        // console.log('verifyPaytmTransaction ======  ',paytmParams.body)
        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY)
            .then(function (checksum) {
                paytmParams.head = {
                    "signature": checksum
                };
                const options = {
                    url: process.env.PAYTM_URL + `/v3/order/status`,
                    port: 443,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                axios({
                    method: options.method,
                    url: options.url,
                    data: { body: paytmParams.body, head: { "signature": checksum } },
                    headers: options.headers,
                    responseType: 'json',
                    timeout: 30000,
                })
                    .then((res) => {
                        const response = res.data;
                        // // console.log('Response: ', response);
                        if (response && response.body && response.body.resultInfo && response.body.resultInfo.resultStatus === 'TXN_SUCCESS') {
                            resolve({ status: true, txnId: response.body.txnId });
                        } else {
                            resolve({ status: false });
                        }
                    })
                    .catch(error => {
                        // console.log('paytm initiate error ',error);
                        resolve({ status: false });
                    });
            });
    });
}

const checkUPIAccount = (orderId, customerPhone) => {
    return new Promise((resolve, reject) => {
        const PAYTM_MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;
        const paytmParams = {};
        paytmParams.body = {
            "mid": PAYTM_MERCHANT_ID,
            "mobileNumber": customerPhone
        };
        // console.log('checkUPIAccount ======  ',paytmParams.body)
        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY)
            .then(function (checksum) {
                paytmParams.head = {
                    "tokenType": "CHECKSUM",
                    "signature": checksum
                };
                const options = {
                    url: process.env.PAYTM_URL + `/theia/api/v1/checkUPIAccountExist?mid=${PAYTM_MERCHANT_ID}&orderId=${orderId}`,
                    port: 443,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                axios({
                    method: options.method,
                    url: options.url,
                    data: { body: paytmParams.body, head: { "signature": checksum } },
                    headers: options.headers,
                    responseType: 'json',
                    timeout: 30000,
                })
                    .then((res) => {
                        const response = res.data;
                        // // console.log('Response: ', response);
                        if (response && response.body && response.body.resultInfo && response.body.resultInfo.resultStatus === 'S') {
                            resolve({ upiAccountExist: response.body.upiAccountExist })
                        } else {
                            reject({ error: 'error creating transaction token' })
                        }
                    })
                    .catch(error => {
                        // console.log('paytm initiate error ',error);
                        reject({ error: 'error creating transaction token' })
                    });
            });
    });
}

const processTransaction = (orderId, txnToken, customerPhone) => {
    return new Promise((resolve, reject) => {
        const PAYTM_MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;
        const paytmParams = {};
        paytmParams.body = {
            "mid": PAYTM_MERCHANT_ID,
            "mobileNumber": customerPhone,
            "requestType": "NATIVE",
            "mid": "{mid}",
            "orderId": "ORDERID_98765",
            "paymentMode": "UPI_INTENT",
            "osType": "IOS",
            "pspApp": "Phonepe"
        };
        // console.log('processTransaction ======  ',paytmParams.body)
        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY)
            .then(function (checksum) {
                paytmParams.head = {
                    "txnToken": txnToken
                };
                const options = {
                    url: process.env.PAYTM_URL + `/theia/api/v1/processTransaction?mid=${PAYTM_MERCHANT_ID}&orderId=${orderId}`,
                    port: 443,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                axios({
                    method: options.method,
                    url: options.url,
                    data: { body: paytmParams.body, head: { "signature": checksum } },
                    headers: options.headers,
                    responseType: 'json',
                    timeout: 30000,
                })
                    .then((res) => {
                        const response = res.data;
                        // // console.log('Response: ', response);
                        if (response && response.body && response.body.resultInfo && response.body.resultInfo.resultStatus === 'S') {
                            resolve({ upiAccountExist: response.body.upiAccountExist })
                        } else {
                            reject({ error: 'error creating transaction token' })
                        }
                    })
                    .catch(error => {
                        // console.log('paytm initiate error ',error);
                        reject({ error: 'error creating transaction token' })
                    });
            });
    });
}

module.exports = { getPaytmCheckSum, verifyPaytmTransaction, checkUPIAccount }