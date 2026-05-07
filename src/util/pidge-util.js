const { saveDeliveryOrder } = require('../dao/deliveryOrder.dao');
const { kitchenWiseOrders, updateDeliveryOrderInfo } = require('../dao/foodorder.dao');
const { formatOnlyDate } = require('./date-util');
const { pidgeApisHttpCall } = require('./http-api-handler');
const { updateFoodOrderProps } = require("../dao/foodorder.dao");
// Pidge = require('pidge-api'); 
// let client = new Pidge.Client({api_key: process.env.TOOKAN_API_KEY});
global.pidgeAutoToken;
global.pidgeManualToken
const getPidgeTokan = (getAutoToken) => {
    return new Promise(async (resolve, reject) => {
        try {
            let data;
            if (getAutoToken) {
                if (global.pidgeAutoToken) {
                    resolve(global.pidgeAutoToken);
                    return;
                }
                data = {
                    "username": process.env.PIDGE_USERNAME_AUTO,
                    "password": process.env.PIDGE_PASSWORD_AUTO
                }
            } else {
                if (global.pidgeManualToken) {
                    resolve(global.pidgeManualToken);
                    return;
                }
                data = {
                    "username": process.env.PIDGE_USERNAME_AUTO,
                    "password": process.env.PIDGE_PASSWORD_AUTO
                }
            }
            const urlParams = `/v1.0/store/channel/vendor/login`;
            const header = { 'Content-Type': 'application/json' };
            const apiResponse = await pidgeApisHttpCall(urlParams, 'POST', data, header);
            if (apiResponse && apiResponse.data && apiResponse.data.token) {
                if (getAutoToken) {
                    global.pidgeAutoToken = apiResponse.data.token;
                } else {
                    global.pidgeManualToken = apiResponse.data.token;
                }
                resolve(apiResponse.data.token);
            } else {
                reject('Error while fetching pidge token')
            }
        }
        catch (error) {
            // console.log('Error while calling callPidgeAPI ', error);
            reject('Error while calling callPidgeAPI ');
        }
    });
}


const createPidgeTask = (mealType) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderDBList = await kitchenWiseOrders(mealType);
            const pidgeTaskList = [];
            if (orderDBList && orderDBList.length > 0) {
                console.log('createPidgeTask kitchenWiseOrders', orderDBList.length);
                orderDBList.forEach(order => {
                    if (order.kitchenAddress) {
                        const pidgeTask = {
                            sender_detail: {
                                address: {
                                    address_line_1: order.kitchenAddress.address1,
                                    address_line_2: order.kitchenAddress.address2,
                                    landmark: order.kitchenAddress.landmark ? order.kitchenAddress.landmark : 'NA',
                                    city: 'NA',
                                    state: 'NA',
                                    pincode: '000000',
                                    latitude: order.kitchenGeolocation.lat,
                                    longitude: order.kitchenGeolocation.lng
                                },
                                name: order.kitchenName,
                                mobile: order.kitchenPhoneNo
                            },
                            poc_detail: {
                                name: 'mealawe support',
                                mobile: '9665888488',
                                email: 'help@mealwe.com'
                            },
                            trips:[]            
                          };
                          
                        order.orderList.forEach((dailyOrder) => { 
                            console.log('####',dailyOrder.orderNo,dailyOrder.customerEmail);
                            if(dailyOrder.customerLocation){
                                const tripObj = {
                                    receiver_detail: {
                                        address: {
                                            address_line_1: dailyOrder.customerLocation.address,
                                            address_line_2: dailyOrder.customerLocation.location,
                                            landmark: dailyOrder.customerLocation.landmark ? dailyOrder.customerLocation.landmark : 'NA',
                                            city: 'NA',
                                            state: 'NA',
                                            pincode: '000000',
                                            latitude: dailyOrder.customerLocation.geolocation.lat,
                                            longitude: dailyOrder.customerLocation.geolocation.lng
                                        },
                                        name: dailyOrder.customerName,
                                        mobile: dailyOrder.customerPhoneNo,
                                        email: dailyOrder.customerEmail.toLowerCase()
                                    },
                                    source_order_id: `${dailyOrder.orderNo}`,
                                    reference_id: `${dailyOrder.orderNo}`,
                                    delivery_date: formatOnlyDate(dailyOrder.orderDate)
                                };
                                let orderSlot, backupSlot;
                                if (dailyOrder.mealType === 'Breakfast') {
                                    backupSlot = "08:30-09:30";
                                    orderSlot = dailyOrder.subscriptionBreakfastSlot;
                                }
                                if (dailyOrder.mealType === 'Lunch') {
                                    backupSlot = "11:00-01:00";
                                    orderSlot = dailyOrder.subscriptionLunchSlot;
                                }
                                if (dailyOrder.mealType === 'HighTea') {
                                    backupSlot = "16:00-17:00";
                                }
                                if (dailyOrder.mealType === 'Dinner') {
                                    backupSlot = "19:00-21:00";
                                    orderSlot = dailyOrder.subscriptionDinnerSlot;
                                }
                                // console.log('orderSlot',orderSlot);
                                if (orderSlot) {
                                    const slited = orderSlot.split(' - ');
                                    if (slited && slited.length > 0) {
                                        const startSlot12 = slited[0];
                                        const endSlot12 = slited[1];
                                        const startSlotTimrHrArr = startSlot12.split(' ');
                                        const endSlotTimrHrArr = endSlot12.split(' ');
                                        const startSlotArr = startSlotTimrHrArr[0].split(':');
                                        let startHr = parseInt(startSlotArr[0]);
                                        const startMin = startSlotArr[1];
                                        const startAMPM = startSlotTimrHrArr[1];
                                        if (startAMPM === 'PM' && startHr < 10) {
                                            startHr = startHr + 12;
                                        }
                                        const endSlotArr = endSlotTimrHrArr[0].split(':');
                                        let endHr = parseInt(endSlotArr[0]);
                                        const endMin = endSlotArr[1];
                                        const endAMPM = endSlotTimrHrArr[1];
                                        if (endAMPM === 'PM' && endHr < 10) {
                                            endHr = endHr + 12;
                                        }
                                        if (startHr < 10) {
                                            startHr = '0' + startHr;
                                        }
                                        if (endHr < 10) {
                                            endHr = '0' + endHr;
                                        }
                                        const delivery_slot = `${startHr}:${startMin}-${endHr}:${endMin}`;
                                        // console.log('delivery_slot',delivery_slot);
                                        tripObj.delivery_slot = delivery_slot;
                                    }
                                } else {
                                    tripObj.delivery_slot = backupSlot;
                                }
                                pidgeTask.trips.push(tripObj);
                            }
                        });
                        pidgeTaskList.push(pidgeTask);
                    }
                });

            }
            console.log('createPidgeTask0 kitchenWiseOrders', orderDBList.length);
            resolve(pidgeTaskList);
        }
        catch (error) {
            console.log('Error while calling createPidgeTask ', error);
            reject('Error while calling createPidgeTask ');
        }
    });
};

const performPidgeTask = async (mealType) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pidgeTaskList = await createPidgeTask(mealType);
            if (pidgeTaskList && pidgeTaskList.length > 0) {
                const status = await iteratePidgeAPIs(pidgeTaskList, 0);
                resolve(status);
            } else {
                resolve({ status: 'No Data', responseCount: 0 });
            }
        }
        catch (error) {
            console.log('Error while calling callPidgeAPI ', error);
            reject('Error while calling callPidgeAPI ');
        }
    });
}

const iteratePidgeAPIs = async (pidgeTaskList, index) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (index < pidgeTaskList.length) {
                const pidgeOrder = pidgeTaskList[index];
                const pidgeRes = await callPidgeAPI(pidgeOrder);
                // save flag in foodorder DB
                if (pidgeRes && pidgeRes.data) {
                    const deliveryOrderList = [];
                    const foodOrderUpdateListObj = {};
                    const data = pidgeRes.data;
                    console.log('createPidge3PLOrder response ', data);
                    for (let orderNo in data) {
                        const deliveryTaskId = data[orderNo];
                        const deliveryOrderObj = {
                            deliveryTaskId: deliveryTaskId,
                            request_id: `${orderNo}`,
                            reference_id: `${orderNo}`,
                            orderNoList: [orderNo],
                            deliveryVendor: 'Pidge',
                            serverNameOrderType: 'ML'
                        };
                        deliveryOrderList.push(deliveryOrderObj);
                        foodOrderUpdateListObj[orderNo] = deliveryOrderObj;

                    }
                    await updatePidgeToDeliveryTable(deliveryOrderList);
                    await updateFoodOrderDeliveryInfo(foodOrderUpdateListObj);
                    // const dbUpdateOrderList = Object.keys(pidgeRes.data);
                    // if(dbUpdateOrderList.length > 0){
                    //     await updateDeliveryOrderInfo(dbUpdateOrderList);
                    // }                    
                }
                index++;
                const result = await iteratePidgeAPIs(pidgeTaskList, index);
                result.responseCount = index;
                resolve(result);
            } else {
                resolve({ status: 'completed', responseCount: 0 });
            }
        }
        catch (error) {
            console.log('Error while calling iteratePidgeAPIs ', error);
            resolve('error');
        }
    });
}

const callPidgeAPI = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getPidgeTokan();
            const urlParams = `/v1.0/store/channel/vendor/order`;
            const header = { 'Content-Type': 'application/json', Authorization: token };
            const apiResponse = await pidgeApisHttpCall(urlParams, 'POST', data, header);
            console.log('callPidgeAPI success')
            resolve(apiResponse);
        }
        catch (error) {
            console.log('Error while calling callPidgeAPI ', error);
            reject('Error while calling callPidgeAPI ');
        }
    });
}

const updatePidgeToDeliveryTable = async (pidgeDeliveryOrderList) => {
    try {
        const promiseArr = [];
        pidgeDeliveryOrderList.forEach((deliveryOrderObj) => {
            promiseArr.push(saveDeliveryOrder(deliveryOrderObj));
        });
        return await Promise.all(promiseArr);
    } catch (error) {
        console.log('error while updatePidgeToDeliveryTable', error)
    }
}

const updateFoodOrderDeliveryInfo = async (foodOrderUpdateListObj) => {
    try {
        const promiseArr = [];
        for (let orderNo in foodOrderUpdateListObj) {
            const deliveryOrderObj = foodOrderUpdateListObj[orderNo];
            const updateProps = {
                deliveryTaskId: deliveryOrderObj.deliveryTaskId,
                deliveryVendor: 'Pidge',
                deliveryAmtPaidByMealawe: 0,
                selfDeliveryCreated: true,
                startManualDelivery: true
            };
            promiseArr.push(updateFoodOrderProps(deliveryOrderObj.orderNoList, updateProps));
            // promiseArr.push(updateServerOrderDeliveryPrice(deliveryOrderObj.deliveryTaskId,deliveryOrderObj.orderNoList,'Pidge',0,'ML'));
        }
        return await Promise.all(promiseArr);
    } catch (error) {
        console.log('error while updateFoodOrderDeliveryInfo', error)
    }
}





module.exports = {
    getPidgeTokan,
    performPidgeTask
}



