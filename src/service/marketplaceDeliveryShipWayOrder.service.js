const dao = require('../dao/deliveryOrder.dao');
const { shipWayApisHttpCall } = require('../util/http-api-handler');
const { updateMarketPlaceItemOrdersProps, getMarketPlaceItemOrderListByOrderNo, updateOrderStatus, getMarketPlaceItemOrdersByDeliveryTaskId } = require('./marketPlaceItemOrder.service');
const CryptoJS = require('crypto-js');

const updateDeliveryOrderStatus = async (deliveryTaskId, deliveryTaskState) => {
    try {
        return await dao.updateDeliveryOrderStatus(deliveryTaskId, deliveryTaskState);
    } catch (e) {
        console.log('error on updateDeliveryOrderStatus service layer ', e);
    }
}

const createtaskObj = (orderlist, order_id, finalBoxSize) => {
    const firstOrder = orderlist[0];
    const orderPayload = {
        order_id: order_id,
        // warehouse_id: '',
        // return_warehouse_id: '',
        products: [],
        payment_type: 'P',
        billing_address: firstOrder.customerLocation.address,
        billing_address2: firstOrder.customerLocation.location,
        billing_city: firstOrder.customerLocation.city,
        billing_state: firstOrder.customerLocation.state,
        billing_country: 'India',
        billing_firstname: firstOrder.customerName,
        billing_phone: firstOrder.customerPhoneNo,
        billing_zipcode: firstOrder.customerLocation.pincode,
        billing_latitude: firstOrder.customerLocation.geolocation.lat,
        billing_longitude: firstOrder.customerLocation.geolocation.lng,
        shipping_address: firstOrder.customerLocation.address,
        shipping_address2: firstOrder.customerLocation.location,
        shipping_city: firstOrder.customerLocation.city,
        shipping_country: 'India',
        shipping_state: firstOrder.customerLocation.state,
        shipping_firstname: firstOrder.customerName,
        shipping_phone: firstOrder.customerPhoneNo,
        shipping_zipcode: firstOrder.customerLocation.pincode,
        shipping_longitude: firstOrder.customerLocation.geolocation.lng,
        shipping_latitude: firstOrder.customerLocation.geolocation.lat,
        order_date: new Date()
    };
    let sub_total = 0;
    let length = 0;
    let height = 0;
    let weight = 0;
    let breadth = 0;
    let itemsDimenstion = [];
    let orderCount = 0;
    orderlist.forEach(order => {
        const selling_price = (order.itemPrice - order.discount) * order.count;
        sub_total += selling_price;
        height += order.height;
        // length += order.length;
        // breadth += order.breadth;
        breadth = Math.max(breadth, order.breadth);
        length = Math.max(length, order.length);

        weight += order.weight;
        itemsDimenstion.push({
            width: order.breadth, height: order.height, length: order.length
        });
        orderPayload.products.push({
            product: order.itemName,
            price: order.itemPrice,
            product_quantity: order.count,
            discount: order.discount,
            product_code: order.itemId
        });
        orderCount++;
    });
    // const finalBoxSize = getMinBoxWithRotation(itemsDimenstion);
    console.log('finalBoxSize', finalBoxSize);
    orderPayload.box_length = orderCount > 1 ? finalBoxSize.length : length;
    orderPayload.box_height = orderCount > 1 ? finalBoxSize.height : height;
    orderPayload.box_breadth = orderCount > 1 ? finalBoxSize.breadth : breadth;
    orderPayload.order_weight = weight * 1000;
    return orderPayload;
};

const getAuthHeaderString = () => {
    const userName = 'contact@mealawe.com';
    const password = process.env.SHIPWAY_LICENCE_KEY;
    const myString = `${userName}:${password}`;
    const encodedWord = CryptoJS.enc.Utf8.parse(myString); // encodedWord Array object
    const encoded = CryptoJS.enc.Base64.stringify(encodedWord); // string: 'NzUzMjI1NDE='
    const authHeaderString = `Basic ${encoded}`;
    return authHeaderString;
}

const createShipWayDeliveryTask = async (taskObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deliveryOrder = await dao.getDeliveryOrder(taskObj.reference_id);
            if (deliveryOrder && deliveryOrder._id) {
                console.log('sending delivery order from DB', deliveryOrder);
                resolve(deliveryOrder);
            } else {
                const token = getAuthHeaderString();
                taskObj.request_id = 'REF_ID_' + Math.ceil(Math.random() * 100000000);
                const payload = createtaskObj(taskObj.orderlist, taskObj.request_id, taskObj.finalBox);
                const urlParams = '/v2orders';
                const header = {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                };
                shipWayApisHttpCall(urlParams, 'POST', payload, header)
                    .then(async (res) => {
                        console.log('createShipWayDeliveryTask', res);
                        if (res.success) {
                            const deliveryOrderObj = {
                                reference_id: taskObj.reference_id,
                                request_id: taskObj.request_id,
                                deliveryTaskId: taskObj.request_id,
                                orderNoList: taskObj.orderNoList,
                                deliveryTaskState: 'NEW',
                                deliveryVendor: 'shipWay',
                                serverNameOrderType: 'ML'
                            };
                            await dao.saveDeliveryOrder(deliveryOrderObj);
                            const ordersProps = {
                                deliveryVendor: 'shipWay',
                                deliveryTaskId: taskObj.request_id,
                                shipmentId: ''
                            }
                            await updateMarketPlaceItemOrdersProps(taskObj.orderNoList, ordersProps);
                            resolve(deliveryOrderObj);
                        } else {
                            const msg = res && res.message ? res.message : 'Error while calling ShipWayTask';
                            reject({ status: 'invalid', msg });
                        }

                    }, async (error) => {
                        console.log('Error while calling createShipWayDeliveryTask ', error);
                        global.ShipWayToken = undefined;
                        const msg = error && error.message ? error.message : 'Error while calling ShipWayTask';
                        reject({ status: 'invalid', msg });
                    });
            }
        } catch (error) {
            console.log('Error while calling createTask ', error);
            reject(error);
        }
    });
}

const trackShipWayDeliveryTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = getAuthHeaderString();
            const urlParams = `/getorders?orderid=${order_id}`;
            const header = {
                'Authorization': token,
                'Content-Type': 'application/json'
            };
            const apiResponse = await shipWayApisHttpCall(urlParams, 'GET', null, header);
            console.log('trackShipWayDeliveryTask 1',);
            const responseObj = apiResponse;
            let deliveryTaskState;
            let shipmentState;
            let trackingNumber;
            let carrierTitle;
            if (responseObj && responseObj.success === 1) {
                responseObj.message.forEach(order => {
                    console.log('trackShipWayDeliveryTask 2', order);
                    if (order.order_id === order_id) {
                        console.log('trackShipWayDeliveryTask 3', order.order_id, order.status, order.shipment_status);
                        if (order.status === 'O') {
                            deliveryTaskState = 'NEW';
                        } else if (order.status === 'A') {
                            deliveryTaskState = 'Processing';
                        } else if (order.status === 'E') {
                            deliveryTaskState = 'Manifested';
                        } else if (order.status === 'G') {
                            deliveryTaskState = 'Dispatched';
                        } else if (order.status === 'I') {
                            deliveryTaskState = 'cancelled';
                        } else {
                            deliveryTaskState = responseObj.status
                        }

                        if (order.shipment_status) {
                            shipmentState = order.shipment_status;
                            if (order.shipment_status === 'INT') {
                                deliveryTaskState = 'IN TRANSIT';
                            } else if (order.shipment_status === 'DEL') {
                                deliveryTaskState = 'DELIVERED';
                            }

                        }
                        if (order.tracking_number) {
                            trackingNumber = order.tracking_number;
                        }
                        if (order.carrier_title) {
                            carrierTitle = order.carrier_title;
                        }
                        console.log('trackShipWayDeliveryTask 4', deliveryTaskState);
                        updateDeliveryOrderStatus(order_id, deliveryTaskState);
                        updateMarketPlaceItemOrdersStatus(order_id, deliveryTaskState);
                    }
                });
            }
            console.log('trackShipWayDeliveryTask deliveryTaskState', deliveryTaskState);
            resolve({ deliveryTaskState, shipmentState, trackingNumber, carrierTitle });
        } catch (error) {
            console.log('Error while trackShipWayDeliveryTask ', error);
            reject(error);
        }
    });
}

const createShipWayOrderManifest = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = getAuthHeaderString();
            const payload = { order_ids: [order_id] };
            const urlParams = `/Createmanifest/`;
            const header = {
                'Authorization': token,
                'Content-Type': 'application/json'
            };
            const apiResponse = await shipWayApisHttpCall(urlParams, 'POST', null, header);
            let deliveryTaskState;
            if (apiResponse && apiResponse.status) {
                deliveryTaskState = 'Manifested';
                updateDeliveryOrderStatus(order_id, deliveryTaskState);
            }
            console.log('createShipWayOrderManifest', deliveryTaskState);
            resolve({ deliveryTaskState });
        } catch (error) {
            console.log('Error while createShipWayOrderManifest ', error);
            reject(error);
        }
    });
}

const cancelShipWayDeliveryTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = getAuthHeaderString();
            const payload = { order_ids: [order_id] }
            const urlParams = `/Cancelorders/`;
            const header = {
                'Authorization': token,
                'Content-Type': 'application/json'
            };
            const responseObj = await shipWayApisHttpCall(urlParams, 'POST', payload, header);
            console.log('cancelShipWayDeliveryTask response', responseObj);
            let deliveryTaskState;
            if (responseObj && responseObj.length > 1) {
                responseObj.forEach(order => {
                    if (order.order_id === order_id) {
                        if (order.success) {
                            deliveryTaskState = 'cancelled';
                            updateDeliveryOrderStatus(order_id, deliveryTaskState);
                        }
                    }
                });
            }
            console.log('cancelShipWayDeliveryTask', deliveryTaskState);
            resolve({ status: deliveryTaskState });
        } catch (error) {
            console.log('Error while cancelShipWayDeliveryTask ', error);
            reject(error);
        }
    });
}

const createShipWayPickUpTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = getAuthHeaderString();
            const payload = {
                order_ids: order_id,
                pickup_date: '',
                pickup_time: '',
                carrier_id: '',
                office_close_time: '',
                warehouse_id: '',
                return_warehouse_id: '',
                payment_type: '',
                order_ids: order_id
            }
            const urlParams = `/createpickup/`;
            const header = {
                'Authorization': token,
                'Content-Type': 'application/json'
            };
            const responseObj = await shipWayApisHttpCall(urlParams, 'POST', payload, header);
            let deliveryTaskState;
            if (responseObj && responseObj.success) {
                deliveryTaskState = 'pickup';
                updateDeliveryOrderStatus(order_id, deliveryTaskState);
            }
            console.log('createShipWayPickUpTask', deliveryTaskState);
            resolve({ status: deliveryTaskState });
        } catch (error) {
            console.log('Error while createShipWayPickUpTask ', error);
            reject(error);
        }
    });
}

const cancelShipWayShipment = (awb_number) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = getAuthHeaderString();
            const payload = {
                awb_number: [awb_number]
            };
            const urlParams = `/Cancel/`;
            const header = {
                'Authorization': token,
                'Content-Type': 'application/json'
            };
            const responseObj = await shipWayApisHttpCall(urlParams, 'POST', payload, header);
            let deliveryTaskState;
            if (responseObj && responseObj.success) {
                deliveryTaskState = 'pickup';
                updateDeliveryOrderStatus(order_id, deliveryTaskState);
            }
            console.log('createShipWayPickUpTask', deliveryTaskState);
            resolve({ status: deliveryTaskState });
        } catch (error) {
            console.log('Error while createShipWayPickUpTask ', error);
            reject(error);
        }
    });
}

const updateMarketPlaceItemOrdersStatus = async (deliveryTaskId, deliveryStatus) => {
    try {
        let status;
        if (deliveryStatus === 'IN TRANSIT') {
            status = 'inTransit';
        }
        if (deliveryStatus === 'Dispatched') {
            status = 'outForDelivery';
        }
        if (deliveryStatus === 'DELIVERED') {
            status = 'delivered';
        }

        console.log('updateMarketPlaceItemOrdersStatus', deliveryTaskId, deliveryStatus);
        if (status) {
            const existingOrderList = await getMarketPlaceItemOrdersByDeliveryTaskId(deliveryTaskId);
            console.log('updateMarketPlaceItemOrdersStatus2', existingOrderList.length);
            if (existingOrderList && existingOrderList.length > 0) {
                const existingOrder = existingOrderList[0];
                if (existingOrder && existingOrder.orderstatus !== status) {
                    console.log('updateMarketPlaceItemOrdersStatus3 service ', existingOrder.orderstatus, status)
                    const orderNoList = [];
                    existingOrderList.forEach(order => {
                        orderNoList.push(order.orderNo);
                    });
                    await updateMarketPlaceItemOrdersProps(orderNoList, { orderstatus: status });
                    orderNoList.forEach(orderNo => {
                        console.log(deliveryTaskId, orderNo)
                        // sendFcmMessage(status, orderNo, existingOrder.customerId, 'USER');
                    });
                }
            }
        }


    }
    catch (e) {
        console.log('error while updateMarketPlaceItemOrdersStatus ', e)
    }
}


module.exports = {
    createShipWayDeliveryTask,
    trackShipWayDeliveryTask,
    cancelShipWayDeliveryTask,
    createShipWayOrderManifest,
    createShipWayPickUpTask,
    cancelShipWayShipment
}


