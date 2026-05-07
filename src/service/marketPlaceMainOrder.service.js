const dao = require('../dao/marketPlaceMainOrder.dao');
const counterDao = require('../dao/counters.dao');
const { getMarketPlaceItemOrderNo, saveMultipleMarketPlaceItemOrders, updateAllItemOrdersStatus, updateAllItemOrdersInfo } = require('./marketPlaceItemOrder.service');
const { sendFcmMessage } = require('../util/fcm-message-handler');
const { deductMoneyPointsFromWallet, addMoneyPointsInWallet, createCashBack } = require('../util/user-wallet-util');
const { navmoolOrderPlacedSMS, navmoolRefundInitiatedSMS, navmoolOrderAcceptedSMS } = require('../util/sms-provider-util');

const getMarketPlaceMainOrderList = async () => {
    return dao.getMarketPlaceMainOrderList();
};
const getMarketPlaceMainOrderById = async (id) => {
    return dao.getMarketPlaceMainOrderById(id);
};

const getMarketPlaceMainOrderByOrderNo = async (orderNo) => {
    return dao.getMarketPlaceMainOrderByOrderNo(orderNo);
};

const updateMarketPlaceMainOrder = async (marketPlaceMainOrder) => {

    return new Promise(async (resolve, reject) => {
        try {
            const updatedMarketPlaceMainOrder = await dao.updateMarketPlaceMainOrder(marketPlaceMainOrder);;
            try {
                if (updatedMarketPlaceMainOrder) {
                    const { orderCreatedBy } = updatedMarketPlaceMainOrder;
                    const isApp = orderCreatedBy === 'mealawe_app_ios' || orderCreatedBy === 'mealawe_app_android' || orderCreatedBy === 'mealawe_web';
                    const isWeb = orderCreatedBy === 'navmool_web' || orderCreatedBy === 'mealawe_web';
                    switch (updatedMarketPlaceMainOrder.orderstatus) {
                        case 'paymentInitiated':
                            // Handle payment initiated
                            if (isApp) {
                                navmoolRefundInitiatedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
                                sendFcmMessage(updatedMarketPlaceMainOrder.orderstatus, updatedMarketPlaceMainOrder.orderNo, updatedMarketPlaceMainOrder.customerId, 'USER');
                            }
                            if (isWeb) {
                                navmoolRefundInitiatedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
                            }
                            break;

                        case 'paymentInprogress':
                            // Handle payment in progress
                            break;

                        case 'paymentFailed':
                            // Handle payment failed
                            break;

                        case 'placed':
                            if (updatedMarketPlaceMainOrder.moneyWalletPointsUsed) {
                                deductMoneyPointsFromWallet(updatedMarketPlaceMainOrder.customerId, updatedMarketPlaceMainOrder.customerName, updatedMarketPlaceMainOrder.moneyWalletPointsUsed, `Points redeemed on navmool order no. ${updatedMarketPlaceMainOrder.orderNo}`);
                            }
                            if (isApp) {
                                navmoolOrderPlacedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
                                sendFcmMessage(updatedMarketPlaceMainOrder.orderstatus, updatedMarketPlaceMainOrder.orderNo, updatedMarketPlaceMainOrder.customerId, 'USER');
                            }
                            if (isWeb) {
                                navmoolOrderPlacedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
                            }
                            break;
                        case 'accepted':
                            if (isApp) {
                                navmoolOrderAcceptedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
                                sendFcmMessage(updatedMarketPlaceMainOrder.orderstatus, updatedMarketPlaceMainOrder.orderNo, updatedMarketPlaceMainOrder.customerId, 'USER');
                            }
                            if (isWeb) {
                                navmoolOrderAcceptedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
                            }
                            break;

                        case 'cancelledByUser':
                            // Handle order cancelled by user
                            break;

                        case 'cancelledBySeller':
                            // Handle order cancelled by seller
                            break;

                        case 'rejectedBySeller':
                            // Handle order rejected by seller
                            autoRefundOnmarketPlaceMainOrder(updatedMarketPlaceMainOrder);
                            break;

                        default:
                            // Handle unknown status
                            break;
                    }
                }
            } catch (e) {
                reject(e);
            }
            resolve(updatedMarketPlaceMainOrder);
        }
        catch (e) {
            reject(e);
        }
    });
};

const saveMarketPlaceMainOrder = async (marketPlaceMainOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const marketPlaceMainOrderNo = await counterDao.getNextSequenceValue('MarketPlace_Main_Order_No');
            marketPlaceMainOrder.orderNo = 'MKTPL' + parseInt(marketPlaceMainOrderNo);
            const itemListWithOrderNo = await createMarketPlaceItemOrder(marketPlaceMainOrder.itemList, 0);
            marketPlaceMainOrder.itemList = [...itemListWithOrderNo];
            const newMarketPlaceMainOrder = await dao.saveMarketPlaceMainOrder(marketPlaceMainOrder);
            const marketPlaceItemOrderList = [];
            newMarketPlaceMainOrder.itemList.forEach(item => {
                marketPlaceItemOrderList.push({
                    orderNo: item.orderNo,
                    customerId: newMarketPlaceMainOrder.customerId,
                    customerName: newMarketPlaceMainOrder.customerName,
                    customerLocation: newMarketPlaceMainOrder.customerLocation,
                    customerPhoneNo: newMarketPlaceMainOrder.customerPhoneNo,
                    customerEmail: newMarketPlaceMainOrder.customerEmail,
                    orderstatus: newMarketPlaceMainOrder.orderstatus,
                    orderType: 'marketPlaceItem',
                    orderCreatedBy: newMarketPlaceMainOrder.orderCreatedBy,
                    orderDate: new Date(),
                    itemId: item.itemId,
                    itemName: item.itemName,
                    imageUrls: item.imageUrls,
                    count: item.count,
                    itemPrice: item.itemPrice,
                    itemDescription: item.itemDescription,
                    searchCategory: item.searchCategory,
                    groupCategory: item.groupCategory,
                    groupCategoryId: item.groupCategoryId,
                    itemServingText: item.itemServingText,
                    itemServingValue: item.itemServingValue,
                    itemServingUnit: item.itemServingUnit,
                    discount: item.discount,
                    length: item.length,
                    breadth: item.breadth,
                    height: item.height,
                    weight: item.weight,
                    statusHistory: [{
                        orderstatus: newMarketPlaceMainOrder.orderstatus,
                        updatedOn: new Date()
                    }],
                    mainOrderNo: newMarketPlaceMainOrder.orderNo,
                });
            });
            await saveMultipleMarketPlaceItemOrders(marketPlaceItemOrderList);
            resolve(newMarketPlaceMainOrder);
        }
        catch (e) {
            reject(e);
        }
    });
};

const createMarketPlaceItemOrder = async (orders, index) => {
    const orderList = [...orders];
    return new Promise(async (resolve, reject) => {
        try {
            console.log('createMarketPlaceItemOrder', index, orderList.length);
            if (index < orderList.length) {
                const orderNo = await getMarketPlaceItemOrderNo();
                orderList[index].orderNo = orderNo;
                console.log('createMarketPlaceItemOrder1', index, orderList[index].orderNo, orderNo);
                index++;
                const list = await createMarketPlaceItemOrder(orderList, index);
                resolve(list);
            } else {
                resolve(orderList);
            }
        } catch (e) {
            reject(e);
        }
    });
};

const updateMarketPlaceMainAndItemOrder = async (marketPlaceMainOrder) => {
    return await Promise.all([
        updateMarketPlaceMainOrder(marketPlaceMainOrder),
        updateAllItemOrdersStatus(marketPlaceMainOrder.orderNo, marketPlaceMainOrder.orderstatus, marketPlaceMainOrder)
    ]);
};

const getMarketPlaceMainOrdersCount = async () => {
    return dao.getMarketPlaceMainOrdersCount();
};

const getMarketPlaceMainOrdersList = async (status, page, limit) => {
    return dao.getMarketPlaceMainOrdersList(status, page, limit);
};

const updateMarketPlaceMainAndItemOrderInfo = async (orderNo, msg, condition) => {
    return await Promise.all([
        dao.updateMarketPlaceMainOrderInfo(orderNo, msg, condition),
        updateAllItemOrdersInfo(orderNo, msg, condition)
    ]);
};

const autoRefundOnmarketPlaceMainOrder = async (marketPlaceMainOrder) => {
    try {
        console.log('autoRefundOnmarketPlaceMainOrder1');
        const { orderCreatedBy } = marketPlaceMainOrder;
        const isApp = orderCreatedBy === 'mealawe_app_ios' || orderCreatedBy === 'mealawe_app_android' || orderCreatedBy === 'mealawe_web';
        const isWeb = orderCreatedBy === 'navmool_web' || orderCreatedBy === 'mealawe_web';
        marketPlaceMainOrder.refund_status = 'completed';
        let refund_amount = marketPlaceMainOrder.amount;
        let cancelComment = '';
        if (marketPlaceMainOrder.orderstatus === 'rejectedBySeller') {
            cancelComment = 'order cancelled by Seller';
        }
        marketPlaceMainOrder.cancel_comment = cancelComment;
        marketPlaceMainOrder.refund_amount = refund_amount;
        await dao.updateMarketPlaceMainOrder(marketPlaceMainOrder);
        if (isApp) {
            navmoolOrderAcceptedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
            sendFcmMessage(updatedMarketPlaceMainOrder.orderstatus, updatedMarketPlaceMainOrder.orderNo, updatedMarketPlaceMainOrder.customerId, 'USER');
        }
        if (isWeb) {
            navmoolRefundInitiatedSMS(updatedMarketPlaceMainOrder.customerPhoneNo, updatedMarketPlaceMainOrder.customerName);
        }
        let mealawePoinstUsed = 0;
        if (marketPlaceMainOrder.mealaweWalletPointsUsed) {
            mealawePoinstUsed = marketPlaceMainOrder.mealaweWalletPointsUsed;
            createCashBack(marketPlaceMainOrder.customerId, marketPlaceMainOrder.customerName, marketPlaceMainOrder.customerPhoneNo, marketPlaceMainOrder.customerEmail, mealawePoinstUsed, `Cashback on refund of Navmool order no. ${marketPlaceMainOrder.orderNo}`);
        }
        let moneyWalletPointsUsed = 0;
        if (marketPlaceMainOrder.moneyWalletPointsUsed) {
            moneyWalletPointsUsed = marketPlaceMainOrder.moneyWalletPointsUsed;
        }
        refund_amount = refund_amount + moneyWalletPointsUsed;
        if (refund_amount > 0) {
            addMoneyPointsInWallet(marketPlaceMainOrder.customerId, marketPlaceMainOrder.customerName, refund_amount, `Points added on refund of Navmool order no. ${marketPlaceMainOrder.orderNo}`);
        }
        console.log('autoRefundOnmarketPlaceMainOrder3');

    }
    catch (e) {
        console.log('autoRefundOnmarketPlaceMainOrder error => ', e)
    }
}

const searchMarketPlaceMainOrderList = async (searchObj, page) => {
    return dao.searchMarketPlaceMainOrderList(searchObj, page);
}

const getPaymentMarketPlaceMainValidationOrder = async () => {
    return dao.getPaymentMarketPlaceMainValidationOrder();
}
const getMarketPlaceMainOrdersByDateRange = async (fromDate, toDate) => {
    return dao.getMarketPlaceMainOrdersByDateRange(fromDate, toDate);
 };
 

module.exports = {
    getMarketPlaceMainOrderList,
    getMarketPlaceMainOrderById,
    getMarketPlaceMainOrderByOrderNo,
    saveMarketPlaceMainOrder,
    updateMarketPlaceMainAndItemOrder,
    getMarketPlaceMainOrdersCount,
    getMarketPlaceMainOrdersList,
    updateMarketPlaceMainAndItemOrderInfo,
    searchMarketPlaceMainOrderList,
    getPaymentMarketPlaceMainValidationOrder,
    getMarketPlaceMainOrdersByDateRange
}