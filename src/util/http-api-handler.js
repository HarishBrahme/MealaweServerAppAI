const axios = require('axios');
const { checkOTPSecurity } = require('./security-util');
const { serverLog } = require("./firebasedb-util");

const callApi = ({ url, method, data, headers }) => {
    return new Promise((resolve, reject) => {
        axios({
            method,
            url,
            data,
            headers,
            responseType: 'json',
            timeout: 30000,
        })
            .then((response) => {
                resolve(response.data);
            })
            .catch(error => {
                console.log('axiox error on call api ');
                if (error.response && error.response.data) {
                    reject({ status: error.response.status, ...error.response.data });
                }
                reject(error.response);
            });
    });
}

const httpFcmMessage = async (fcmToken, authToken, msg, title, type) => {
    let url;
    let color;
    if (type === 'USER') {
        url = process.env.FCM_SERVER_URL_USER;
        color = '#e62841';
    } else if (type === 'KITCHEN') {
        url = process.env.FCM_SERVER_URL_KITCHEN;
        color = '#15a292';
    }
    const apiObj = {
        url: url,
        method: 'POST',
        data: {
            "message": {
                "token": fcmToken,
                "notification": {
                    "body": msg,
                    "title": title
                },
                "apns": {
                    "headers": {
                        'apns-priority': '10',
                    },
                    "payload": {
                        "aps": {
                            "sound": 'push_notification.wav',
                        }
                    },
                },
                "android": {
                    "priority": "high",
                    "notification": {
                        "sound": "push_notification.wav",
                        "channel_id": "mealawepushnotification",
                        "icon": "ic_mealawe",
                        "color": color
                    }
                }
            }
        },
        headers: { 'Authorization': 'Bearer ' + authToken }
    }
    try {
        if (process.env.PRODUCTION === 'true' || process.env.STAGING === 'true') {
            const res = await callApi(apiObj);
        }
    } catch (error) {
        console.log('Error while calling FCM api ', error);
    }

}

const sendSMStoMobile = async (smsData) => {
    const apiObj = {
        url: process.env.SMS_URL,
        method: 'POST',
        data: smsData
    }
    try {
        const status = checkOTPSecurity(apiObj.data.To, true);
        if (status) {
            console.log('sendSMStoMobile ', apiObj.data);
            if (process.env.PRODUCTION === 'true' || process.env.STAGING === 'true') {
                await callApi(apiObj);
            }
            serverLog('sendSMStoMobile ', apiObj.data, 'LOG');
        }
    } catch (error) {
        console.log('http-api-handler.js--sendSMStoMobile error', 'ERROR');
        serverLog('http-api-handler.js--sendSMStoMobile error', {}, 'ERROR');
    }
}

const dunzoApisHttpCall = async (urlParams, method, data, headers) => {
    const apiObj = {
        url: process.env.DUNZO_URL + urlParams,
        method,
        data,
        headers
    }
    return callApi(apiObj);
};

const formUrlEncoded = x => Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')
const exotelApisHttpCall = async (mobileNumber) => {
    const apiObj = {
        url: `https://${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}@api.exotel.in/v1/Accounts/mealawe1/Calls/connect`,
        method: 'POST',
        data: formUrlEncoded({
            From: mobileNumber,
            CallerId: "02071173306",
            CallerType: "trans",
            Url: "http://my.exotel.in/exoml/start/488850"
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
    return callApi(apiObj, '------');
};

const porterApisHttpCall = async (urlParams, method, data, headers) => {
    const apiObj = {
        url: process.env.PORTER_URL + urlParams,
        method,
        data,
        headers
    }
    return callApi(apiObj);
};

const wooCommerceApisHttpCall = async (url, method, data, headers) => {
    const apiObj = {
        url: url,
        method,
        data,
        headers
    }
    return callApi(apiObj);
};

const deskDyneHttpCall = async (url, method, data, headers) => {
    const apiObj = {
        url: url,
        method,
        data,
        headers
    }
    return callApi(apiObj);
};

const pidgeApisHttpCall = async (urlParams, method, data, headers) => {
    const apiObj = {
        url: process.env.PIDGE_URL + urlParams,
        method,
        data,
        headers
    }
    return callApi(apiObj);
};

const shadowFaxApisHttpCall = async (urlParams, method, data, headers) => {
    const apiObj = {
        url: process.env.SHADOWFAX_URL + urlParams,
        method,
        data,
        headers
    }
    return callApi(apiObj);
};

const callGrowBillionTreeAPI = async (urlParams, method, data, headers) => {
    const apiObj = {
        url: process.env.GROW_BILLION_URL + urlParams,
        method,
        data,
        headers
    }
    return callApi(apiObj);
};

const shipRocketApisHttpCall = async (urlParams, method, data, headers) => {
    const apiObj = {
        url: process.env.SHIPROCKET_URL + urlParams,
        method,
        data,
        headers
    }
    console.log('shipRocketApisHttpCall apiObj ', apiObj);
    return callApi(apiObj);
};

const shipWayApisHttpCall = async (urlParams, method, data, headers) => {
    const apiObj = {
        url: process.env.SHIPWAY_URL + urlParams,
        method,
        data,
        headers
    }
    console.log('shipRocketApisHttpCall apiObj ', apiObj);
    return callApi(apiObj);
};

const metaEventHTTPCall = async (data, source) => {
    var apiObj
    if (source == "MealaweWebsite") {
        apiObj = {
            url: `https://graph.facebook.com/v18.0/${process.env.MEALAWE_FB_PIXEL_ID}/events`,
            method: 'POST',
            data
        }
    } else if (source == "NavmoolWebsite") {
        apiObj = {
            url: `https://graph.facebook.com/v18.0/${process.env.NAVMOOL_FB_PIXEL_ID}/events`,
            method: 'POST',
            data
        }
    }
    console.log('metaEventHTTPCall apiObj ', apiObj);
    return callApi(apiObj);
};

const sendWhatsAppMessage = async (data) => {
    try {
        const url = `${process.env.DOVESOFT_BASE_URL}/${process.env.DOVESOFT_VERSION}/${process.env.DOVESOFT_BUSINESS_PHONE_ID}/messages`;
        const apiObj = {
            url: url,
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${process.env.DOVESOFT_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            data
        };
        console.log(JSON.stringify(apiObj))
        serverLog(`📋 Send WhatsApp Message apiObj:${JSON.stringify(apiObj)}`);
        if (process.env.PRODUCTION === 'true' || process.env.STAGING === 'true') {
            // const response = await callApi(apiObj);
            // return response;
            return true;
        } else {
            console.log("WhatsApp Message (Dev Mode):", data);
            return { dev: true };
        }

    } catch (error) {
        console.log("Error sending WhatsApp Message", error);
        return { error };
    }
};


module.exports = {
    httpFcmMessage, sendSMStoMobile, dunzoApisHttpCall, exotelApisHttpCall, porterApisHttpCall,
    wooCommerceApisHttpCall, deskDyneHttpCall, pidgeApisHttpCall, shadowFaxApisHttpCall, callGrowBillionTreeAPI, shipRocketApisHttpCall,
    shipWayApisHttpCall, metaEventHTTPCall, sendWhatsAppMessage
}
