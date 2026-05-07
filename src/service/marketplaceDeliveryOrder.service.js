const dao = require('../dao/deliveryOrder.dao');
const { getMinBoxWithRotation } = require('../util/delivery-order-util');
const { sendFcmMessage } = require('../util/fcm-message-handler');
const { shipRocketApisHttpCall } = require('../util/http-api-handler');
const { updateMarketPlaceItemOrdersProps, getMarketPlaceItemOrderListByOrderNo, updateOrderStatus, getMarketPlaceItemOrderByDeliveryTaskId, getMarketPlaceItemOrdersByDeliveryTaskId } = require('./marketPlaceItemOrder.service');
global.shipRocketToken;


const createtaskObj = (orderlist, order_id, finalBoxSize) => {
    const firstOrder = orderlist[0];
    const orderPayload = {
        order_id: order_id,
        order_date: new Date(),
        pickup_location: 'warehouse',
        billing_customer_name: firstOrder.customerName,
        billing_last_name: '',
        billing_address: firstOrder.customerLocation.address,
        billing_address_2: firstOrder.customerLocation.location,
        billing_city: firstOrder.customerLocation.city,
        billing_pincode: firstOrder.customerLocation.pincode,
        billing_state: firstOrder.customerLocation.state,
        billing_country: 'India',
        billing_email: 'contact@mealawe.com',
        billing_phone: firstOrder.customerPhoneNo,
        shipping_is_billing: false,
        shipping_customer_name: firstOrder.customerName,
        shipping_address: firstOrder.customerLocation.address,
        shipping_address_2: firstOrder.customerLocation.location,
        shipping_city: firstOrder.customerLocation.city,
        shipping_pincode: firstOrder.customerLocation.pincode,
        shipping_country: 'India',
        shipping_state: firstOrder.customerLocation.state,
        shipping_phone: firstOrder.customerPhoneNo,
        longitude: firstOrder.customerLocation.geolocation.lng,
        latitude: firstOrder.customerLocation.geolocation.lat,
        order_items: [],
        payment_method: 'Prepaid'
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
        console.log('dimenstion length', order.length);
        console.log('dimenstion height', order.height);
        console.log('dimenstion breadth', order.breadth);
        console.log('dimenstion weight', order.weight);
        orderPayload.order_items.push({
            name: order.itemName,
            sku: order.itemId,
            units: order.count,
            selling_price: selling_price
        });
        orderCount++;
    });
    orderPayload.sub_total = sub_total;
    // const finalBoxSize = getMinBoxWithRotation(itemsDimenstion);
    console.log('finalBoxSize', finalBoxSize);
    orderPayload.length = orderCount > 1 ? finalBoxSize.length : length;
    orderPayload.height = orderCount > 1 ? finalBoxSize.height : height;
    orderPayload.breadth = orderCount > 1 ? finalBoxSize.breadth : breadth;
    orderPayload.weight = weight;

    return orderPayload;
};

const getToken = () => {
    return new Promise(async (resolve, reject) => {
        try {
            if (global.shipRocketToken) {
                resolve(global.shipRocketToken);
            } else {
                const urlParams = '/auth/login';
                const header = { 'Content-Type': 'application/json' };
                const payload = {
                    email: "pratap@mealawe.com",
                    password: "C9k312Q4kQ^hwQNa"
                };
                const tokenObj = await shipRocketApisHttpCall(urlParams, 'POST', payload, header);
                global.shipRocketToken = tokenObj.token;
                console.log('shipRocket token recieved ===> ', tokenObj.token);
                resolve(tokenObj.token);
            }
        } catch (error) {
            console.log('Error while calling token ', error);
            global.shipRocketToken = undefined;
            reject(error);
        }
    });
}

const createShipRocketDeliveryTask = async (taskObj) => {
    return new Promise(async (resolve, reject) => {
        try {
            const deliveryOrder = await dao.getDeliveryOrder(taskObj.reference_id);
            if (deliveryOrder && deliveryOrder._id) {
                console.log('sending delivery order from DB', deliveryOrder);
                resolve(deliveryOrder);
            } else {
                taskObj.request_id = 'REF_ID_' + Math.ceil(Math.random() * 100000000);
                const token = await getToken();
                const payload = createtaskObj(taskObj.orderlist, taskObj.request_id, taskObj.finalBox);
                const urlParams = '/orders/create/adhoc';
                const header = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                shipRocketApisHttpCall(urlParams, 'POST', payload, header)
                    .then(async (res) => {
                        console.log('createShipRocketDeliveryTask', res);
                        if (res.shipment_id) {
                            const deliveryOrderObj = {
                                reference_id: taskObj.reference_id,
                                request_id: taskObj.request_id,
                                deliveryTaskId: res.order_id,
                                orderNoList: taskObj.orderNoList,
                                deliveryTaskState: res.status,
                                deliveryVendor: 'shiprocket',
                                serverNameOrderType: 'ML'
                            };
                            await dao.saveDeliveryOrder(deliveryOrderObj);
                            const ordersProps = {
                                deliveryVendor: 'shiprocket',
                                deliveryTaskId: res.order_id,
                                shipmentId: res.shipment_id,
                            }
                            await updateMarketPlaceItemOrdersProps(taskObj.orderNoList, ordersProps);
                            resolve(deliveryOrderObj);
                        } else {
                            const msg = res && res.message ? res.message : 'Error while calling shiprocketTask';
                            reject({ status: 'invalid', msg });
                        }

                    }, async (error) => {
                        console.log('Error while calling createShipRocketDeliveryTask ', error);
                        global.shipRocketToken = undefined;
                        const msg = error && error.message ? error.message : 'Error while calling shiprocketTask';
                        reject({ status: 'invalid', msg });
                    });
            }
        } catch (error) {
            console.log('Error while calling createTask ', error);
            reject(error);
        }
    });
}

const generateShipRocketAWB = (shipment_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const payload = { shipment_id: shipment_id }
            const urlParams = `/courier/assign/awb`;
            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const awbResponse = await shipRocketApisHttpCall(urlParams, 'POST', payload, header);
            console.log('generateShipRocketAWB', awbResponse);
            resolve({ status: true });
        } catch (error) {
            global.shipRocketToken = undefined;
            console.log('Error while generateShipRocketAWB ', error);
            reject(error);
        }
    });
}

const requestShipRocketPickUp = (shipment_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const payload = { shipment_id: [shipment_id] }
            const urlParams = `/courier/generate/pickup`;
            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const pickUPResponse = await shipRocketApisHttpCall(urlParams, 'POST', payload, header);
            console.log('requestShipRocketPickUp', pickUPResponse);
            resolve({ status: true });
        } catch (error) {
            global.shipRocketToken = undefined;
            console.log('Error while requestShipRocketPickUp ', error);
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
const trackShipRocketDeliveryTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const urlParams = `/orders/show/${order_id}`;
            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const apiResponse = await shipRocketApisHttpCall(urlParams, 'GET', null, header);
            const responseObj = apiResponse.data;
            let deliveryTaskState;
            let shipments;
            if (responseObj && responseObj.status) {
                if (responseObj.status === 'CANCELED') {
                    deliveryTaskState = 'cancelled'
                } else {
                    deliveryTaskState = responseObj.status
                }
                updateDeliveryOrderStatus(order_id, deliveryTaskState);
                shipments = responseObj.shipments;
            }
            updateMarketPlaceItemOrdersStatus(order_id, deliveryTaskState);
            // console.log('trackShipRocketDeliveryTask',deliveryTaskState,responseObj);
            resolve({ deliveryTaskState, shipments });
        } catch (error) {
            console.log('Error while trackShipRocketDeliveryTask ', error);
            global.shipRocketToken = undefined;
            reject(error);
        }
    });
}


const cancelShipRocketDeliveryTask = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const payload = { ids: [order_id] }
            const urlParams = `/orders/cancel`;
            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            await shipRocketApisHttpCall(urlParams, 'POST', payload, header);
            updateDeliveryOrderStatus(order_id, 'cancelled');
            resolve({ status: 'cancelled' });
        } catch (error) {
            global.shipRocketToken = undefined;
            console.log('Error while cancelPorterTask ', error);
            reject(error);
        }
    });
}

const shipRocketcallback = async (callbackPayload) => {
    try {
        console.log('shipRocketcallback ==> ', callbackPayload);
        if (callbackPayload && callbackPayload.order_id) {
            const deliveryTaskId = callbackPayload.order_id;
            console.log('shipRocketcallback10 ', deliveryTaskId);
            const trackPayload = await trackShipRocketDeliveryTask(deliveryTaskId);
            const payload = await dao.getDeliveryOrderByTaskId(deliveryTaskId);
            console.log('shipRocketcallback11 ', trackPayload);
            console.log('shipRocketcallback12 ', payload);
            if (payload && trackPayload) {
                const deliveryTaskState = trackPayload.status;
                const orderRef = payload.reference_id;
                let orderNos = [];
                if (orderRef) {
                    let orders = orderRef.split('_');
                    orders.splice(0, 1);
                    orders = orders.map(orderNo => parseInt(orderNo));
                    orderNos = orders.join(', ');
                    console.log('shipRocketcallback2 ==> ', deliveryTaskState, orderRef, orders, orderNos);
                    const marketPlaceItemOrderList = await getMarketPlaceItemOrderListByOrderNo(orders);
                    console.log('shipRocketcallback22 ==> order found');
                    marketPlaceItemOrderList.forEach(marketPlaceItemOrder => {
                        if (deliveryTaskState === 'In Transit') {
                            updateOrderStatus([marketPlaceItemOrder.orderNo], 'inTransit');
                            console.log('shipRocketcallback23 ==> ', marketPlaceItemOrder.orderNo);
                        }
                        if (deliveryTaskState === 'Out For Delivery') {
                            updateOrderStatus([marketPlaceItemOrder.orderNo], 'outForDelivery');
                            console.log('shipRocketcallback3 ==> ', marketPlaceItemOrder.orderNo);
                        }
                        if (deliveryTaskState === 'Delivered') {
                            updateOrderStatus([marketPlaceItemOrder.orderNo], 'delivered');
                            console.log('shipRocketcallback4 ==> ', marketPlaceItemOrder.orderNo);
                        }
                    });
                }
            }

        }

    } catch (e) {
        console.log('error on shipRocketcallback service layer ', e);
    }
}

const generateShipRocketMenifest = (shipment_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const payload = { shipment_id: [shipment_id] }
            const urlParams = `/manifests/generate`;
            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const response = await shipRocketApisHttpCall(urlParams, 'POST', payload, header);
            console.log('generateShipRocketMenifest', response);
            if (response && response.manifest_url) {
                resolve({ manifest_url: response.manifest_url });
            } else {
                reject({ error: { msg: 'generateShipRocketMenifest error' } });
            }

        } catch (error) {
            global.shipRocketToken = undefined;
            console.log('Error while generateShipRocketMenifest ', error);
            reject(error);
        }
    });
}

const generateShipRocketLabel = (shipment_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const payload = { shipment_id: [shipment_id] }
            const urlParams = `/courier/generate/label`;
            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const response = await shipRocketApisHttpCall(urlParams, 'POST', payload, header);
            console.log('generateShipRocketLabel', response);
            if (response && response.label_url) {
                resolve({ label_url: response.label_url });
            } else {
                reject({ error: { msg: 'generateShipRocketLabel error' } });
            }

        } catch (error) {
            global.shipRocketToken = undefined;
            console.log('Error while generateShipRocketLabel ', error);
            reject(error);
        }
    });
}

const generateShipRocketInvoice = (order_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getToken();
            const payload = { ids: [order_id] }
            const urlParams = `/orders/print/invoice`;
            const header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const response = await shipRocketApisHttpCall(urlParams, 'POST', payload, header);
            console.log('generateShipRocketInvoice', response);
            if (response && response.invoice_url) {
                resolve({ invoice_url: response.invoice_url });
            } else {
                reject({ error: { msg: 'generateShipRocketInvoice error' } });
            }

        } catch (error) {
            global.shipRocketToken = undefined;
            console.log('Error while generateShipRocketInvoice ', error);
            reject(error);
        }
    });
}

const updateMarketPlaceItemOrdersStatus = async (deliveryTaskId, deliveryStatus) => {
    try {
        let status;
        if (deliveryStatus === 'IN TRANSIT' || deliveryStatus === 'IN TRANSIT-EN-ROUTE') {
            status = 'inTransit';
        }
        if (deliveryStatus === 'OUT FOR DELIVERY') {
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
    createShipRocketDeliveryTask,
    trackShipRocketDeliveryTask,
    cancelShipRocketDeliveryTask,
    shipRocketcallback,
    generateShipRocketMenifest,
    generateShipRocketLabel,
    generateShipRocketInvoice,
    generateShipRocketAWB,
    requestShipRocketPickUp
}