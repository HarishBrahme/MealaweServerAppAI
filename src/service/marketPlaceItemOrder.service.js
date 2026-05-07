const dao = require('../dao/marketPlaceItemOrder.dao');
const counterDao = require('../dao/counters.dao');
const { getTodayStartTime } = require('../util/date-util');
const { sendFcmMessage } = require('../util/fcm-message-handler');
const { addMoneyPointsInWallet, createCashBack } = require('../util/user-wallet-util');
const { navmoolOrderDispatchedSMS, navmoolRefundInitiatedSMS, navmoolOrderDeliveredSMS } = require('../util/sms-provider-util');

const getMarketPlaceItemOrderNo = async () => {
    const orderNo = await counterDao.getNextSequenceValue('MarketPlace_Item_Order_No');
    return parseInt(orderNo);
};

const getMarketPlaceItemOrderList = async () => {
    return dao.getMarketPlaceItemOrderList();
};

const getMarketPlaceItemOrderById = async (id) => {
    return dao.getMarketPlaceItemOrderById(id);
};

const getMarketPlaceItemOrderByOrderNo = async (orderNo) => {
    return dao.getMarketPlaceItemOrderByOrderNo(orderNo);
};

const saveMarketPlaceItemOrder = async (marketPlaceItemOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            marketPlaceItemOrder.orderNo = await getMarketPlaceItemOrderNo();
            const newMarketPlaceItemOrder = await dao.saveMarketPlaceItemOrder(marketPlaceItemOrder);
            resolve(newMarketPlaceItemOrder);
        }
        catch (e) {
            reject(e);
        }
    });
};

const updateMarketPlaceItemOrder = async (marketPlaceItemOrder) => {
    const value = await dao.updateMarketPlaceItemOrder(marketPlaceItemOrder);
    const { orderCreatedBy } = marketPlaceItemOrder;
    const isApp = orderCreatedBy === 'mealawe_app_ios' || orderCreatedBy === 'mealawe_app_android';
    const isWeb = orderCreatedBy === 'navmool_web' || orderCreatedBy === 'mealawe_web';

    switch (marketPlaceItemOrder.orderstatus) {
        case 'paymentInprogress':
            break;
        case 'paymentFailed':
            break;

        case 'placed':
            break;

        case 'accepted':

            break;

        case 'packagingInProgess':
            break;
        case 'readyToDelivery':
            if (isWeb) {
                navmoolOrderDispatchedSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
            }
            if (isApp) {
                navmoolOrderDispatchedSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
                sendFcmMessage(marketPlaceItemOrder.orderstatus, marketPlaceItemOrder.orderNo, marketPlaceItemOrder.customerId, 'USER');
            }
            break;
        case 'inTransit':
            break;
        case 'outForDelivery':
            break;

        case 'delivered':
            if (isWeb) {
                navmoolOrderDeliveredSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
            }
            if (isApp) {
                navmoolOrderDeliveredSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
                sendFcmMessage(marketPlaceItemOrder.orderstatus, marketPlaceItemOrder.orderNo, marketPlaceItemOrder.customerId, 'USER');
            }
            break;
        case 'cancelledBySeller':
            break;
        case 'refundCompleted':
            break;
        case 'rejectedBySeller':
            autoRefundOnMarketPlaceItemOrder(marketPlaceItemOrder);
            break;
        default:
            break;
    }
    return value;
};

const updateOrderStatus = async (ids, status, body) => {
    const value = await dao.updateOrderStatus(ids, status, body);
    const marketPlaceItemOrder = await dao.getMarketPlaceItemOrderById(ids);
    const { orderCreatedBy } = marketPlaceItemOrder;
    const isApp = orderCreatedBy === 'mealawe_app_ios' || orderCreatedBy === 'mealawe_app_android';
    const isWeb = orderCreatedBy === 'navmool_web' || orderCreatedBy === 'mealawe_web';

    switch (status) {
        case 'paymentInprogress':
            break;

        case 'paymentFailed':
            break;

        case 'placed':
            break;

        case 'accepted':

            break;

        case 'packagingInProgess':
            break;
        case 'readyToDelivery':
            if (isWeb) {
                navmoolOrderDispatchedSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
            }
            if (isApp) {
                navmoolOrderDispatchedSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
                sendFcmMessage(marketPlaceItemOrder.orderstatus, marketPlaceItemOrder.orderNo, marketPlaceItemOrder.customerId, 'USER');
            }
            break;
        case 'inTransit':
            break;
        case 'outForDelivery':
            break;

        case 'delivered':
            if (isWeb) {
                navmoolOrderDeliveredSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
            }
            if (isApp) {
                navmoolOrderDeliveredSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
                sendFcmMessage(marketPlaceItemOrder.orderstatus, marketPlaceItemOrder.orderNo, marketPlaceItemOrder.customerId, 'USER');
            }
            break;
        case 'cancelledBySeller':
            break;
        case 'refundCompleted':
            break;
        case 'rejectedBySeller':
            autoRefundOnMarketPlaceItemOrder(marketPlaceItemOrder);
            break;
        default:
            break;
    }
    return value;
};

const getCustomerPastOrders = async (payload) => {
    return dao.getCustomerPastOrders(payload);
};

const saveMultipleMarketPlaceItemOrders = async (orderList) => {
    return dao.saveMultipleMarketPlaceItemOrders(orderList);
};

const updateAllItemOrdersStatus = async (mainOrderNo, status, body) => {
    return dao.updateAllItemOrdersStatus(mainOrderNo, status, body);
};

const getMarketPlaceItemOrdersCount = async () => {
    return dao.getMarketPlaceItemOrdersCount();
};
const getMarketPlaceItemOrdersCountByInventory = async (inventoryId) => {
    return dao.getMarketPlaceItemOrdersCountByInventory(inventoryId);
}

const getMarketPlaceItemOrdersList = async (status, page, limit) => {
    return dao.getMarketPlaceItemOrdersList(status, page, limit);
};
const getMarketPlaceItemOrdersListByInventoryId = async (status, page, limit, inventoryId) => {
    return dao.getMarketPlaceItemOrdersListByInventoryId(status, page, limit, inventoryId);
};
const getrecentOrders = async (userId) => {
    return dao.getrecentOrders(userId);
};
const getCustomerMarketPlaceItemOpenOrders = async (customerId, page) => {
    return dao.getCustomerMarketPlaceItemOpenOrders(customerId, page);
};


const updateMarketPlaceItemOrdersProps = async (orderNoList, updateCondtion) => {
    return dao.updateMarketPlaceItemOrdersProps(orderNoList, updateCondtion);
}

const updateAllItemOrdersInfo = async (mainOrderNo, msg, condition) => {
    return dao.updateAllItemOrdersInfo(mainOrderNo, msg, condition);
};


const getMarketPlaceItemOrderListByOrderNo = async (orderNos) => {
    return dao.getMarketPlaceItemOrderListByOrderNo(orderNos);
}

const getLastUnratedNavmoolDeliveredOrderList = async (customerId) => {
    let today = getTodayStartTime();
    today.setDate(today.getDate())
    let day3Before = new Date(today);
    day3Before.setDate(day3Before.getDate() - 5);
    return dao.getLastUnratedNavmoolDeliveredOrderList(customerId, day3Before, today)
}

const getCombineOrderForDelivery = async (status) => {
    const orderList = await dao.getAllStatusOrders(status);
    const groupList = {};
    orderList.forEach((order) => {
        if (order.deliveryTaskId) {
            const key = `${order.deliveryTaskId}`
            if (groupList[key]) {
                groupList[key].orders.push(order)
            } else {
                groupList[key] = {
                    orders: [order],
                    deliveryPartnerRequired: false,
                    deliveryTaskId: order.deliveryTaskId,
                    deliveryVendor: order.deliveryVendor,
                    shipmentId: order.shipmentId,
                    customerName: order.customerName,
                    customerPhoneNo: order.customerPhoneNo,
                    pincode: order.customerLocation.pincode
                }
            }
        } else {
            let standAloneDelivery = 'NO';
            if (order.standAloneShipment) {
                standAloneDelivery = order.orderNo;
            }
            const key = `${order.customerId}_${order.customerLocation.geolocation.lat}_${order.customerLocation.geolocation.lng}_${order.inventoryInfo.inventoryId}_${standAloneDelivery}`
            //console.log('key',key);
            if (groupList[key]) {
                groupList[key].orders.push(order)
            } else {
                groupList[key] = {
                    orders: [order],
                    deliveryPartnerRequired: true,
                    customerName: order.customerName,
                    customerPhoneNo: order.customerPhoneNo,
                    pincode: order.customerLocation.pincode
                }
            }
        }

    });
    return Object.values(groupList);
};

const getCombineOrderForDeliveryByInventoryId = async (status, id) => {
    const orderList = await dao.getAllStatusAndInventoryIdOrders(status, id);
    const groupList = {};
    orderList.forEach((order) => {
        if (order.deliveryTaskId) {
            const key = `${order.deliveryTaskId}`
            if (groupList[key]) {
                groupList[key].orders.push(order)
            } else {
                groupList[key] = {
                    orders: [order],
                    deliveryPartnerRequired: false,
                    deliveryTaskId: order.deliveryTaskId,
                    customerName: order.customerName,
                    customerPhoneNo: order.customerPhoneNo,
                    pincode: order.customerLocation.pincode
                }
            }
        } else {
            let standAloneDelivery = 'NO';
            if (order.standAloneShipment) {
                standAloneDelivery = order.orderNo;
            }
            const key = `${order.customerId}_${order.customerLocation.geolocation.lat}_${order.customerLocation.geolocation.lng}_${order.inventoryInfo.inventoryId}_${standAloneDelivery}`
            //console.log('key',key);
            if (groupList[key]) {
                groupList[key].orders.push(order)
            } else {
                groupList[key] = {
                    orders: [order],
                    deliveryPartnerRequired: true,
                    customerName: order.customerName,
                    customerPhoneNo: order.customerPhoneNo,
                    pincode: order.customerLocation.pincode
                }
            }
        }

    });
    return Object.values(groupList);
};

const updateStandAloneShipment = async (payload) => {
    return dao.updateStandAloneShipment(payload);
}

const updateNavmoolFeedbackstatus = async (id) => {
    return dao.updateNavmoolFeedbackstatus(id);
}

const cancelMarketPlaceItemOrder = async (marketPlaceItemOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('updateOrderPackage 1');
            const updatedMarketPlaceItemOrder = await dao.updateMarketPlaceItemOrder(marketPlaceItemOrder);;
            console.log('updateOrderPackage 1.1');
            try {
                if (updatedMarketPlaceItemOrder && updatedMarketPlaceItemOrder.orderstatus === 'cancelledBySeller') {
                    autoRefundOnMarketPlaceItemOrder(updatedMarketPlaceItemOrder);
                }
            } catch (e) {
                // console.log('error while sending notification to kitchen partner ',e);
                reject(e);
            }
            resolve(updatedMarketPlaceItemOrder);
        }
        catch (e) {
            // console.log('error while updating food order ',e);
            reject(e);
        }
    });
}

const autoRefundOnMarketPlaceItemOrder = async (marketPlaceItemOrder) => {
    try {
        console.log('autoRefundOnMarketPlaceItemOrder1');
        const { orderCreatedBy } = marketPlaceItemOrder;
        const isApp = orderCreatedBy === 'mealawe_app_ios' || orderCreatedBy === 'mealawe_app_android' || orderCreatedBy === 'mealawe_web';
        const isWeb = orderCreatedBy === 'navmool_web' || orderCreatedBy === 'mealawe_web';
        marketPlaceItemOrder.refund_status = 'completed';
        let refund_amount = (marketPlaceItemOrder.itemPrice - marketPlaceItemOrder.discount) * marketPlaceItemOrder.count;
        let cancelComment = '';
        if (marketPlaceItemOrder.orderstatus === 'cancelledBySeller') {
            cancelComment = 'order cancelled by Seller';
        }
        marketPlaceItemOrder.cancel_comment = cancelComment;
        marketPlaceItemOrder.refund_amount = refund_amount;
        await dao.updateMarketPlaceItemOrder(marketPlaceItemOrder);
        if (isApp) {
            sendFcmMessage(marketPlaceItemOrder.orderstatus, marketPlaceItemOrder.orderNo, marketPlaceItemOrder.customerId, 'USER');
            navmoolRefundInitiatedSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
        }
        if (isWeb) {
            navmoolRefundInitiatedSMS(marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerName);
        }
        // need to change here    
        let mealawePoinstUsed = 0;
        if (marketPlaceItemOrder.mealaweWalletPointsUsed) {
            mealawePoinstUsed = marketPlaceItemOrder.mealaweWalletPointsUsed;
            createCashBack(marketPlaceItemOrder.customerId, marketPlaceItemOrder.customerName, marketPlaceItemOrder.customerPhoneNo, marketPlaceItemOrder.customerEmail,
                mealawePoinstUsed, `Cashback on refund of Navmool order no. ${marketPlaceItemOrder.orderNo}`);
        }
        let moneyWalletPointsUsed = 0;
        if (marketPlaceItemOrder.moneyWalletPointsUsed) {
            moneyWalletPointsUsed = marketPlaceItemOrder.moneyWalletPointsUsed;
        }
        refund_amount = refund_amount + moneyWalletPointsUsed;
        if (refund_amount > 0) {
            addMoneyPointsInWallet(marketPlaceItemOrder.customerId, marketPlaceItemOrder.customerName, refund_amount,
                `Points added on refund of Navmool order no. ${marketPlaceItemOrder.orderNo}`);
            console.log('autoRefundOnMarketPlaceItemOrder2', refund_amount);
        }
        console.log('autoRefundOnMarketPlaceItemOrder3');

    }
    catch (e) {
        console.log('autoRefundOnMarketPlaceItemOrder error => ', e)
    }
}

const searchMarketPlaceItemOrderList = async (searchObj, page) => {
    return dao.searchMarketPlaceItemOrderList(searchObj, page);
}

const getMarketPlaceItemOrdersByDeliveryTaskId = async (deliveryTaskId) => {
    return dao.getMarketPlaceItemOrdersByDeliveryTaskId(deliveryTaskId);
}

module.exports = {
    getMarketPlaceItemOrderNo,
    getMarketPlaceItemOrderList,
    getMarketPlaceItemOrderById,
    getMarketPlaceItemOrderByOrderNo,
    saveMarketPlaceItemOrder,
    updateMarketPlaceItemOrder,
    updateOrderStatus,
    getCustomerPastOrders,
    saveMultipleMarketPlaceItemOrders,
    updateAllItemOrdersStatus,
    getMarketPlaceItemOrdersCount,
    getMarketPlaceItemOrdersList,
    getrecentOrders,
    updateMarketPlaceItemOrdersProps,
    updateAllItemOrdersInfo,
    getMarketPlaceItemOrderListByOrderNo,
    getCombineOrderForDelivery,
    getCustomerMarketPlaceItemOpenOrders,
    updateStandAloneShipment,
    getLastUnratedNavmoolDeliveredOrderList,
    updateNavmoolFeedbackstatus,
    cancelMarketPlaceItemOrder,
    searchMarketPlaceItemOrderList,
    getMarketPlaceItemOrdersCountByInventory,
    getCombineOrderForDeliveryByInventoryId,
    getMarketPlaceItemOrdersListByInventoryId,
    getMarketPlaceItemOrdersByDeliveryTaskId
}