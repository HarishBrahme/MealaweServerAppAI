const dao = require('../dao/foodOrderSubscription.dao');
const { saveMultipleOrders, updateFoodOrderDate, getAllSubscriptionFoodOrders } = require('../dao/foodorder.dao')
const counterDao = require('../dao/counters.dao');
const { sendFcmMessage, sendTransactionFcmMessage, sendGenericFcmMessage } = require('../util/fcm-message-handler');
const { depositeWalletBalance, getKitchenWallet } = require('../dao/kitchenWallet.dao');
const { deductMoneyPointsFromWallet, addMoneyPointsInWallet, updatedCashBack,
    createCashBack } = require('../util/user-wallet-util');
const { checkUserFirstOrderReward } = require('../util/reward-points-util');
// const { sendToWebSocket } = require('../util/websocket-handler');
const saveOrderSubscription = async (foodOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const foodOrderNo = await counterDao.getNextSequenceValue('Food_Order_SUB_No');
            foodOrder.orderNo = 'SUB' + parseInt(foodOrderNo);
            const newFoodOrder = await dao.saveOrderSubscription(foodOrder);
            resolve(newFoodOrder);
        }
        catch (e) {
            reject(e);
        }
    });
}

const updateOrderSubscription = async (foodOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('updateOrderSubscription 1');
            const updatedFoodOrder = await dao.updateOrderSubscription(foodOrder);
            // console.log('updateOrderSubscription 1.1');
            try {
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'placed') {
                    // console.log('updateOrderSubscription placed 2');
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.kitchenId, 'KITCHEN');
                    // callKitchen(updatedFoodOrder._id);
                    // sendToWebSocket('NEW_ORDER',{orderNo:updatedFoodOrder.orderNo});                     
                    if (updatedFoodOrder.moneyWalletPointsUsed) {
                        deductMoneyPointsFromWallet(updatedFoodOrder.customerId, updatedFoodOrder.customerName, updatedFoodOrder.moneyWalletPointsUsed,
                            `Points redeemed on subscription order no. ${updatedFoodOrder.orderNo}`);
                    }
                    if (updatedFoodOrder.mealaweWalletPointsUsed) {
                        // deductMealawePointsFromWallet(updatedFoodOrder.customerId,updatedFoodOrder.customerName,updatedFoodOrder.mealaweWalletPointsUsed,
                        //     `Mealawe points redeemed on subscription order no. ${updatedFoodOrder.orderNo}`);
                        updatedCashBack(updatedFoodOrder.customerId, updatedFoodOrder.orderNo, updatedFoodOrder.mealaweWalletPointsUsed);
                    }
                    checkUserFirstOrderReward(updatedFoodOrder);
                    // console.log('updateOrderSubscription placed 3');                  
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'accepted') {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'refundCompleted') {
                    sendGenericFcmMessage(`Amount Rs.${updatedFoodOrder.refund_amount} of order no. ${updatedFoodOrder.orderNo} has been refunded to your bank account`,
                        updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'cancelledByUser') {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.kitchenId, 'KITCHEN');
                }
                if (updatedFoodOrder && (updatedFoodOrder.orderstatus === 'cancelledByKitchen'
                    || updatedFoodOrder.orderstatus === 'rejectedByKitchen')) {
                    // console.log('updateOrderSubscription cancelled 3')
                    autoRefundOnSubscription(updatedFoodOrder);
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

const autoRefundOnSubscription = async (foodOrder, autoCancel) => {
    try {
        // console.log('autoRefundOnSubscription 1')
        const cancelEligibleObj = await checkRefundEligibility(foodOrder._id, autoCancel, true);
        if (cancelEligibleObj.cancelEligible) {
            foodOrder.refund_id = Math.ceil(Math.random() * 100000);
            foodOrder.refund_status = 'completed';
            let refund_amount = cancelEligibleObj.refund_amount;
            let cancelComment = '';
            if (foodOrder.orderstatus === 'cancelledByKitchen') {
                cancelComment = 'order cancelled by kitchen';
            } else if (foodOrder.orderstatus === 'rejectedByKitchen') {
                cancelComment = 'order rejected by kitchen';
            }
            if (autoCancel) {
                foodOrder.orderstatus = 'autoCancelled';
                cancelComment = `Order has been auto cancelled, as kitchen has not accepted within mealawe's standard timeframe`;
            }
            foodOrder.cancel_comment = cancelComment;
            foodOrder.refund_amount = refund_amount;
            await dao.updateSubscription(foodOrder);
            // console.log('autoRefundOnSubscription 2')   
            sendFcmMessage(foodOrder.orderstatus, foodOrder.orderNo, foodOrder.customerId, 'USER');
            // need to change here    
            let mealawePoinstUsed = 0;
            if (foodOrder.mealaweWalletPointsUsed) {
                mealawePoinstUsed = foodOrder.mealaweWalletPointsUsed;
                // addMealawePointsInWallet(foodOrder.customerId,foodOrder.customerName,mealawePoinstUsed,
                //     `Mealawe points added on refund of order no. ${foodOrder.orderNo}`);
                createCashBack(foodOrder.customerId, foodOrder.customerName, foodOrder.customerPhoneNo, foodOrder.customerEmail,
                    mealawePoinstUsed, `Cashback on refund of order no. ${foodOrder.orderNo}`);
                // console.log('autoRefundOnSubscription mealawe points added',foodOrder.orderNo);
            }
            refund_amount = refund_amount - mealawePoinstUsed;
            addMoneyPointsInWallet(foodOrder.customerId, foodOrder.customerName, refund_amount,
                `Points added on refund of order no. ${foodOrder.orderNo}`);
            // console.log('autoRefundOnSubscription completed ',foodOrder.orderNo);
        }
    }
    catch (e) {
        // console.log('autoRefundOnSubscription error => ',e)
    }
}

const getOrderSubscription = async (id) => {
    return dao.getOrderSubscription(id);
}
const getCustomerSubscriptionList = async (customerId, page) => {
    return dao.getCustomerSubscriptionList(customerId, page);
}
const getKitchenSubDashboardCount = async (kitchenId, clientDate, onlyCount) => {
    return dao.getKitchenSubDashboardCount(kitchenId, clientDate, onlyCount);
}

const checkSubOrderValidForKitchen = async (id, currentStatus) => {
    return new Promise(async (resolve, reject) => {
        try {
            const statusObj = { valid: false, orderstatus: currentStatus };
            const foodOrder = await dao.getOrderSubscription(id);
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

const acceptSubscriptionOrder = async (subscriptionOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderList = [];
            const existingIdsListObj = {};
            const existingFoodOrderList = await getAllSubscriptionFoodOrders(subscriptionOrder._id);
            if (existingFoodOrderList && existingFoodOrderList.length > 0) {
                existingFoodOrderList.forEach(existingOrder => {
                    existingIdsListObj[existingOrder.subscriptionChildId] = {
                        orderId: existingOrder._id,
                        orderNo: existingOrder.orderNo
                    };
                });
            }
            subscriptionOrder.dailyOrderList.forEach(order => {
                if (!existingIdsListObj[order._id]) {
                    const foodOrder = {};
                    foodOrder.subOrderId = order._id;
                    foodOrder.orderDate = order.orderDate;
                    foodOrder.itemAmount = order.itemAmount;
                    foodOrder.amount = order.amount;
                    foodOrder.deliveryCharges = order.deliveryCharges;
                    foodOrder.taxes = order.taxes;
                    foodOrder.discount = order.discount;
                    foodOrder.kitchenDiscount = order.kitchenDiscount;
                    foodOrder.moneyWalletPointsUsed = order.moneyWalletPointsUsed;
                    foodOrder.mealaweWalletPointsUsed = order.mealaweWalletPointsUsed;
                    foodOrder.specialRequest = order.specialRequest;
                    foodOrder.nonContactDelivery = order.nonContactDelivery;
                    foodOrder.mealType = order.mealTime;
                    foodOrder.subscriptionSlot = order.subscriptionSlot;
                    foodOrder.customerId = subscriptionOrder.customerId;
                    foodOrder.customerName = subscriptionOrder.customerName;
                    foodOrder.customerLocation = subscriptionOrder.customerLocation;
                    foodOrder.customerName = subscriptionOrder.customerName;
                    foodOrder.customerLocation = subscriptionOrder.customerLocation;
                    foodOrder.customerEmail = subscriptionOrder.customerEmail;
                    foodOrder.customerPhoneNo = subscriptionOrder.customerPhoneNo;
                    foodOrder.kitchenId = subscriptionOrder.kitchenId;
                    foodOrder.firstKitchenName = subscriptionOrder.kitchenName;
                    foodOrder.kitchenName = subscriptionOrder.kitchenName;
                    foodOrder.kitchenPhoneNo = subscriptionOrder.kitchenPhoneNo;
                    foodOrder.kitchenAddress = subscriptionOrder.kitchenAddress;
                    foodOrder.kitchenGeolocation = subscriptionOrder.kitchenGeolocation;
                    foodOrder.orderCreatedBy = subscriptionOrder.orderCreatedBy;
                    foodOrder.deliveryVendor = subscriptionOrder.deliveryVendor;
                    foodOrder.orderType = 'subscription';
                    foodOrder.orderstatus = 'accepted';
                    foodOrder.itemList = subscriptionOrder.itemList;
                    foodOrder.addOns = subscriptionOrder.addOns;
                    foodOrder.subscriptionMasterId = subscriptionOrder._id;
                    foodOrder.subscriptionMasterOrderId = subscriptionOrder.orderNo;
                    foodOrder.subscriptionChildId = order._id;
                    foodOrder.couponCode = subscriptionOrder.couponCode;
                    foodOrder.distance = subscriptionOrder.distance;
                    foodOrder.mealaweDeliveryDiscount = order.mealaweDeliveryDiscount;
                    foodOrder.mealaweItemDiscount = order.mealaweItemDiscount;
                    foodOrder.mealaweTotalAmt = order.mealaweTotalAmt;
                    foodOrder.mealaweKitchenDiscount = order.mealaweKitchenDiscount;
                    foodOrder.voucherCode = subscriptionOrder.voucherCode;
                    foodOrder.voucherDiscount = order.voucherDiscount;
                    foodOrder.extraDiscount = order.extraDiscount;
                    orderList.push(foodOrder);
                } else {
                    order.orderNo = existingIdsListObj[order._id]['orderNo'];
                    order.foodOrderId = existingIdsListObj[order._id]['orderId'];;
                }
            });
            if (orderList.length > 0) {
                const updatedOrderList = await createFoodOrderTosave(orderList, 0);
                updatedOrderList.forEach(dbOrder => {
                    subscriptionOrder.dailyOrderList.forEach(order => {
                        if (dbOrder.subOrderId === order._id) {
                            order.orderNo = dbOrder.orderNo;
                        }
                    })
                });
                const dbOrderList = await saveMultipleOrders(updatedOrderList);
                dbOrderList.forEach(dbOrder => {
                    subscriptionOrder.dailyOrderList.forEach(order => {
                        if (dbOrder.orderNo === order.orderNo) {
                            order.foodOrderId = dbOrder._id;
                        }
                    })
                });
                subscriptionOrder.orderstatus = 'accepted';
                const updatedOrder = await updateOrderSubscription(subscriptionOrder);
                resolve(updatedOrder);
            } else {
                subscriptionOrder.orderstatus = 'accepted';
                const updatedOrder = await updateOrderSubscription(subscriptionOrder);
                resolve(updatedOrder);
            }
        } catch (e) {
            // console.log('error while sending notification to kitchen partner ',e);
            reject(e);
        }
    });
}

createFoodOrderTosave = async (orders, index) => {
    const orderList = [...orders];
    return new Promise(async (resolve, reject) => {
        try {
            if (index < orderList.length) {
                const foodOrderNo = await counterDao.getNextSequenceValue('Food_Order_No');
                const orderNo = parseInt(foodOrderNo);
                orderList[index].orderNo = orderNo;
                index++;
                const list = await createFoodOrderTosave(orderList, index);
                resolve(list);
            } else {
                resolve(orderList);
            }
        } catch (e) {
            // console.log('error while updating food order ',e);
            reject(e);
        }
    });
}

const getKitchenPastSubscriptionOrders = async (kitchenId, page) => {
    return dao.getKitchenPastSubscriptionOrders(kitchenId, page);
}
const getCurrentSubscriptionCount = async (clientDate) => {
    return dao.getCurrentSubscriptionCount();
}
const getClusterCurrentSubscriptionCount = async (clusterList) => {
    return dao.getCurrentSubscriptionCount(clusterList);
}

const getCurrentSubOrdersList = async (status, clientDate, page, limit) => {
    return dao.getCurrentSubOrdersList(status, clientDate, page, limit);
}

const resecheduleSubscriptionOrder = async (subscriptionOrderId, foodOrderId, orderDate) => {
    const updatedOrder = await updateFoodOrderDate(foodOrderId, orderDate);
    await dao.updateSubscriptionFoodOrderDate(subscriptionOrderId, foodOrderId, orderDate);
    return updatedOrder;
}
const performSubscriptionOrderTransfer = async (tranferredOrder) => {
    const order = await dao.performSubscriptionOrderTransfer(tranferredOrder);
    if (order && order._id) {
        try {
            sendGenericFcmMessage(`Order no. ${order.orderNo} has been transferred to your kitchen`, order.kitchenId, 'KITCHEN');
        } catch (error) {
            // console.log('Error while sending generic message on order transfer')
        }
    }
    return order;
}

const getSubscriptionRefundOrders = async () => {
    return dao.getSubscriptionRefundOrders();
}

const searchSubscriptionFoodOrderList = async (searchObj, page) => {
    return dao.searchSubscriptionFoodOrderList(searchObj, page);
}


module.exports = {
    saveOrderSubscription,
    autoRefundOnSubscription,
    updateOrderSubscription,
    getOrderSubscription,
    getCustomerSubscriptionList,
    getKitchenSubDashboardCount,
    checkSubOrderValidForKitchen,
    acceptSubscriptionOrder,
    getKitchenPastSubscriptionOrders,
    getCurrentSubscriptionCount,
    getClusterCurrentSubscriptionCount,
    getCurrentSubOrdersList,
    resecheduleSubscriptionOrder,
    performSubscriptionOrderTransfer,
    getSubscriptionRefundOrders,
    searchSubscriptionFoodOrderList
}