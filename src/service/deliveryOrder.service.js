const { dunzoApisHttpCall, porterApisHttpCall, shadowFaxApisHttpCall, pidgeApisHttpCall } = require('../util/http-api-handler');
const dao = require('../dao/deliveryOrder.dao');
const bulkDao = require('../dao/bulkFoodOrder.dao');
const { updateDeliveryOrder, getFoodOrderListByOrderNo } = require('./foodorder.service');
const { sendDeliveryFcmMessage } = require('../util/fcm-message-handler');
const utilService = require('../service/utility.service');
const { getDBCacheData, setDBCacheData } = require('../util/data-db-cache-util');
const { getLocalDate, formatOnlyDate } = require('../util/date-util');
const { getPidgeTokan } = require('../util/pidge-util');
const { getServerFoodOrderList, updateServerOrderDeliveryPrice, updateServerFoodOrderStatus, payServerFoodOrderAmtToKitchenDirect } = require('../util/order-callback-util');
global.dunzoToken;


const validateIfManualDelivery = async (orderList, server) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('validateIfManualDelivery orderList ', orderList);
            const foodOrderList = await getFoodOrderListByOrderNo(orderList);
            const body = {
                data: {
                    orders: orderList
                },
                urlQuery: 'getFoodOrderListByOrderNo',
                method: 'POST'
            }
            const ddFoodOrderList = await utilService.accessDeskDyneData(body);
            let manualDelivery = false;
            const newList = [...foodOrderList, ...ddFoodOrderList]
            newList.forEach(order => {
                if (order.startManualDelivery) {
                    manualDelivery = true;
                }
                console.log('validateIfManualDelivery ', order.orderNo, order.startManualDelivery);
            });
            console.log('validateIfManualDelivery manualDelivery ', manualDelivery);
            resolve({ status: manualDelivery });
        } catch (error) {
            console.log('Error while validateIfManualDelivery ', error);
            reject(error);
        }
    });
}

const updateDeliveryOrderStatus = async (deliveryTaskId, deliveryTaskState) => {
    try {
        return await dao.updateDeliveryOrderStatus(deliveryTaskId, deliveryTaskState);
    } catch (e) {
        console.log('error on updateDeliveryOrderStatus service layer ', e);
    }
}

const getToken = () => {
    return new Promise(async (resolve, reject) => {
        try {
            if (global.dunzoToken) {
                resolve(global.dunzoToken);
            } else {
                const urlParams = '/api/v1/token';
                const header = {
                    'client-id': process.env.DUNZO_CLIENT_ID,
                    'client-secret': process.env.DUNZO_CLIENT_SECRET,
                    'Content-Type': 'application/json', 'Accept-Language': 'en_US'
                };
                const tokenObj = await dunzoApisHttpCall(urlParams, 'GET', null, header);
                global.dunzoToken = tokenObj.token;
                console.log('dunzo token ===> recieved');
                resolve(tokenObj.token);
            }
        } catch (error) {
            console.log('Error while calling token ', error);
            reject(error);
        }
    });
}


const createDunzoTask = (taskObj, orderNoList, server) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deliveryOrder = await dao.getDeliveryOrder(taskObj.reference_id);
            if (deliveryOrder && deliveryOrder._id) {
                console.log('sending delivery order from DB');
                resolve(deliveryOrder);
            } else {
                taskObj.request_id = 'REF_ID_' + Math.ceil(Math.random() * 100000000)
                const token = await getToken();
                const urlParams = '/api/v2/tasks';
                const header = {
                    'client-id': process.env.DUNZO_CLIENT_ID, 'Authorization': token,
                    'Content-Type': 'application/json', 'Accept-Language': 'en_US'
                };
                dunzoApisHttpCall(urlParams, 'POST', taskObj, header)
                    .then(async (res) => {
                        const deliveryOrderObj = {
                            reference_id: taskObj.reference_id,
                            request_id: taskObj.request_id,
                            deliveryTaskId: res.task_id,
                            orderNoList,
                            deliveryTaskState: res.state,
                            deliveryVendor: 'Dunzo',
                            serverNameOrderType: server
                        };
                        await dao.saveDeliveryOrder(deliveryOrderObj);
                        await updateServerOrderDeliveryPrice(res.task_id, orderNoList, 'Dunzo', res.estimated_price, server);
                        resolve(deliveryOrderObj);

                    }, async (error) => {
                        console.log('Error while calling dunzoApisHttpCall ', error);
                        if (error && error.code === 'duplicate_request') {
                            if (error.details && error.details.task_id) {
                                const deliveryOrderObj = {
                                    reference_id: taskObj.reference_id,
                                    request_id: taskObj.request_id,
                                    deliveryTaskId: error.details.task_id,
                                    orderNoList,
                                    deliveryTaskState: 'created',
                                    deliveryVendor: 'Dunzo',
                                    serverNameOrderType: server
                                };
                                await dao.saveDeliveryOrder(deliveryOrderObj);
                                await updateServerOrderDeliveryPrice(error.details.task_id, orderNoList, 'Dunzo', error.details.estimated_price, server);
                                resolve(deliveryOrderObj);
                            }
                        } else {
                            reject(error);
                        }
                    });
            }
        } catch (error) {
            console.log('Error while calling createTask ', error);
            reject(error);
        }
    });
}

const trackTask = (task_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const urlParams = `/api/v1/tasks/${task_id}/status`;
            const header = {
                'client-id': process.env.DUNZO_CLIENT_ID, 'Authorization': token,
                'Content-Type': 'application/json', 'Accept-Language': 'en_US'
            };
            const status = await dunzoApisHttpCall(urlParams, 'GET', null, header);
            updateDeliveryOrderStatus(status.task_id, status.state)
            resolve(status);
        } catch (error) {
            console.log('Error while trackTask ', error);
            if (error && error.status === 401) {
                global.dunzoToken = undefined;
            }
            reject(error);
        }
    });
}
const cancelDunzoTask = (task_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const urlParams = `/api/v1/tasks/${task_id}/_cancel`;
            const header = {
                'client-id': process.env.DUNZO_CLIENT_ID, 'Authorization': token,
                'Content-Type': 'application/json', 'Accept-Language': 'en_US'
            };
            const body = { 'cancellation_reason': 'delivery task is very slow' }
            const status = await dunzoApisHttpCall(urlParams, 'POST', body, header);
            console.log('cancelDunzoTask response ', status)
            resolve({ status: 'cancelled' });
        } catch (error) {
            console.log('Error while cancelDunzoTask ', error);
            if (error && error.status === 401) {
                global.dunzoToken = undefined;
            }
            reject(error);
        }
    });
}

const quote = (taskObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            let deliveryVendorList = ['Porter', 'ShadowFax', 'Dunzo'];
            const response = await vendorSelection(taskObj, 0, 'quote', deliveryVendorList);
            resolve(response);
        } catch (error) {
            reject(error);
        }
    });
}

const createTask = (taskObj, orderNoList, server) => {
    let deliveryVendorList = ['Dunzo', 'Porter', 'ShadowFax', 'Pidge'];
    // const orderVendor = taskObj.deliveryVendor;
    // if(orderVendor){
    //     deliveryVendorList.splice(deliveryVendorList.indexOf(orderVendor),1);
    //     deliveryVendorList.unshift(orderVendor)
    // }
    return new Promise(async (resolve, reject) => {
        try {
            const response = await vendorSelection({ taskObj, orderNoList }, 0, 'create', deliveryVendorList, server);
            resolve(response);
        } catch (error) {
            console.log('Error while calling createTask ', error);
            reject(error);
        }
    });
}

const vendorSelection = async (data, index, type, deliveryVendorList, server) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (index === deliveryVendorList.length) {
                reject('No Vendor Found');
            }
            const vendor = deliveryVendorList[index];
            switch (vendor) {
                case 'Dunzo':
                    if (type === 'quote') {
                        const response = await dunzoQuote(data);
                        response.deliveryVendor = 'Dunzo';
                        resolve(response);
                    } else if (type === 'create') {
                        const response = await createDunzoTask(data.taskObj, data.orderNoList, server);
                        response.deliveryVendor = 'Dunzo';
                        resolve(response);
                    }
                    break;
                case 'Porter':
                    if (type === 'quote') {
                        const response = await quotePorterTask(data);
                        response.deliveryVendor = 'Porter';
                        resolve(response);
                    } else if (type === 'create') {
                        const response = await createPorterTask(data.taskObj, data.orderNoList, server);
                        response.deliveryVendor = 'Porter';
                        resolve(response);
                    }
                    break;
                case 'ShadowFax':
                    if (type === 'quote') {
                        const response = await quoteShadowFaxTask(data);
                        response.deliveryVendor = 'ShadowFax';
                        resolve(response);
                    } else if (type === 'create') {
                        const response = await createShadowFaxTask(data.taskObj, data.orderNoList, server);
                        response.deliveryVendor = 'ShadowFax';
                        resolve(response);
                    }
                    break;
                case 'Pidge':
                    if (type === 'quote') {
                        const response = await dunzoQuote(data);
                        response.deliveryVendor = 'Pidge';
                        resolve(response);
                    } else if (type === 'create') {
                        const response = await createPidge3PLOrder(data.taskObj, data.orderNoList, server);
                        response.deliveryVendor = 'Pidge';
                        resolve(response);
                    }
                    break;
                default:
                    reject('No Vendor Found');
            }
        } catch (error) {
            try {
                if (data && data.orderNoList && data.orderNoList.length > 1) {
                    reject('No Vendor Found');
                } else {
                    index++;
                    const res = await vendorSelection(data, index, type, deliveryVendorList, server);
                    resolve(res);
                }

            } catch (error) {
                reject('No Vendor Found');
            }

        }
    })

}

const dunzoQuote = (taskObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const urlParams = `/api/v2/quote`;
            const header = {
                'client-id': process.env.DUNZO_CLIENT_ID, 'Authorization': token,
                'Content-Type': 'application/json', 'Accept-Language': 'en_US'
            };
            const status = await dunzoApisHttpCall(urlParams, 'POST', taskObj, header)
            resolve(status);
        } catch (error) {
            console.log('Error while calling quote ', error);
            if (error && error.status === 401) {
                global.dunzoToken = undefined;
            }
            reject(error);
        }
    });
}

const dunzocallback = async (callbackPayload) => {
    try {
        console.log('dunzocallback ==> ');
        const eventType = callbackPayload.event_type;
        const deliveryTaskId = callbackPayload.task_id;
        if (eventType === 'task_state_update') {
            const trackPayload = await trackTask(deliveryTaskId);
            const payload = await dao.getDeliveryOrderDetails(deliveryTaskId);
            const deliveryTaskState = trackPayload.state;
            const orderRef = trackPayload.reference_id;
            let orderNos = '';
            let kitchenId;
            let dropLocation = [];
            if (orderRef) {
                const orders = orderRef.split('_');
                if (orders[0] === 'kitchen' || orders[0] === 'mealawe order') {
                    orders.splice(0, 1)
                    orderNos = orders.join(', ');
                    if (trackPayload.locations_order && trackPayload.locations_order.length) {
                        trackPayload.locations_order.forEach(location => {
                            if (location.type === 'pick') {
                                kitchenId = location.reference_id
                            }
                            if (location.type === 'drop') {
                                const order = location.reference_id.split('_');
                                dropLocation.push({ state: location.state, orderNo: order[0], customerId: order[1] })
                            }
                        });
                    }
                    if (deliveryTaskState === 'runner_cancelled' || deliveryTaskState === 'reached_for_pickup') {
                        if (kitchenId) {
                            sendDeliveryFcmMessage(deliveryTaskState, orderNos, kitchenId, 'KITCHEN')
                        }
                    }
                    if (deliveryTaskState === 'pickup_complete' || deliveryTaskState === 'delivered') {
                        if (kitchenId) {
                            sendDeliveryFcmMessage(deliveryTaskState, orderNos, kitchenId, 'KITCHEN');
                            const intOrdersNo = orders.map(ele => parseInt(ele));
                            console.log('dunzocallback0 ', deliveryTaskState, orderNos);
                            await payServerFoodOrderAmtToKitchenDirect(intOrdersNo, payload.serverNameOrderType);
                        }
                        if (deliveryTaskState === 'pickup_complete') {
                            dropLocation.forEach((drop) => {
                                updateServerFoodOrderStatus(payload.serverNameOrderType, drop.orderNo, 'handedOverToDeliveryBoy');
                            });
                        }
                    }
                    if (deliveryTaskState === 'reached_for_delivery') {
                        dropLocation.forEach((drop) => {
                            if (drop.state === 'ACTIVE') {
                                updateServerFoodOrderStatus(payload.serverNameOrderType, drop.orderNo, 'onTheWay');
                            }
                        });
                    }
                    if (deliveryTaskState === 'delivered') {
                        dropLocation.forEach((drop) => {
                            console.log('dunzocallback1 ', deliveryTaskState, drop.orderNo, drop.state);
                            if (drop.state === 'COMPLETED') {
                                updateServerFoodOrderStatus(payload.serverNameOrderType, drop.orderNo, 'delivered');
                                console.log('dunzocallback2 ', deliveryTaskState, drop.orderNo, drop.state);
                            }
                        });
                    }

                } else if (orders[0] === 'packaging') {

                }

            }
        }
    } catch (e) {
        console.log('error on dunzocallback service layer ', e);
    }
}


const createPorterTask = (taskObj, orderNoList, server) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deliveryOrder = await dao.getDeliveryOrder(taskObj.reference_id);
            if (deliveryOrder && deliveryOrder._id) {
                console.log('sending delivery order from DB');
                resolve(deliveryOrder);
            } else {
                const urlParams = '/v1/orders/create';
                const header = {
                    'x-api-key': process.env.PORTER_TOKEN,
                    'Content-Type': 'application/json'
                };
                const porterbody = createPorterCreateObj(taskObj);
                porterApisHttpCall(urlParams, 'POST', porterbody, header)
                    .then(async (res) => {
                        console.log('createPorterTask response ', res);
                        const deliveryOrderObj = {
                            deliveryTaskId: res.order_id,
                            request_id: taskObj.reference_id,
                            reference_id: taskObj.reference_id,
                            orderNoList,
                            deliveryVendor: 'Porter',
                            serverNameOrderType: server
                        };
                        await dao.saveDeliveryOrder(deliveryOrderObj);
                        const estimated_price = (res.estimated_fare_details.minor_amount) / 100;
                        await updateServerOrderDeliveryPrice(res.order_id, orderNoList, 'Porter', estimated_price, server);
                        resolve(deliveryOrderObj);
                    }, async (error) => {
                        console.log('Error while calling createPorterTask ', error);
                        const msg = error && error.message ? error.message : 'Error while calling createPorterTask';
                        reject({ status: 'invalid', msg });
                    });
            }

        } catch (error) {
            console.log('Error while calling createTask ', error);
            reject({ status: 'invalid' });
        }
    });
}

const createPorterCreateObj = (taskObj) => {
    console.log('pickupAddress.contact_details ', taskObj);
    const body = {
        request_id: Math.ceil(Math.random() * 100) + taskObj.reference_id,
        pickup_details: {}, drop_details: {}
    };
    const pickupAddress = taskObj.pickup_details[0].address;
    const dropAddress = taskObj.drop_details[0].address;
    body.pickup_details = {
        address: {
            street_address1: pickupAddress.street_address_1,
            street_address2: pickupAddress.street_address_2,
            landmark: pickupAddress.landmark ? pickupAddress.landmark : '',
            lat: pickupAddress.lat,
            lng: pickupAddress.lng,
            contact_details: { name: pickupAddress.contact_details.name, phone_number: pickupAddress.contact_details.phone_number }
        }
    }
    body.drop_details = {
        address: {
            street_address1: dropAddress.street_address_1,
            street_address2: dropAddress.street_address_2,
            landmark: dropAddress.landmark ? dropAddress.landmark : '',
            lat: dropAddress.lat,
            lng: dropAddress.lng,
            contact_details: { name: dropAddress.contact_details.name, phone_number: dropAddress.contact_details.phone_number }
        }
    }
    return body;
}

const trackPorterTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let apiCacheResponse = await getDBCacheData(order_id);
            if (apiCacheResponse) {
                resolve(apiCacheResponse);
            } else {
                const urlParams = `/v1/orders/${order_id}`;
                const header = { 'x-api-key': process.env.PORTER_TOKEN, 'Content-Type': 'application/json' };
                const apiResponse = await porterApisHttpCall(urlParams, 'GET', null, header);
                // console.log('apiResponse',apiResponse);
                updateDeliveryOrderStatus(order_id, apiResponse.status);
                const responseObj = { state: apiResponse.status };
                if (apiResponse && apiResponse.order_timings) {
                    const utcSeconds = apiResponse.order_timings.pickup_time;
                    const pickup_time = new Date(0);
                    pickup_time.setUTCSeconds(utcSeconds);
                    const currentTime = new Date();
                    console.log('pickup_time ', pickup_time)
                    responseObj.eta = {
                        pickup: Math.ceil((pickup_time.getTime() - currentTime.getTime()) / (1000 * 60)),
                        dropoff: apiResponse.order_timings.dropoff
                    }
                }
                if (apiResponse.partner_info && apiResponse.partner_info.location && apiResponse.partner_info.mobile) {
                    responseObj.runner = {
                        name: apiResponse.partner_info.name,
                        phone_number: apiResponse.partner_info.mobile.mobile_number,
                        location: { lat: apiResponse.partner_info.location.lat, lng: apiResponse.partner_info.location.long }
                    }
                }
                setDBCacheData(order_id, responseObj, 60000);
                resolve(responseObj);
            }
        } catch (error) {
            console.log('Error while trackPorterTask ', error);
            reject(error);
        }
    });
}

const cancelPorterTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const urlParams = `/v1/orders/${order_id}/cancel`;
            const header = { 'x-api-key': process.env.PORTER_TOKEN, 'Content-Type': 'application/json' };
            const status = await porterApisHttpCall(urlParams, 'POST', null, header);
            resolve(status);
        } catch (error) {
            console.log('Error while cancelPorterTask ', error);
            reject(error);
        }
    });
}

const quotePorterTask = (quoteBody) => {
    return new Promise(async (resolve, reject) => {
        try {
            const porterBody = {
                pickup_details: quoteBody.pickup_details[0],
                drop_details: quoteBody.drop_details[0],
                customer: (quoteBody.customer && quoteBody.customer.name) ? quoteBody.customer : { name: "User", mobile: { country_code: "+91", number: "1234567890" } }
            };
            const urlParams = '/v1/get_quote';
            const header = {
                'x-api-key': process.env.PORTER_TOKEN,
                'Content-Type': 'application/json'
            };
            // console.log('quoteBody ',quoteBody);
            porterApisHttpCall(urlParams, 'POST', porterBody, header)
                .then(async (res) => {
                    // console.log('quotePorterTask response ',res);
                    const finalResponse = {}
                    if (res.vehicles) {
                        res.vehicles.forEach(vehicle => {
                            if (vehicle.type === "2 Wheeler") {
                                finalResponse.estimated_price = (vehicle.fare.minor_amount) / 100;
                            }
                        });
                        if (finalResponse.estimated_price) {
                            resolve(finalResponse);
                        } else {
                            reject('Error while calling quotePorterTask ');
                        }
                    } else {
                        reject('Error while calling quotePorterTask ');
                    }
                }, async (error) => {
                    console.log('Error while calling quotePorterTask ', error);
                    reject('Error while calling quotePorterTask ');
                });
        } catch (error) {
            console.log('Error while calling quotePorterTask ', error);
            reject('Error while calling quotePorterTask ');
        }
    });
}

const portercallback = async (callbackPayload) => {
    try {
        console.log('portercallback1 ==> ', callbackPayload);
        if (callbackPayload && callbackPayload.order_id) {
            const deliveryTaskId = callbackPayload.order_id;
            console.log('portercallback10 ', deliveryTaskId);
            const trackPayload = await trackPorterTask(deliveryTaskId);
            const payload = await dao.getDeliveryOrderByTaskId(deliveryTaskId);
            console.log('portercallback11 ', trackPayload);
            console.log('portercallback12 ', payload);
            if (payload && trackPayload) {
                const deliveryTaskState = trackPayload.state;
                const orderRef = payload.request_id;
                let orderNos = [];
                if (orderRef) {
                    let orders = orderRef.split('_');
                    orders.splice(0, 1);
                    orders = orders.map(orderNo => parseInt(orderNo));
                    orderNos = orders.join(', ');
                    console.log('portercallback2 ==> ', deliveryTaskState, orderRef, orders, orderNos);
                    const foodOrderList = await getServerFoodOrderList(payload.serverNameOrderType, orders);
                    console.log('portercallback22 ==> order found');
                    let kitchenId;
                    foodOrderList.forEach(foodOrder => {
                        kitchenId = foodOrder.kitchenId
                        if (deliveryTaskState === 'live') {
                            updateServerFoodOrderStatus(payload.serverNameOrderType, foodOrder.orderNo, 'handedOverToDeliveryBoy');
                            console.log('portercallback3 ==> ', foodOrder.orderNo, kitchenId);
                        }
                        if (deliveryTaskState === 'ended') {
                            updateServerFoodOrderStatus(payload.serverNameOrderType, foodOrder.orderNo, 'delivered');
                            console.log('portercallback4 ==> ', foodOrder.orderNo, kitchenId);
                        }
                    });
                    if (kitchenId) {
                        if (deliveryTaskState === 'live') {
                            sendDeliveryFcmMessage('handedOverToDeliveryBoy', orderNos, kitchenId, 'KITCHEN');
                            const intOrdersNo = orders.map(ele => parseInt(ele));
                            await payServerFoodOrderAmtToKitchenDirect(intOrdersNo, payload.serverNameOrderType);
                            console.log('portercallback5 ==> ', intOrdersNo);
                        }
                        if (deliveryTaskState === 'ended') {
                            sendDeliveryFcmMessage('delivered', orderNos, kitchenId, 'KITCHEN');
                            const intOrdersNo = orders.map(ele => parseInt(ele));
                            await payServerFoodOrderAmtToKitchenDirect(intOrdersNo, payload.serverNameOrderType);
                            console.log('portercallback6 ==> ', intOrdersNo);
                        }
                    }
                }
            }

        }

    } catch (e) {
        console.log('error on portercallback service layer ', e);
    }
}


const quoteShadowFaxTask = (quoteBody) => {
    return new Promise(async (resolve, reject) => {
        try {
            const shadowFaxbody = {
                pickup_details: {
                    building_name: "NA",
                    address: "NA"
                },
                drop_details: {
                    building_name: "NA",
                    address: "NA"
                }
            };
            if (process.env.PRODUCTION === 'true') {
                shadowFaxbody.pickup_details.latitude = quoteBody.pickup_details[0].lat;
                shadowFaxbody.pickup_details.longitude = quoteBody.pickup_details[0].lng;
                shadowFaxbody.drop_details.latitude = quoteBody.drop_details[0].lat;
                shadowFaxbody.drop_details.longitude = quoteBody.drop_details[0].lng;
            } else {
                shadowFaxbody.pickup_details.latitude = "12.9276526";
                shadowFaxbody.pickup_details.longitude = "77.5620661";
                shadowFaxbody.drop_details.latitude = "12.897338";
                shadowFaxbody.drop_details.longitude = "77.552905";
            }
            const urlParams = '/order/serviceability/';
            const header = {
                'Authorization': `${process.env.SHADOWFAX_TOKEN}`,
                'Content-Type': 'application/json'
            };
            shadowFaxApisHttpCall(urlParams, 'POST', shadowFaxbody, header)
                .then(async (res) => {
                    // console.log('quotePorterTask response ',res); 
                    // finalResponse.estimated_price = (vehicle.fare.minor_amount)/100;
                    const finalResponse = {}
                    if (res.is_serviceable) {
                        finalResponse.estimated_price = res.total_amount;
                        resolve(finalResponse);
                    } else {
                        reject('Error while calling quoteShadowFaxTask ');
                    }
                }, async (error) => {
                    console.log('Error while calling quoteShadowFaxTask ');
                    reject('Error while calling quoteShadowFaxTask ');
                });
        } catch (error) {
            console.log('Error while calling quoteShadowFaxTask ', error);
            reject('Error while calling quoteShadowFaxTask ');
        }
    });
}

const getShadowFaxEstimatedPrice = (taskObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pickupAddress = taskObj.pickup_details[0].address;
            const dropAddress = taskObj.drop_details[0].address;
            const quoteBody = {
                pickup_details: [{
                    lat: pickupAddress.lat,
                    lng: pickupAddress.lng
                }],
                drop_details: [{
                    lat: dropAddress.lat,
                    lng: dropAddress.lng
                }]
            };
            const finalResponse = await quoteShadowFaxTask(quoteBody);
            const estimated_price = finalResponse.estimated_price;
            resolve(estimated_price);
        } catch (error) {
            console.log('Error while calling getShadowFaxEstimatedPrice ', error);
            resolve(0);
        }
    });
}

const createShadowFaxTask = (taskObj, orderNoList, server) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deliveryOrder = await dao.getDeliveryOrder(taskObj.reference_id);
            if (deliveryOrder && deliveryOrder._id) {
                console.log('sending delivery order from DB')
                resolve(deliveryOrder);
            } else {
                const urlParams = '/order/create/';
                const header = {
                    'Authorization': process.env.SHADOWFAX_TOKEN,
                    'Content-Type': 'application/json'
                };
                const shadowFaxbody = createShadowfaxOrderObj(taskObj, orderNoList);
                shadowFaxApisHttpCall(urlParams, 'POST', shadowFaxbody, header)
                    .then(async (res) => {
                        if (res && (res.is_order_created || res.message === 'Order Id already created')) {
                            const data = res;
                            console.log('createShadowFaxTask response ', data);
                            const deliveryTaskId = shadowFaxbody.order_details.order_id;
                            const deliveryOrderObj = {
                                deliveryTaskId: deliveryTaskId,
                                request_id: taskObj.reference_id,
                                reference_id: taskObj.reference_id,
                                orderNoList,
                                deliveryVendor: 'ShadowFax',
                                serverNameOrderType: server
                            };
                            await dao.saveDeliveryOrder(deliveryOrderObj);
                            //important
                            const estimated_price = await getShadowFaxEstimatedPrice(taskObj);
                            await updateServerOrderDeliveryPrice(deliveryTaskId, orderNoList, 'ShadowFax', estimated_price, server);
                            resolve(deliveryOrderObj);
                        } else {
                            reject({ status: 'invalid', msg: 'Error while calling createShadowFaxTask' });
                        }
                    }, async (error) => {
                        console.log('Error while calling createShadowFaxTask ', error);
                        const msg = error && error.message ? error.message : 'Error while calling createShadowFaxTask';
                        reject({ status: 'invalid', msg });
                    });
            }
        } catch (error) {
            console.log('Error while calling createTask ', error);
            reject({ status: 'invalid' });
        }
    });
}

const createShadowfaxOrderObj = (taskObj, orderNoList) => {
    console.log('pickupAddress.contact_details ', taskObj);
    const body = {
        pickup_details: {}, drop_details: {},
        order_details: {
            order_id: Math.ceil(Math.random() * 100000000),
            is_prepaid: true,
        },
        user_details: {
            contact_number: process.env.SHADOWFAX_CONATCT,
            credits_key: process.env.SHADOWFAX_CLIENT_ID
        },
        validations: {
            pickup: {
                is_otp_required: false
            },
            drop: {
                is_otp_required: true
            }
        },
        communications: {
            send_sms_to_pickup_person: false,
            send_sms_to_drop_person: true
        }
    };
    const pickupAddress = taskObj.pickup_details[0].address;
    const dropAddress = taskObj.drop_details[0].address;
    body.pickup_details = {
        name: pickupAddress.contact_details.name,
        address: pickupAddress.street_address_1,
        landmark: pickupAddress.landmark,
        city: pickupAddress.street_address_2,
        contact_number: pickupAddress.contact_details.phone_number
    }
    body.drop_details = {
        name: dropAddress.contact_details.name,
        address: dropAddress.street_address_1,
        landmark: dropAddress.landmark,
        city: dropAddress.street_address_2,
        name: dropAddress.contact_details.name,
        contact_number: dropAddress.contact_details.phone_number
    }
    if (process.env.PRODUCTION === 'true') {
        body.pickup_details.latitude = pickupAddress.lat;
        body.pickup_details.longitude = pickupAddress.lng;
        body.drop_details.latitude = dropAddress.lat;
        body.drop_details.longitude = dropAddress.lng;
    } else {
        body.pickup_details.latitude = '12.9276526';
        body.pickup_details.longitude = '77.5620661';
        body.drop_details.latitude = '12.897338';
        body.drop_details.longitude = '77.552905';
    }
    return body;
}

const trackShadowFaxTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const urlParams = `/order/track/${order_id}/`;
            const header = {
                'Authorization': process.env.SHADOWFAX_TOKEN,
                'Content-Type': 'application/json'
            };
            const apiResponse = await shadowFaxApisHttpCall(urlParams, 'GET', null, header);
            console.log('apiResponse', apiResponse);
            if (apiResponse && apiResponse.status) {
                const data = apiResponse;
                updateDeliveryOrderStatus(order_id, apiResponse.status);
                const responseObj = { state: apiResponse.status };
                if (data.order_details) {
                    responseObj.eta = {
                        pickup: data.pickup_eta,
                        dropoff: data.drop_eta
                    }
                }
                if (data.sfx_order_id) {
                    responseObj.sfx_order_id = data.sfx_order_id;
                }
                if (data.rider_name) {
                    responseObj.runner = {
                        name: data.rider_name,
                        phone_number: data.rider_contact_number,
                        location: { lat: data.rider_latitude, lng: data.rider_longitude }
                    }
                }
                resolve(responseObj);
            } else {
                reject('Error while tracking ShadowFax Task');
            }
        } catch (error) {
            console.log('Error while tracking ShadowFax Task ', error);
            reject(error);
        }
    });
}

const cancelShadowFaxTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const urlParams = `/order/cancel/`;
            const header = {
                'Authorization': process.env.SHADOWFAX_TOKEN,
                'Content-Type': 'application/json'
            };
            const status = await shadowFaxApisHttpCall(urlParams, 'POST', { order_id }, header);
            resolve(status);
        } catch (error) {
            console.log('Error while cancelPorterTask ', error);
            reject(error);
        }
    });
}

const shadowFaxcallback = async (callbackPayload) => {
    try {
        console.log('shadowFaxcallback ==> ', callbackPayload);
        if (callbackPayload && callbackPayload.coid) {
            const deliveryTaskId = callbackPayload.coid;
            console.log('shadowFaxcallback10 ', deliveryTaskId);
            const trackPayload = await trackShadowFaxTask(deliveryTaskId);
            const payload = await dao.getDeliveryOrderByTaskId(deliveryTaskId);
            console.log('shadowFaxcallback1 ', trackPayload);
            console.log('shadowFaxcallback12 ', payload);
            if (payload && trackPayload) {
                const deliveryTaskState = trackPayload.state;
                const orderRef = payload.request_id;
                let orderNos = [];
                if (orderRef) {
                    let orders = orderRef.split('_');
                    orders.splice(0, 1);
                    orders = orders.map(orderNo => parseInt(orderNo));
                    orderNos = orders.join(', ');
                    console.log('shadowFaxcallback2 ==> ', deliveryTaskState, orderRef, orders, orderNos);
                    const foodOrderList = await getServerFoodOrderList(payload.serverNameOrderType, orders);
                    console.log('shadowFaxcallback22 ==> order found');
                    let kitchenId;
                    foodOrderList.forEach(foodOrder => {
                        kitchenId = foodOrder.kitchenId
                        if (deliveryTaskState === 'COLLECTED') {
                            updateServerFoodOrderStatus(payload.serverNameOrderType, foodOrder.orderNo, 'handedOverToDeliveryBoy');
                            console.log('shadowFaxcallback3 ==> ', foodOrder.orderNo, kitchenId);
                        }
                        if (deliveryTaskState === 'DELIVERED') {
                            updateServerFoodOrderStatus(payload.serverNameOrderType, foodOrder.orderNo, 'delivered');
                            console.log('shadowFaxcallback4 ==> ', foodOrder.orderNo, kitchenId);
                        }
                    });
                    if (kitchenId) {
                        if (deliveryTaskState === 'ARRIVED') {
                            sendDeliveryFcmMessage('reached_for_pickup', orderNos, kitchenId, 'KITCHEN')
                        }
                        if (deliveryTaskState === 'COLLECTED') {
                            sendDeliveryFcmMessage('handedOverToDeliveryBoy', orderNos, kitchenId, 'KITCHEN');
                            const intOrdersNo = orders.map(ele => parseInt(ele));
                            await payServerFoodOrderAmtToKitchenDirect(intOrdersNo, payload.serverNameOrderType);
                            console.log('shadowFaxcallback5 ==> ', intOrdersNo);
                        }
                        if (deliveryTaskState === 'DELIVERED') {
                            sendDeliveryFcmMessage('delivered', orderNos, kitchenId, 'KITCHEN');
                            const intOrdersNo = orders.map(ele => parseInt(ele));
                            await payServerFoodOrderAmtToKitchenDirect(intOrdersNo, payload.serverNameOrderType);
                            console.log('shadowFaxcallback6 ==> ', intOrdersNo);
                        }
                    }
                }
            }

        }

    } catch (e) {
        console.log('error on portercallback service layer ', e);
    }
}

const createPidge3PLOrder = async (taskObj, orderNoList, server) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deliveryOrder = await dao.getDeliveryOrder(taskObj.reference_id);
            if (deliveryOrder && deliveryOrder._id) {
                console.log('sending delivery order from DB');
                resolve(deliveryOrder);
            } else {
                const orderNo = orderNoList[0];
                const pickupAddress = taskObj.pickup_details[0].address;
                const dropAddress = taskObj.drop_details[0].address;
                const pidgeTask = {
                    sender_detail: {
                        address: {
                            address_line_1: pickupAddress.street_address_1,
                            address_line_2: pickupAddress.street_address_2,
                            landmark: pickupAddress.landmark ? pickupAddress.landmark : 'NA',
                            city: 'NA',
                            state: 'NA',
                            pincode: '000000',
                            latitude: pickupAddress.lat,
                            longitude: pickupAddress.lng
                        },
                        name: pickupAddress.contact_details.name,
                        mobile: pickupAddress.contact_details.phone_number
                    },
                    poc_detail: {
                        name: 'mealawe support',
                        mobile: '9665888488',
                        email: 'help@mealwe.com'
                    },
                    trips: []
                };
                console.log('####', orderNo, dropAddress.contact_details.customerEmail);
                const tripObj = {
                    receiver_detail: {
                        address: {
                            address_line_1: dropAddress.street_address_1,
                            address_line_2: dropAddress.street_address_2,
                            landmark: dropAddress.landmark ? dropAddress.landmark : 'NA',
                            city: 'NA',
                            state: 'NA',
                            pincode: '000000',
                            latitude: dropAddress.lat,
                            longitude: dropAddress.lng
                        },
                        name: dropAddress.contact_details.name,
                        mobile: dropAddress.contact_details.phone_number,
                        email: dropAddress.contact_details.customerEmail.toLowerCase()
                    },
                    source_order_id: `${orderNo}`,
                    reference_id: `${orderNo}`,
                    delivery_date: formatOnlyDate(new Date())
                };
                const localTime = getLocalDate();
                let startHour = localTime.getHours();
                startHour = startHour < 10 ? '0' + startHour : startHour;
                let startMinute = localTime.getMinutes();
                const localTimeMore30mins = getLocalDate();
                localTimeMore30mins.setMinutes(startMinute + 30);
                let endHour = localTimeMore30mins.getHours();
                endHour = endHour < 10 ? '0' + endHour : endHour;
                let endMinute = localTimeMore30mins.getMinutes();
                startMinute = startMinute < 10 ? '0' + startMinute : startMinute;
                endMinute = endMinute < 10 ? '0' + endMinute : endMinute;
                tripObj.delivery_slot = `${startHour}:${startMinute}-${endHour}:${endMinute}`;
                console.log('tripObj.delivery_slot', tripObj.delivery_slot);
                pidgeTask.trips.push(tripObj);
                const token = await getPidgeTokan(true);
                const urlParams = `/v1.0/store/channel/vendor/order`;
                const header = { 'Content-Type': 'application/json', Authorization: token };
                const res = await pidgeApisHttpCall(urlParams, 'POST', pidgeTask, header);
                if (res && res.data) {
                    const data = res.data;
                    console.log('createPidge3PLOrder response ', data);
                    const deliveryTaskId = data[orderNo];
                    const deliveryOrderObj = {
                        deliveryTaskId: deliveryTaskId,
                        request_id: taskObj.reference_id,
                        reference_id: taskObj.reference_id,
                        orderNoList,
                        deliveryVendor: 'Pidge',
                        serverNameOrderType: server
                    };
                    await dao.saveDeliveryOrder(deliveryOrderObj);
                    //important
                    const estimated_price = await getShadowFaxEstimatedPrice(taskObj);
                    await updateServerOrderDeliveryPrice(deliveryTaskId, orderNoList, 'Pidge', estimated_price, server);
                    resolve(deliveryOrderObj);
                } else {
                    const msg = 'Error while calling createPidge3PLOrder';
                    reject({ status: 'invalid', msg });
                }
            }
        } catch (error) {
            console.log('Error while createPidge3PLOrder ', error);
            reject(error);
        }
    });
}

const cancelPidge3PLOrder = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getPidgeTokan(true);
            const urlParams = `/v1.0/store/channel/vendor/${order_id}/cancel`;
            const header = { 'Content-Type': 'application/json', Authorization: token };
            const res = await pidgeApisHttpCall(urlParams, 'POST', null, header);
            if (res && res.data) {
                updateDeliveryOrderStatus(order_id, 'cancelled');
                resolve(res.data);
            } else {
                reject('invalid response');
            }

        } catch (error) {
            console.log('Error while cancelPidge3PLOrder ', error);
            reject(error);
        }
    });
}

const getPidgeRiderCurrentLocation = async (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let apiCacheResponse = await getDBCacheData(order_id);
            if (apiCacheResponse) {
                resolve(apiCacheResponse);
            } else {
                const token = await getPidgeTokan(true);
                const urlParams = `/v1.0/store/channel/vendor/order/${order_id}/fulfillment/tracking`;
                const header = { 'Content-Type': 'application/json', Authorization: token };
                const apiResponse = await pidgeApisHttpCall(urlParams, 'GET', null, header);
                console.log('getPidgeRiderCurrentLocation apiResponse', apiResponse);
                if (apiResponse && apiResponse.data) {
                    const data = apiResponse.data;
                    setDBCacheData(order_id, data, 60000);
                    resolve(data);
                } else {
                    resolve({});
                }
            }
        } catch (error) {
            console.log('getPidgeRiderCurrentLocation error', error);
            resolve({});
        }
    });
}

const trackPidgeTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getPidgeTokan(true);
            const urlParams = `/v1.0/store/channel/vendor/order/${order_id}`;
            const header = { 'Content-Type': 'application/json', Authorization: token };
            const apiResponse = await pidgeApisHttpCall(urlParams, 'GET', null, header);
            console.log('apiResponse', apiResponse);
            if (apiResponse && apiResponse.data) {
                const data = apiResponse.data;
                let status;
                if (data.status) {
                    status = data.status;
                }
                if (data.fulfillment && data.fulfillment.status) {
                    status = data.fulfillment.status;
                }

                updateDeliveryOrderStatus(order_id, status);
                const responseObj = { state: status };
                let riderInfo;
                if (data.fulfillment && data.fulfillment.rider) {
                    riderInfo = data.fulfillment.rider;
                    responseObj.runner = {
                        name: riderInfo.name,
                        phone_number: riderInfo.mobile
                    };
                }
                let pickup = '';
                let dropoff = '';
                if (data.fulfillment && data.fulfillment.pickup) {
                    pickup = data.fulfillment.pickup.eta;
                }
                if (data.fulfillment && data.fulfillment.drop) {
                    dropoff = data.fulfillment.drop.eta;
                }
                responseObj.eta = {
                    pickup,
                    dropoff
                }
                try {
                    if (riderInfo) {
                        const riderApiInfo = await getPidgeRiderCurrentLocation(order_id);
                        console.log('getPidgeRiderCurrentLocation riderInfo', riderApiInfo);
                        if (riderApiInfo.location) {
                            responseObj.runner.location = {
                                lat: riderApiInfo.location.latitude,
                                lng: riderApiInfo.location.longitude
                            };
                        }
                    }
                    resolve(responseObj);
                } catch (error) {
                    console.log('getPidgeRiderCurrentLocation error');
                    resolve(responseObj);
                }

            } else {
                reject('Error while tracking trackPidgeTask');
            }
        } catch (error) {
            console.log('Error while trackPidgeTask ', error);
            reject(error);
        }
    });
}

const pidgecallback = async (callbackPayload) => {
    try {
        console.log('pidgecallback ==> ', callbackPayload);
        if (callbackPayload && callbackPayload.id && callbackPayload.fulfillment && callbackPayload.fulfillment.status) {
            // use callbackPayload.id to save as deliveryTaskId and use for getstatus api
            const deliveryTaskId = callbackPayload.id;
            const reference_id = callbackPayload.reference_id;
            console.log('pidgecallback10 ', deliveryTaskId);
            console.log('pidgecallback100 reference_id', reference_id);
            const trackPayload = await trackPidgeTask(deliveryTaskId);
            console.log('pidgecallback11 ', trackPayload);
            let payload = await dao.getDeliveryOrderDetails(deliveryTaskId);
            console.log('pidgecallback12 ', payload);
            const delivery_charge = callbackPayload.fulfillment.delivery_charge;
            console.log('pidgecallback123  ', delivery_charge);
            if (!payload && reference_id) {
                payload = {
                    request_id: reference_id,
                    serverNameOrderType: 'ML'
                }
            }
            if (payload && trackPayload) {
                let deliveryTaskState = trackPayload.state;
                console.log('deliveryTaskState', deliveryTaskState);
                deliveryTaskState = deliveryTaskState.toUpperCase();
                const orderRef = payload.request_id;
                let orderNos = [];
                if (orderRef) {
                    let orders = orderRef.split('_');
                    if (orders && orders.length > 1) {
                        orders.splice(0, 1);
                    }
                    orders = orders.map(orderNo => parseInt(orderNo));
                    orderNos = orders.join(', ');

                    console.log('pidgecallback2 ==> ', deliveryTaskState, orderRef, orders, orderNos);
                    if (deliveryTaskState === 'PICKED_UP' || deliveryTaskState === 'DELIVERED') {
                        const foodOrderList = await getServerFoodOrderList(payload.serverNameOrderType, orders);
                        console.log('pidgecallback22 ==> order found', foodOrderList);
                        let kitchenId;
                        foodOrderList.forEach(foodOrder => {
                            kitchenId = foodOrder.kitchenId
                            if (deliveryTaskState === 'PICKED_UP') {
                                updateServerFoodOrderStatus(payload.serverNameOrderType, foodOrder.orderNo, 'handedOverToDeliveryBoy');
                                console.log('pidgecallback1 ==> ', foodOrder.orderNo, kitchenId);
                            }
                            if (deliveryTaskState === 'DELIVERED') {
                                updateServerFoodOrderStatus(payload.serverNameOrderType, foodOrder.orderNo, 'delivered');
                                console.log('pidgecallback2 ==> ', foodOrder.orderNo, kitchenId);
                            }
                        });
                        if (kitchenId) {
                            if (deliveryTaskState === 'PICKED_UP') {
                                sendDeliveryFcmMessage('handedOverToDeliveryBoy', orderNos, kitchenId, 'KITCHEN');
                                const intOrdersNo = orders.map(ele => parseInt(ele));
                                console.log('intOrdersNo', intOrdersNo)
                                await payServerFoodOrderAmtToKitchenDirect(intOrdersNo, payload.serverNameOrderType);
                                console.log('pidgecallback3 ==> ', intOrdersNo);
                            }
                            if (deliveryTaskState === 'DELIVERED') {
                                sendDeliveryFcmMessage('delivered', orderNos, kitchenId, 'KITCHEN');
                                const intOrdersNo = orders.map(ele => parseInt(ele))
                                await payServerFoodOrderAmtToKitchenDirect(intOrdersNo, payload.serverNameOrderType);
                                console.log('pidgecallback4 ==> ', intOrdersNo);
                            }
                        }

                        if (delivery_charge) {
                            console.log('saving pidge delivery price')
                            await updateServerOrderDeliveryPrice(deliveryTaskId, orders, 'Pidge', delivery_charge, payload.serverNameOrderType);
                        }
                    }
                }
            }
        }

    } catch (e) {
        console.log('error on pidgecallback service layer ', e);
    }
}


module.exports = {
    validateIfManualDelivery, createTask, createDunzoTask, trackTask, cancelDunzoTask, quote,
    dunzocallback, createPorterTask, trackPorterTask, cancelPorterTask, quotePorterTask, portercallback, shadowFaxcallback, pidgecallback,
    createShadowFaxTask, trackShadowFaxTask, cancelShadowFaxTask, shadowFaxcallback, createPidge3PLOrder, cancelPidge3PLOrder, trackPidgeTask,
}
