const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('../service/utility.service');
const { callKitchen } = require('../util/tel-provider-util');
const { getLineBasedLogs, getTimeBasedLogs, getLineBasedAuditLogs, getTimeBasedAuditLogs, getTextBasedLogs, getTextBasedAuditLogs, getAuditLogs, getServerLogs } = require('../util/firebasedb-util');
const { getTodayStartTime, getTodayEndTime } = require('../util/date-util');
const { requestGoogleDistance, getArialDistance, checkLatLngInCluster } = require('../util/google-map-api-util');
const { getDBCacheData, setDBCacheData, resetAllDBCacheData } = require('../util/data-db-cache-util');
const { performPidgeTask } = require('../util/pidge-util');
const { sendGenericFcmMessage } = require('../util/fcm-message-handler');
const crypto = require('crypto');
const { updateManualDeliveryAll } = require('../dao/foodorder.dao');
const { sendSampleTemplateEmail, sendContactUsEmail } = require('../util/email-util/email-service');

const hash = (data) => {
    return crypto.createHash("sha256").update(data.trim().toLowerCase()).digest("hex");
}

router.post('/consolelog', async (req, res) => {
    try {
        const body = req.body;
        // console.log('UI Console: start ', new Date());
        // console.log(body)
        // console.log('UI Console: end ', new Date());
        responsehanlder.success200(req, res, { status: 'valid' });
    } catch (error) {
        // console.log('consolelog function ==> ', error);
        responsehanlder.success200(req, res, { status: 'invalid' });
    }
});

router.post('/trackFbevent', openAuthMiddleware, async (req, res) => {
    try {
        const { event_name, user_data, custom_data, action_source } = req.body;
        const payload = {
            data: [
                {
                    event_name,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: action_source ?? 'website',
                    user_data: {
                        em: user_data?.em ? [hash(user_data.em)] : [],
                        ph: user_data?.ph ? [hash(user_data.ph)] : [],
                        client_ip_address: req.ip,
                        client_user_agent: req.headers["user-agent"],
                    },
                    custom_data: custom_data || {},
                },
            ],
            access_token: process.env.MEALAWE_FB_ACCESS_TOKEN,
        };
        const response = await service.callMetaEventAPI(payload, 'MealaweWebsite');
        res.status(200).json({ success: true, fb_response: response.data });
    } catch (error) {
        console.error("Facebook CAPI Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/trackFbNavmoolevent', openAuthMiddleware, async (req, res) => {
    try {
        const { event_name, user_data, custom_data, action_source } = req.body;
        const payload = {
            data: [
                {
                    event_name,
                    event_time: Math.floor(Date.now() / 1000),
                    action_source: action_source ?? 'website',
                    user_data: {
                        em: user_data?.em ? [hash(user_data.em)] : [],
                        ph: user_data?.ph ? [hash(user_data.ph)] : [],
                        client_ip_address: req.ip,
                        client_user_agent: req.headers["user-agent"],
                    },
                    custom_data: custom_data || {},
                },
            ],
            access_token: process.env.NAVMOOL_FB_ACCESS_TOKEN,
        };
        const response = await service.callMetaEventAPI(payload, 'NavmoolWebsite');
        res.status(200).json({ success: true, fb_response: response.data });
    } catch (error) {
        console.error("Facebook CAPI Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/getLineBasedLogs/:limit', async (req, res) => {
    try {
        const limit = req.params.limit;
        if (limit) {
            const logs = await getLineBasedLogs(parseInt(limit));
            responsehanlder.success200(req, res, logs);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getLineBasedLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getTimeBasedLogs/:hour', async (req, res) => {
    try {
        const hour = req.params.hour;
        if (hour) {
            const to = (new Date()).getTime();
            const from = (new Date()).getTime() - 1000 * 60 * 60 * hour
            const logs = await getTimeBasedLogs(from, to);
            console.log('logs', logs);
            responsehanlder.success200(req, res, logs);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getTimeBasedLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getDayRangeBasedLogs/:startDate/:endDate', async (req, res) => {
    try {
        let starDate = req.params.startDate;
        let eDate = req.params.endDate;
        console.log('s t', starDate);
        if (starDate && eDate) {
            console.log('initialize', starDate)
            const startDate = new Date(starDate);
            const endDate = new Date(eDate);
            const dayStart = getTodayStartTime();
            const dayEnd = getTodayEndTime();
            const from = (new Date(dayStart.setDate(startDate.getDate()))).getTime();
            const to = (new Date(dayEnd.setDate(endDate.getDate()))).getTime();
            const logs = await getTimeBasedLogs(from, to);
            console.log('logs', logs);
            responsehanlder.success200(req, res, logs);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getDayRangeBasedLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/gettextBasedLogs/:page', async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await getTextBasedLogs(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('gettextBasedLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getLineBasedAuditLogs/:limit', async (req, res) => {
    try {
        const limit = req.params.limit;
        if (limit) {
            const logs = await getLineBasedAuditLogs(parseInt(limit));
            responsehanlder.success200(req, res, logs);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getLineBasedAuditLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getTimeBasedAuditLogs/:hour', async (req, res) => {
    try {
        const hour = req.params.hour;
        if (hour) {
            const to = (new Date()).getTime();
            const from = (new Date()).getTime() - 1000 * 60 * 60 * hour
            const logs = await getTimeBasedAuditLogs(from, to);
            responsehanlder.success200(req, res, logs);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getTimeBasedAuditLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getDayRangeBasedAuditLogs/:startDate/:endDate', async (req, res) => {
    try {
        console.log('route for day based logs');
        let starDate = req.params.startDate;
        let eDate = req.params.endDate;
        console.log('s t', starDate);
        if (starDate && eDate) {
            console.log('initialize', starDate)
            const startDate = new Date(starDate);
            const endDate = new Date(eDate);
            const dayStart = getTodayStartTime();
            const dayEnd = getTodayEndTime();
            const from = (new Date(dayStart.setDate(startDate.getDate()))).getTime();
            const to = (new Date(dayEnd.setDate(endDate.getDate()))).getTime();
            const logs = await getTimeBasedAuditLogs(from, to);
            console.log('logs', logs);
            responsehanlder.success200(req, res, logs);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getDayRangeBasedAuditLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getTextBasedAuditLogs/:page', async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await getTextBasedAuditLogs(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getTextBasedAuditLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getAuditLogs', async (req, res) => {
    try {
        const body = req.body || {};
        if (!body || Object.keys(body).length === 0) {
            return responsehanlder.hasError402(res, 'request body required');
        }
        const logs = await getAuditLogs(body);
        return responsehanlder.success200(req, res, logs);
    } catch (error) {
        console.log('getAuditLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getServerLogs', async (req, res) => {
    try {
        const body = req.body || {};
        if (!body || Object.keys(body).length === 0) {
            return responsehanlder.hasError402(res, 'request body required');
        }
        const logs = await getServerLogs(body);
        return responsehanlder.success200(req, res, logs);
    } catch (error) {
        console.log('getServerLogs function ==> ', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getKitchenGoogleDistance', async (req, res) => {
    try {
        const body = req.body;
        const origin = body.origin;
        const destination = body.destination;
        if (origin && destination) {
            // const result = await requestGoogleDistance(origin,destination,true);
            const result = getArialDistance(origin, destination, true);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invlaid request');
        }

    } catch (error) {
        // console.log('cleanlatlng function ==> ', error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getLocationByIP', async (req, res) => {
    try {
        const ip = req.ip;
        if (ip) {
            const result = await service.getLocationByIP(ip);
            responsehanlder.success200(req, res, result);
        }
        else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('cleanlatlng function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

// router.get('/cleanlatlng', async (req, res)=>{
//     try{
//         const result = await service.cleanlatlng();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.post('/cleanAddress', async (req, res)=>{
//     try{
//         const body = req.body;
//         const result = await service.cleanAddress(body);
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanAddress function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/updateKitchenPartnerLocation', async (req, res)=>{
//     try{
//         const result = await service.updateKitchenPartnerLocation();
//         responsehanlder.success200(req,res, {length: result.length});
//     }catch(error){
//         // console.log('updateKitchenPartnerLocation function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });
// router.get('/updateKitchenMenuLocation', async (req, res)=>{
//     try{
//         const result = await service.updateKitchenMenuLocation();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('updateKitchenMenuLocation function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/updateKitchenTodaysMenuLocation', async (req, res)=>{
//     try{
//         const result = await service.updateKitchenTodaysMenuLocation();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('updateKitchenTodaysMenuLocation function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/callKitchen/:phone', async (req, res)=>{
//     try{
//         const phone = req.params.phone; 
//         const result = await callKitchen(phone);
//         responsehanlder.success200(req,res, {status:'success'});
//     }catch(error){
//         // console.log('updateKitchenTodaysMenuLocation function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/handleAlldayMenu', async (req, res)=>{
//     try{
//         const result = await service.handleAlldayMenu();
//         responsehanlder.success200(req,res, {status:'success'});
//     }catch(error){
//         // console.log('updateKitchenTodaysMenuLocation function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/checkPhoneNo', async (req, res)=>{
//     try{
//         const result = await service.checkPhoneNo();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/assignCashback', async (req, res)=>{
//     try{
//         const result = await service.assignCashback();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/getCustomerListDateRange/:startDate', async (req, res)=>{
//     try{
//         const startDate = req.params.startDate; 
//         const result = await service.getCustomerListDateRange(startDate);
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/setInflateFlag', async (req, res)=>{
//     try{        
//         const result = await service.setInflateFlag();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/setInflateFlagKitchenMenu', async (req, res)=>{
//     try{        
//         const result = await service.setInflateFlagKitchenMenu();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/setPreparationTime', async (req, res)=>{
//     try{        
//         const result = await service.setPreparationTime();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/setPreparationTimeKitchen', async (req, res)=>{
//     try{        
//         const result = await service.setPreparationTimeKitchen();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

router.get('/getCommerceMealOrders', async (req, res) => {
    try {
        const result = await service.getCommerceMealOrders();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('cleanlatlng function ==> ', error);
        responsehanlder.hasError500(res)
    }
});

// router.get('/checkOTP', async (req, res)=>{
//     try{        
//         service.checkOTP();
//         responsehanlder.success200(req,res, {msg: 'ok'});
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/setCreatedOn', async (req, res)=>{
//     try{        
//         const result = await service.setCustomerCreatedOn();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/assignKitchenType', async (req, res)=>{
//     try{        
//         const result = await service.assignKitchenType();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

router.get('/createPidgeTaskApi', async (req, res) => {
    try {
        const result = await service.createPidgeTaskApi();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('createPidgeTaskApi function ==> ', error);
        responsehanlder.hasError500(res)
    }
});
// router.get('/updateBulkMainMenuItemId', async (req, res)=>{
//     try{        
//         const result = await service.updateBulkMainMenuItemId();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

router.get('/testProcessLock', async (req, res) => {
    try {
        const result = await service.testProcessLock();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('testProcessLock function ==> ', error);
        responsehanlder.hasError500(res)
    }
});

router.get('/sendTestEmail', async (req, res) => {
    try {
        const result = await service.sendTestEmail();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('testProcessLock function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getDBCacheData/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const result = await getDBCacheData(key);
        responsehanlder.success200(req, res, { result });
    } catch (error) {
        // console.log('testProcessLock function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/setDBCacheData', async (req, res) => {
    try {
        const payload = req.body;
        const key = payload.key;
        const data = payload.data;
        const time = payload.time;
        if (key && data && time) {
            const result = await setDBCacheData(key, data, time);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }

    } catch (error) {
        // console.log('testProcessLock function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/resetDBCacheData/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const result = await resetDBCacheData(key);
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('testProcessLock function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/resetAllDBCacheData', async (req, res) => {
    try {
        const result = await resetAllDBCacheData();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('testProcessLock function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/setFeedbackCreatedOn', async (req, res) => {
    try {
        const result = await service.setFeedbackCreatedOn();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('cleanlatlng function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/checkLatLngInCluster/:lat/:lng', async (req, res) => {
    try {
        const lat = req.params.lat;
        const lng = req.params.lng;
        const result = await checkLatLngInCluster({ lat, lng });
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('cleanlatlng function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/updateOrderCluster', async (req, res) => {
    try {
        const result = await service.updateOrderCluster();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('cleanlatlng function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/updateOrderPackageCluster', async (req, res) => {
    try {
        const result = await service.updateOrderPackageCluster();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('cleanlatlng function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/kitchenWiseOrders', async (req, res) => {
    try {
        const result = await performPidgeTask();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('cleanlatlng function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/testnotification/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const fetchedMenu = await sendGenericFcmMessage('hii this is test msg', customerId, 'USER');
            responsehanlder.success200(req, res, fetchedMenu);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.success200(req, res, { status: 'invalid' });
    }
});

// router.get('/kitchenOrderPhotoDelete', async (req, res)=>{
//     try{
//         console.log('kitchenOrderPhotoDelete###')
//         const result = await service.kitchenOrderPhotoDelete();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/assignPincode', async (req, res)=>{
//     try{
//         console.log('assignPincode###')
//         const result = await service.assignPincode();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

router.get('/logoutAllAdmin', async (req, res) => {
    try {
        console.log('logoutAllAdmin###')
        const result = await service.logoutAllAuthAdmin();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('cleanlatlng function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

// router.get('/updateManualDeliveryAll', async (req, res) => {
//     try {
//         console.log('updateManualDeliveryAll###')
//         const result = await updateManualDeliveryAll();
//         responsehanlder.success200(req, res, result);
//     } catch (error) {
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res)
//     }
// });

// router.get('/assignClusterToKitchen', async (req, res)=>{
//     try{
//         console.log('assignClusterToKitchen###')
//         const result = await service.assignClusterToKitchen();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

// router.get('/assignkitchenIdToWallet', async (req, res)=>{
//     try{
//         console.log('assignkitchenIdToWallet###')
//         const result = await service.assignkitchenIdToWallet();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });


// router.get('/removeKotaDeliveryVendor', async (req, res)=>{
//     try{
//         console.log('removeKotaDeliveryVendor###')
//         const result = await service.removeKotaDeliveryVendor();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         // console.log('cleanlatlng function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });


// router.get('/assignRMToCustNOrder', async (req, res)=>{
//     try{
//         console.log('assignRMToCustNOrder###')
//         const result = await service.assignRMToCustNOrder();
//         responsehanlder.success200(req,res, result);
//     }catch(error){
//         console.log('assignRMToCustNOrder function ==> ',error);
//         responsehanlder.hasError500(res) 
//     }
// });

router.get('/testmail', async (req, res) => {
    try {
        const toAddresses = ['omkar.dhapte@mealawe.com'];
        const response = await sendSampleTemplateEmail(toAddresses, 'MEALaWE');
        responsehanlder.success200(req, res, response);
    } catch (error) {
        console.error('[TestMail] ❌ Error:', error);
        responsehanlder.success200(req, res, { status: 'invalid', message: error.message });
    }
});

router.post('/contactUsNavmool', async (req, res) => {
    try {
        const { name, email, subject, message, phone } = req.body || {};
        if (!name || !email || !message) {
            return responsehanlder.success200(req, res, { status: 'error', message: 'Missing required fields: name, email, and message are mandatory.', });
        }
        const response = await sendContactUsEmail({ name, email, subject: subject || 'General Inquiry', message, phone: phone || '', });
        responsehanlder.success200(req, res, { status: response?.status ? 'success' : 'failed', message: response?.status ? 'Contact Us email sent successfully.' : 'Failed to send Contact Us email.', response, });
    } catch (error) {
        console.error('[ContactUs] ❌ Exception:', error);
        responsehanlder.success200(req, res, {
            status: 'invalid',
            message: error.message || 'Unexpected error occurred.',
        });
    }
});

router.post('/sendLowRatingCustomerMessage', async (req, res) => {
    responsehanlder.success200(req, res, true);
});

router.post('/sendWelcomeVideo', async (req, res) => {
    responsehanlder.success200(req, res, true);
});

module.exports = router;