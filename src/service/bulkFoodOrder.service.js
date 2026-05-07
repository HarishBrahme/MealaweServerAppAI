const dao = require('../dao/bulkFoodOrder.dao');
const counterDao = require('../dao/counters.dao');
const { sendFcmMessage, sendTransactionFcmMessage, sendGenericFcmMessage } = require('../util/fcm-message-handler');
const { deductMoneyPointsFromWallet, addMoneyPointsInWallet, updatedCashBack, createCashBack } = require('../util/user-wallet-util');
const { checkRefundEligibility, getkitchenCommisionPercentage } = require('../util/payment-validation-util');
const { depositeWalletBalance, getKitchenWallet } = require('../dao/kitchenWallet.dao');
const { saveKitchenTransactionHistory, updatedKitchenTransactionHistory } = require('./kitchenTransactionHistory.service');
const { checkUserFirstOrderReward } = require('../util/reward-points-util');
const { createKitchenLedger } = require('../util/kitchen-ledger-wallet-util');

const saveBulkFoodOrder = async (foodOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const foodOrderNo = await counterDao.getNextSequenceValue('Bulk_Food_Order_No');
            foodOrder.orderNo = parseInt(foodOrderNo);
            const newFoodOrder = await dao.saveBulkFoodOrder(foodOrder);
            resolve(newFoodOrder);
        }
        catch (e) {
            reject(e);
        }
    });
}

const getBulkFoodOrder = async (id) => {
    return dao.getBulkFoodOrder(id);
}

const updateBulkFoodOrder = async (foodOrder) => {
    // return dao.updateBulkFoodOrder(foodOrder);
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('updateBulkFoodOrder 1');
            const updatedFoodOrder = await dao.updateBulkFoodOrder(foodOrder);
            // console.log('updateBulkFoodOrder 1.1');
            try {
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'placed') {
                    checkUserFirstOrderReward(updatedFoodOrder);
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                    if (updatedFoodOrder.moneyWalletPointsUsed && updatedFoodOrder.moneyWalletPointsUsed > 0) {
                        deductMoneyPointsFromWallet(updatedFoodOrder.customerId, updatedFoodOrder.customerName, updatedFoodOrder.moneyWalletPointsUsed,
                            `Points redeemed on order no. ${updatedFoodOrder.orderNo}`);
                    }
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'accepted') {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'inprogress') {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'cancelled') {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'completed') {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                } else {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && (updatedFoodOrder.orderstatus === 'cancelled')) {
                    await autoRefundOnFoodOrder(updatedFoodOrder);
                }

            } catch (e) {
                // console.log('error while sending notification to kitchen partner ',e);
                reject(e);
            }
            resolve(updatedFoodOrder);
        }
        catch (e) {
            // console.log('error while updating food order ',e);
            reject(e);
        }
    });
}

const getPastBulkFoodOrders = async (id, page) => {
    return dao.getPastBulkFoodOrders(id, page);
}

const getCurrentBulkOrdersCount = async (clientDate) => {
    try {
        const result = await dao.getCurrentBulkOrdersCount(clientDate);
        return result;
    } catch (error) {
        // Handle errors, e.g., log or throw
        console.error('Error in getCurrentBulkOrdersCount:', error);
        throw error;
    }
};

const getClusterCurrentBulkOrdersCount = async (clusterList) => {
    try {
        const result = await dao.getCurrentBulkOrdersCount(clusterList);
        return result;
    } catch (error) {
        // Handle errors, e.g., log or throw
        console.error('Error in getClusterCurrentBulkOrdersCount:', error);
        throw error;
    }
};

const getBulkOrderList = async (status, page, limit, clusterList) => {
    return dao.getBulkOrderList(status, page, limit, clusterList);
}

const searchBulkOrderList = async (searchObj, page) => {
    return dao.searchBulkOrderList(searchObj, page);
}

const getPaymentBulkValidationOrder = async () => {
    return dao.getPaymentBulkValidationOrder();
}

const performBulkOrderTransfer = async (tranferredOrder) => {
    const order = await dao.performBulkOrderTransfer(tranferredOrder);
    if (order && order._id) {
        try {
            sendGenericFcmMessage(`Order no. ${order.orderNo} has been transferred to your kitchen`, order.kitchenId, 'KITCHEN');
        } catch (error) {
            // console.log('Error while sending generic message on order transfer')
        }
    }
    return order;
}

const getKitchenBulkDashboardCount = async (kitchenId, clientDate, orderType) => {
    return dao.getKitchenBulkDashboardCount(kitchenId, clientDate, orderType);
}

const getKitchenBulkOrderDetail = async (kitchenId, clientDate) => {
    return dao.getKitchenBulkOrderDetail(kitchenId, clientDate);
}

const checkBulkOrderValidForKitchen = async (id, currentStatus) => {
    return new Promise(async (resolve, reject) => {
        try {
            const statusObj = { valid: false, orderstatus: currentStatus };
            const foodOrder = await dao.getBulkFoodOrder(id);
            if (foodOrder && foodOrder._id) {
                if (foodOrder.orderstatus === currentStatus) {
                    statusObj.valid = true;
                    resolve(statusObj);
                } else {
                    statusObj.orderstatus = foodOrder.orderstatus;
                    resolve(statusObj);
                }
            } else {
                reject(e)
            }
        } catch (e) {
            reject(e)
        }
    });
}

const updatePackageImage = async (id, prop, filename) => {
    return dao.updatePackageImage(id, prop, filename);
}

const updateBulkManualDelivery = async (id) => {
    return dao.updateBulkManualDelivery(id);
}

const updateDeliveryOrder = async (deliveryTaskId, orderNoList, deliveryVendor, deliveryAmtPaidByMealawe, track_url) => {
    return dao.updateDeliveryOrder(deliveryTaskId, orderNoList, deliveryVendor, deliveryAmtPaidByMealawe, track_url);
}

const getCustomerVoucherOrderList = async (customerId, voucherCode, checkForToday) => {
    return dao.getCustomerVoucherOrderList(customerId, voucherCode, checkForToday);
}

const getVoucherUsedOrderList = async (voucherCode) => {
    return dao.getVoucherUsedOrderList(voucherCode);
}

const getCustomerCouponOrderList = async (customerId, couponCode, clientDate) => {
    return dao.getCustomerCouponOrderList(customerId, couponCode, clientDate);
}

const getFoodOrderListByOrderNo = async (orderNos) => {
    return dao.getFoodOrderListByOrderNo(orderNos);
}

const getFoodOrderByOrderNo = async (orderNo) => {
    return dao.getFoodOrderByOrderNo(orderNo);
}

const updateApartmentBulkOrderOtp = async (orderNo,otp) => {
    return dao.updateApartmentBulkOrderOtp(orderNo,otp);
}

const updateOrderStatus = async (ids, status, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderList = await dao.updateOrderStatus(ids, status, body);
            postOrderUpdate(ids);
            resolve(orderList);
        } catch (e) {
            reject(e);
        }
    });
}
const postOrderUpdate = async (ids) => {
    try {
        const orderlist = await dao.getFoodOrderList(ids);
        if (orderlist && orderlist.length > 0) {
            orderlist.forEach(order => {
                sendFcmMessage(order.orderstatus, order.orderNo, order.customerId, 'USER');
            })
        }
    } catch (error) {
        console.log('Error while post order update ', error);
    }
}

const payBulkFoodOrderAmtToKitchen = async (orderNos) => {
    try {
        // console.log('orderNos ',orderNos); 
        const orderlist = await dao.getFoodOrderListByOrderNo(orderNos);
        let totalAmtAfterCommisionPaidToKitchen = 0;
        let kitchenId;
        let kitchenName;
        let totalItemAmount = 0;
        let orderNoList = [];
        const ordersToUpdateWhilePayingKitchen = [];
        const ledgerObjList = [];
        const commissionPercentage = await getkitchenCommisionPercentage();
        if (orderlist && orderlist.length > 0) {
            orderlist.forEach(order => {
                if (!order.amtPaidToKitchen) {
                    let price = 0;
                    const kitchenDiscount = order.kitchenDiscount ? order.kitchenDiscount : 0;
                    if (order.orderTransferred) {
                        const transferExtraAmt = order.transferExtraAmt ? order.transferExtraAmt : 0;
                        const reduceExtraAmt = order.reduceExtraAmt ? order.reduceExtraAmt : 0;
                        price += (order.itemAmount + transferExtraAmt - reduceExtraAmt);
                    } else {
                        price += (order.itemAmount - kitchenDiscount);
                    }
                    kitchenId = order.kitchenId;
                    kitchenName = order.kitchenName;
                    let orderCommission = 0;
                    if (!order.skipCommission) {
                        orderCommission = (price * commissionPercentage) / 100;
                    }
                    const amtAfterCommisionPaidToKitchen = parseInt(price - orderCommission);
                    totalAmtAfterCommisionPaidToKitchen += amtAfterCommisionPaidToKitchen
                    ordersToUpdateWhilePayingKitchen.push({
                        id: order._id,
                        amtPaidToKitchen: true,
                        amtAfterCommisionPaidToKitchen,
                        orderCommission,
                    });
                    orderNoList.push(order.orderNo);
                    let commissionPercentageLedger = 0;
                    if (order.orderType !== 'subscription') {
                        commissionPercentageLedger = commissionPercentage;
                    }
                    const ledgerObj = {
                        remark: `New Ledger Created for order no. ${order.orderNo}`,
                        totalItemAmount: order.amount,
                        kitchenCommissionPercentage: commissionPercentageLedger,
                        kitchenCommissionAmount: orderCommission,
                        kitchenLedgerAmt: amtAfterCommisionPaidToKitchen,
                        orderNo: order.orderNo,
                        kitchenName: order.kitchenName,
                        kitchenPhoneNo: order.kitchenPhoneNo,
                        kitchenEmail: order.kitchenEmail,
                        kitchenId: order.kitchenId,
                        orderType: order.orderType,
                    };
                    ledgerObjList.push(ledgerObj);
                }
            });
        }

        if (kitchenId && orderNoList.length > 0) {
            await dao.updateOrderWhilePayingKitchen(ordersToUpdateWhilePayingKitchen);
            ledgerObjList.forEach(async (ledgerObj) => {
                await createKitchenLedger(ledgerObj);
            });
            sendTransactionFcmMessage('kitchen_credit', totalAmtAfterCommisionPaidToKitchen, kitchenId, 'KITCHEN');
            //send fcm to kitchen
        }
    } catch (error) {
        // console.log('Error while post order update ',error);
    }
}

const updateBulkFoodOrderProps = async (orderNoList, updateCondtion) => {
    return dao.updateBulkFoodOrderProps(orderNoList, updateCondtion);
}
const autoRefundOnFoodOrder = async (foodOrder) => {
    try {
        let totalRefundAmt = foodOrder.amount;
        if (foodOrder.moneyWalletPointsUsed) {
            totalRefundAmt += foodOrder.moneyWalletPointsUsed;
        }
        if (foodOrder.mealaweWalletPointsUsed) {
            totalRefundAmt += foodOrder.mealaweWalletPointsUsed;
        }
        foodOrder.refund_id = Math.ceil(Math.random() * 100000);
        foodOrder.refund_status = 'completed';
        let refund_amount = totalRefundAmt;
        let cancelComment = '';
        if (foodOrder.orderstatus === 'cancelled') {
            cancelComment = 'order cancelled';
        }
        foodOrder.cancel_comment = cancelComment;
        foodOrder.refund_amount = refund_amount;
        await dao.updateBulkFoodOrder(foodOrder);
        sendFcmMessage(foodOrder.orderstatus, foodOrder.orderNo, foodOrder.customerId, 'USER');
        // need to change here    
        refund_amount = refund_amount
        if (refund_amount > 0) {
            addMoneyPointsInWallet(foodOrder.customerId, foodOrder.customerName, refund_amount,
                `Points added on refund of order no. ${foodOrder.orderNo}`);
        }
    }
    catch (e) {
        console.log('autoRefundOnFoodOrder error => ', e)
    }
}

const getCustomerBulkOrderList = async (customerId, page) => {
    return dao.getCustomerBulkOrderList(customerId, page);
}

const exportBulkOrderList = async (searchObj) => {
    return dao.exportBulkOrderList(searchObj);
}

const getApartmentPastBulkFoodOrders = async (id, page) => {
    return dao.getApartmentPastBulkFoodOrders(id, page);
}
const getBulkFoodOrdersByCustomerEmailThinkowl = async (email) => {
    return dao.getBulkFoodOrdersByCustomerEmailThinkowl(email);
}

const getApartmentBulkOrderListByDateRange = async (fromDate, toDate, apartmentIds, page, limit) => {
    try {
        // Validate apartmentIds before passing to DAO
        const validatedApartmentIds = apartmentIds && apartmentIds.length > 0 
            ? apartmentIds.filter(id => id && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id))
            : [];

        return await dao.getApartmentBulkOrderListByDateRange(
            fromDate, 
            toDate, 
            validatedApartmentIds, 
            page, 
            limit
        );
    } catch (error) {
        console.error('Error in apartmentOrderService:', error);
        throw error;
    }
}

module.exports = {
    saveBulkFoodOrder,
    updateDeliveryOrder,
    updatePackageImage,
    checkBulkOrderValidForKitchen,
    performBulkOrderTransfer,
    getBulkFoodOrder,
    updateBulkFoodOrder,
    getPastBulkFoodOrders,
    getKitchenBulkOrderDetail,
    getCurrentBulkOrdersCount,
    getClusterCurrentBulkOrdersCount,
    updateBulkManualDelivery,
    getBulkOrderList,
    searchBulkOrderList,
    getKitchenBulkDashboardCount,
    getPaymentBulkValidationOrder,
    getCustomerVoucherOrderList,
    getVoucherUsedOrderList,
    getCustomerCouponOrderList,
    getFoodOrderListByOrderNo,
    getFoodOrderByOrderNo,
    payBulkFoodOrderAmtToKitchen,
    updateBulkFoodOrderProps,
    getCustomerBulkOrderList,
    exportBulkOrderList,
    getApartmentPastBulkFoodOrders,
    updateApartmentBulkOrderOtp,
    updateOrderStatus,
    getApartmentBulkOrderListByDateRange,
    getBulkFoodOrdersByCustomerEmailThinkowl
}