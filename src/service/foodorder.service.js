const dao = require('../dao/foodorder.dao');
const bulkDao = require('../dao/bulkFoodOrder.dao');
const subscriptionDao = require('../dao/foodOrderSubscription.dao');
const subscriptionPackageDao = require('../dao/foodOrderPackage.dao');
const counterDao = require('../dao/counters.dao');
const { sendFcmMessage, sendTransactionFcmMessage, sendGenericFcmMessage } = require('../util/fcm-message-handler');
const { getTodayStartTime, getLocalMidDate } = require('../util/date-util')
const { checkRefundEligibility, getkitchenCommisionPercentage } = require('../util/payment-validation-util');
const { depositeWalletBalance, getKitchenWallet } = require('../dao/kitchenWallet.dao');
const { updateQuantityBooked } = require('./todaysMenu.service');
const { saveKitchenTransactionHistory, updatedKitchenTransactionHistory } = require('./kitchenTransactionHistory.service');
const { deductMoneyPointsFromWallet, addMoneyPointsInWallet, updatedCashBack, createCashBack } = require('../util/user-wallet-util');
const { checkUserFirstOrderReward } = require('../util/reward-points-util');
const { callKitchen } = require('../util/tel-provider-util');
const utilService = require('../service/utility.service');
const { callTreePlantAPI } = require('../util/grow-billion-tree-util');
const { checkLatLngInCluster } = require('../util/google-map-api-util');
const { createKitchenLedger } = require('../util/kitchen-ledger-wallet-util');
// const { sendToWebSocket } = require('../util/websocket-handler');
const { sendFirstTimeCustomerFeedback } = require('../util/whatsapp/whatsapp.service');


const getKitchenOrderDetail = async (kitchenId, orderType, clientDate) => {
    return dao.getKitchenOrderDetail(kitchenId, orderType, clientDate);
}
const getKitchenSubOrderDetail = async (kitchenId, orderType, mealType, clientDate) => {
    return dao.getKitchenSubOrderDetail(kitchenId, orderType, mealType, clientDate);
}
const getCustomerOrderDetail = async (customerId, onlyCount) => {
    return dao.getCustomerOrderDetail(customerId, onlyCount);
}
const saveFoodOrder = async (foodOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const foodOrderNo = await counterDao.getNextSequenceValue('Food_Order_No');
            foodOrder.orderNo = parseInt(foodOrderNo);
            const clusterObj = await checkLatLngInCluster(foodOrder.customerLocation.geolocation);
            if (clusterObj) {
                foodOrder.clusterId = clusterObj.clusterId;
                foodOrder.clusterName = clusterObj.clusterName;
            }
            const newFoodOrder = await dao.saveFoodOrder(foodOrder);
            resolve(newFoodOrder);
        }
        catch (e) {
            reject(e);
        }
    });
}
const updateFoodOrder = async (foodOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const updatedFoodOrder = await dao.updateFoodOrder(foodOrder);
            try {
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'placed') {
                    checkUserFirstOrderReward(updatedFoodOrder);
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.kitchenId, 'KITCHEN');
                    // callKitchen(updatedFoodOrder._id);
                    // sendToWebSocket('NEW_ORDER',{orderNo:updatedFoodOrder.orderNo});
                    if (updatedFoodOrder.orderType === 'daily') {
                        updateQuantityBooked(updatedFoodOrder.kitchenId, updatedFoodOrder.itemList, false);
                    }
                    if (updatedFoodOrder.moneyWalletPointsUsed && updatedFoodOrder.moneyWalletPointsUsed > 0) {
                        deductMoneyPointsFromWallet(updatedFoodOrder.customerId, updatedFoodOrder.customerName, updatedFoodOrder.moneyWalletPointsUsed,
                            `Points redeemed on order no. ${updatedFoodOrder.orderNo}`);
                    }
                    if (updatedFoodOrder.mealaweWalletPointsUsed && updatedFoodOrder.mealaweWalletPointsUsed > 0) {
                        // deductMealawePointsFromWallet(updatedFoodOrder.customerId,updatedFoodOrder.customerName,updatedFoodOrder.mealaweWalletPointsUsed,
                        //     `Mealawe points redeemed on order no. ${updatedFoodOrder.orderNo}`);
                        updatedCashBack(updatedFoodOrder.customerId, updatedFoodOrder.orderNo, updatedFoodOrder.mealaweWalletPointsUsed);
                    }
                    callTreePlantAPI(updatedFoodOrder);
                    // console.log('updateFoodOrder placed 3');                  
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
                if (updatedFoodOrder && (updatedFoodOrder.orderstatus === 'cancelledByKitchen' || updatedFoodOrder.orderstatus === 'rejectedByKitchen')) {
                    if (updatedFoodOrder.orderType === 'daily' ) {
                        // console.log('updateFoodOrder cancelled 2')
                        await updateQuantityBooked(updatedFoodOrder.kitchenId, updatedFoodOrder.itemList, true);
                    }
                    // console.log('updateFoodOrder cancelled 3')
                    autoRefundOnFoodOrder(updatedFoodOrder);
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'delivered') {
                    if (!updatedFoodOrder.skipWalletPayment) {
                        payFoodOrderAmtToKitchen([updatedFoodOrder.orderNo])
                    }
                    sendFirstTimeCustomerFeedback(updatedFoodOrder.customerPhoneNo, updatedFoodOrder.customerName);
                    console.log('updateFoodOrder final', updatedFoodOrder.orderNo, updatedFoodOrder.orderstatus);
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                }
                else {
                    if(updatedFoodOrder){
                    // console.log('updateFoodOrder final',updatedFoodOrder.orderNo,updatedFoodOrder.orderstatus);

                    if (updatedFoodOrder) {
                        sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                    }
                }
            }
            } catch (e) {
                console.log('error while sending notification to kitchen partner ', e);
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

const checkCancelEligibility = async (foodOrderId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const refundEligibleObj = await checkRefundEligibility(foodOrderId, false, false);
            resolve({
                cancelEligibleObj: {
                    cancelEligible: refundEligibleObj.cancelEligible,
                    refund_amount: refundEligibleObj.refund_amount,
                                        walletDeduction: refundEligibleObj.walletDeduction || 0

                },
                foodOrder: refundEligibleObj.foodOrder
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
const getKitchenOrdersCount = async (kitchenId, clientDate) => {
    return dao.getKitchenOrdersCount(kitchenId, clientDate)
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

const getKitchenPastOrders = async (kitchenId, fromDate, toDate) => {
    return dao.getKitchenPastOrders(kitchenId, fromDate, toDate);
}
const getKitchenPastOrdersReport = async (kitchenId, fromDate, toDate) => {
    return dao.getKitchenPastOrdersReport(kitchenId, fromDate, toDate);
}
const updateFeedbackstatus = async (id) => {
    return dao.updateFeedbackstatus(id);
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
const getFoodOrder = async (id) => {
    return dao.getFoodOrder(id);
}
const getFoodOrderByorderNo = async (orderNo) => {
    return dao.getFoodOrderByorderNo(orderNo);
}
const getFoodOrderbyOrderNoThinkOwl = async (id) => {
    return dao.getFoodOrderbyOrderNoThinkOwl(id);
}
const getFoodOrderbyCustomerEmailThinkOwl = async (email) => {
    return dao.getFoodOrderbyCustomerEmailThinkOwl(email);
}
const searchFoodOrderList = async (searchObj, page) => {
    return dao.searchFoodOrderList(searchObj, page);
}
const getdashboardCount = async () => {
    return dao.getdashboardCount();
}
const getListForReward = async (searchObj) => {
    return dao.getListForReward(searchObj);
}
const updateDeliveryOrder = async (deliveryTaskId, orderNoList, deliveryVendor, deliveryAmtPaidByMealawe, pickup_otp, drop_otp) => {
    return dao.updateDeliveryOrder(deliveryTaskId, orderNoList, deliveryVendor, deliveryAmtPaidByMealawe, pickup_otp, drop_otp);
}

const updatePendingOrdersProps = async (orderIds, updateProp, updateInfo, subsPackageId) => {
    try {
        const updatedOrders = await dao.updatePendingOrdersProps(orderIds, updateProp, updateInfo);
        const orderList = await dao.getFoodOrderList(orderIds);
        const prop = Object.keys(updateProp)[0] || '';
        const updatedFoodOrderPackage = await subscriptionPackageDao.updateFoodOrderPackageProps(subsPackageId, orderList, prop);
        return updatedFoodOrderPackage;
    } catch (error) {
        console.log(error, 'error in updating pending order props')
    }
}

const updatePendingOrdersDate = async (orderIds, updateProp, updateInfo, subsPackageId) => {
    try {
        const increaseBydays = updateProp.increaseOrderDateBy;
        await Promise.all(orderIds.map(async id => {
            const order = await dao.getFoodOrder(id);
            const newDate = getLocalMidDate(order.orderDate);
            const newOrderDate = getLocalMidDate(newDate.setDate(newDate.getDate() + increaseBydays));
            const updatedOrder = await dao.updateFoodOrderDate(id, newOrderDate, updateInfo);
        }));
        const orderList = await dao.getFoodOrderList(orderIds);
        const prop = 'orderDate';
        const updatedFoodOrderPackage = await subscriptionPackageDao.updateFoodOrderPackageProps(subsPackageId, orderList, prop);
        return updatedFoodOrderPackage;
    } catch (error) {
        console.log(error, 'error in updating pending order date')
    }

}

const updateFoodOrderProps = async (orderNoList, updateCondtion) => {
    return dao.updateFoodOrderProps(orderNoList, updateCondtion);
}

const updateOrderStatusAfterDelivery = async (orderNo, status) => {
    try {
        const existingOrder = await dao.getFoodOrderByOrderNo(orderNo);
        if (existingOrder && existingOrder.orderstatus !== status) {
            // // console.log('updateOrderStatusAfterDelivery service ',existingOrder.orderstatus, status)
            existingOrder.orderstatus = status;
            const updatedFoodOrder = await dao.updateFoodOrder(existingOrder);
            sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
        }//http call in else 
        else {
            const body = {
                data: {
                    orderNo: orderNo,
                    status: status
                },
                urlQuery: 'updateOrderStatusAfterDelivery',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
    }
    catch (e) {
        // console.log('error while updateOrderStatusAfterDelivery ',e)
    }
}

const payFoodOrderAmtToKitchen = async (orderNos) => {
    try {
        // console.log('orderNos ',orderNos); 
        const orderlist = await dao.getFoodOrderListByOrderNo(orderNos);
        let totalAmtAfterCommisionPaidToKitchen = 0;
        let kitchenId;
        let kitchenName;
        let orderNoList = [];
        const ordersToUpdateWhilePayingKitchen = [];
        const ledgerObjList = [];
        const commissionPercentage = await getkitchenCommisionPercentage();
        // console.log('payAmtToKitchen commissionPercentage ',commissionPercentage);   
        const promiseArr = [];
        // console.log('orderlist',orderlist.length);      
        if (orderlist && orderlist.length > 0) {
            orderlist.forEach(order => {
                const loopPromise = new Promise(async (resolve, reject) => {
                    if (!order.amtPaidToKitchen) {
                        let price = 0;
                        const kitchenDiscount = order.kitchenDiscount ? order.kitchenDiscount : 0;
                        let amoutToPayKitchen = order.itemAmount;
                        if (order.orderType === 'subscription') {
                            let currentMonthCount = await dao.getAssignedMontlyOrders(order.kitchenId);
                            if (currentMonthCount > 40) {
                                if (order.payToKitchenPerMealWithAddon2) {
                                    amoutToPayKitchen = order.payToKitchenPerMealWithAddon;
                                }
                            } else {
                                if (order.payToKitchenPerMealWithAddon) {
                                    amoutToPayKitchen = order.payToKitchenPerMealWithAddon;
                                }
                            }
                        }
                        if (order.orderTransferred) {
                            const transferExtraAmt = order.transferExtraAmt ? order.transferExtraAmt : 0;
                            const reduceExtraAmt = order.reduceExtraAmt ? order.reduceExtraAmt : 0;
                            price += (amoutToPayKitchen + transferExtraAmt - reduceExtraAmt);
                        } else {
                            price += (amoutToPayKitchen - kitchenDiscount);
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
                    resolve();
                });
                promiseArr.push(loopPromise);
            });
        }
        await Promise.all(promiseArr);

        if (kitchenId && orderNoList.length > 0) {
            await dao.updateOrderWhilePayingKitchen(ordersToUpdateWhilePayingKitchen);
            ledgerObjList.forEach(async (ledgerObj) => {
                await createKitchenLedger(ledgerObj);
            });
            sendTransactionFcmMessage('kitchen_credit', totalAmtAfterCommisionPaidToKitchen, kitchenId, 'KITCHEN');
        }
    } catch (error) {
        console.log('Error while post order update ', error);
    }
}
const payAmtToKitchen = async (orderNos) => {
    try {
        // // console.log('orderNos ',orderNos); 
        let orderlist = [];
        if (orderNos.server) {
            if (orderNos.server != 'DD') {
                // console.log('inside not dd');
                orderlist = await dao.getFoodOrderListByOrderNo(orderNos.ids);//add orderCreatedBy for else
                // // console.log('orderlist',orderlist)
            }
            else {
                // console.log('inside dd else')
                const body = {
                    data: {
                        orderNos: orderNos.ids
                    },
                    urlQuery: 'getFoodOrderListByOrderNo',
                    method: 'POST'
                }
                const res = await utilService.accessDeskDyneData(body);
                orderlist = res;
                // console.log('inside dd',res.length);
            }
        } else {
            // console.log('inside without server');
            try {
                const mealaweDBOrders = await dao.getFoodOrderListByOrderNo(orderNos.ids);
                const mealaweDBBulkOrders = await bulkDao.getFoodOrderListByOrderNo(orderNos.ids);
                // console.log(mealaweDBBulkOrders.length)
                if (mealaweDBOrders && mealaweDBOrders.length > 0) {
                    orderlist = mealaweDBOrders;
                    orderNos.server = 'ML';
                }
                else if (mealaweDBBulkOrders && mealaweDBBulkOrders.length > 0) {
                    orderlist = mealaweDBBulkOrders;
                    orderNos.server = 'MLBulk';
                }
                else {
                    // console.log('inside dd without server')
                    const body = {
                        data: {
                            orderNos: orderNos.ids
                        },
                        urlQuery: 'getBulkFoodOrderListByOrderNo',
                        method: 'POST'
                    }
                    const deskDyneDBOrders = await utilService.accessDeskDyneData(body);
                    if (deskDyneDBOrders && deskDyneDBOrders.length > 0) {
                        orderlist = deskDyneDBOrders;
                        orderNos.server = 'DD';
                    }
                    else {
                        const body = {
                            data: {
                                orderNos: orderNos.ids
                            },
                            urlQuery: 'getFoodOrderListByOrderNo',
                            method: 'POST'
                        }
                        const deskDyneDBOrders = await utilService.accessDeskDyneData(body);
                        if (deskDyneDBOrders && deskDyneDBOrders.length > 0) {
                            orderlist = deskDyneDBOrders;
                            orderNos.server = 'DD';
                        }
                    }
                }
            } catch (error) {
                console.log('Error while checking server ', error);
            }
        }

        let totalAmtAfterCommisionPaidToKitchen = 0;
        let kitchenId;
        let kitchenName;
        let orderNoList = [];
        const ledgerObjList = [];
        const ordersToUpdateWhilePayingKitchen = [];
        const commissionPercentage = await getkitchenCommisionPercentage();
        // console.log(orderlist,orderlist.length)    
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
                    // console.log(totalAmtAfterCommisionPaidToKitchen,'final amount')
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
            let status = false;
            if (orderNos.server !== 'DD' && orderNos.server !== 'MLBulk') {
                await dao.updateOrderWhilePayingKitchen(ordersToUpdateWhilePayingKitchen)
                status = true;
            }
            else if (orderNos.server === 'MLBulk') {
                await bulkDao.updateOrderWhilePayingKitchen(ordersToUpdateWhilePayingKitchen)
                status = true;
            }
            else {
                const body = {
                    data: {
                        ordersToUpdateWhilePayingKitchen
                    },
                    urlQuery: 'updateOrderWhilePayingKitchen',
                    method: 'POST'
                }
                const res = await utilService.accessDeskDyneData(body);//deskdyne bulk order add
                if (res) {
                    status = true;
                }
                else {
                    const body = {
                        data: {
                            ordersToUpdateWhilePayingKitchen
                        },
                        urlQuery: 'updateBulkOrderWhilePayingKitchen',
                        method: 'POST'
                    }
                    const res = await utilService.accessDeskDyneData(body);
                    if (res) {
                        status = true;
                    }
                }
            }
            if (status) {
                ledgerObjList.forEach(async (ledgerObj) => {
                    await createKitchenLedger(ledgerObj);
                });
                sendTransactionFcmMessage('kitchen_credit', totalAmtAfterCommisionPaidToKitchen, kitchenId, 'KITCHEN');
                //send fcm to kitchen
            }
        }
    } catch (error) {
        console.log('Error while post order update ', error);
    }
}

const getfcmFoodOrder = async () => {
    return dao.getfcmFoodOrder();
}

const autoRefundOnFoodOrder = async (foodOrder, autoCancel) => {
    try {
        //   // Skip auto-cancel/refund for apartment orders
        if ((foodOrder.orderType === 'apartment_today' || foodOrder.orderType === 'apartment_advance') &&  foodOrder.orderstatus !== 'rejectedByKitchen') {
            console.log(`Skipping auto-refund for apartment order ${foodOrder.orderNo}`);
            return;
        }
        // console.log('autoRefundOnFoodOrder 1')
        const cancelEligibleObj = await checkRefundEligibility(foodOrder._id, autoCancel, false);
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
            await dao.updateFoodOrder(foodOrder);
            // console.log('autoRefundOnFoodOrder 2')   
            sendFcmMessage(foodOrder.orderstatus, foodOrder.orderNo, foodOrder.customerId, 'USER');
            // need to change here    
            let mealawePoinstUsed = 0;
            if (foodOrder.mealaweWalletPointsUsed) {
                mealawePoinstUsed = foodOrder.mealaweWalletPointsUsed;
                // addMealawePointsInWallet(foodOrder.customerId,foodOrder.customerName,mealawePoinstUsed,
                //     `Mealawe points added on refund of order no. ${foodOrder.orderNo}`);
                createCashBack(foodOrder.customerId, foodOrder.customerName, foodOrder.customerPhoneNo, foodOrder.customerEmail,
                    mealawePoinstUsed, `Cashback on refund of order no. ${foodOrder.orderNo}`);
                // console.log('autoRefundOnFoodOrder mealawe points added',foodOrder.orderNo);
            }
            refund_amount = refund_amount - mealawePoinstUsed;
            if (refund_amount > 0) {
                addMoneyPointsInWallet(foodOrder.customerId, foodOrder.customerName, refund_amount,
                    `Points added on refund of order no. ${foodOrder.orderNo}`);
                // console.log('autoRefundOnFoodOrder completed ',foodOrder.orderNo);
            }
        }
    }
    catch (e) {
        // console.log('autoRefundOnFoodOrder error => ',e)
    }
}

const getCustomerOpenOrders = async (customerId) => {
    return dao.getCustomerOpenOrders(customerId);
}
const getCustomerSpecificOrders = async (customerId, page, getNonCompletedOrder) => {
    return dao.getCustomerSpecificOrders(customerId, page, getNonCompletedOrder);
}
const checkOrderValidForKitchen = async (id, currentStatus) => {
    return new Promise(async (resolve, reject) => {
        try {
            const statusObj = { valid: false, orderstatus: currentStatus };
            const foodOrder = await dao.getFoodOrder(id);
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

const getKitchenDashboardCount = async (kitchenId, clientDate, orderType) => {
    return dao.getKitchenDashboardCount(kitchenId, clientDate, orderType);
}

const getCurrentOrdersCount = async (clientDate) => {
    return dao.getCurrentOrdersCount();
}

const getClusterCurrentOrdersCount = async (clusterList) => {
    return dao.getCurrentOrdersCount(clusterList);
}

const getCurrentOrdersList = async (status, clientDate, page, limit) => {
    return dao.getCurrentOrdersList(status, clientDate, page, limit);
}

const getClusterCurrentOrdersList = async (status, clusterList, page, limit) => {
    return dao.getCurrentOrdersList(status, clusterList, page, limit);
}

const performOrderTransfer = async (tranferredOrder) => {
    const order = await dao.performOrderTransfer(tranferredOrder);
    if (order && order._id) {
        try {
            sendGenericFcmMessage(`Order no. ${order.orderNo} has been transferred to your kitchen`, order.kitchenId, 'KITCHEN');
        } catch (error) {
            // console.log('Error while sending generic message on order transfer')
        }
    }
    return order;
}

const getRefundOrders = async () => {
    return dao.getRefundOrders();
}

const getCustomerCurrentOpenOrders = async (customerId, clientDate) => {
    return Promise.all([dao.getCustomerCurrentOpenOrders(customerId, clientDate),
    subscriptionDao.getCustomerCurrentSubOrders(customerId, clientDate),
    subscriptionPackageDao.getCustomerCurrentSubOrders(customerId)]);
}
const getCustomerPastOrders = async (customerId, page, clientDate) => {
    return dao.getCustomerPastOrders(customerId, page, clientDate);
}
const getCustomerPastOrdersByType = async (customerId, page, clientDate, type) => {
    return dao.getCustomerPastOrdersByType(customerId, page, clientDate, type);
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

const updateManualDelivery = async (id) => {
    return dao.updateManualDelivery(id);
}

const updateDeliveryByMealaweBoy = async (id) => {
    return dao.updateDeliveryByMealaweBoy(id);
}

const updatePackageImage = async (id, prop, filename) => {
    return dao.updatePackageImage(id, prop, filename);
}

const buildRiderTripCdnUrl = (filename) => {
    if (!filename) return null;
    const cdnBase = process.env.CDN_BASE_URL;
    const prefix = process.env.S3_PATH_PREFIX;
    if (cdnBase && prefix) return `${cdnBase}/${prefix}/${filename}`;
    if (cdnBase) return `${cdnBase}/${filename}`;
    return filename;
}

const setRiderTripImage = async (id, prop, filename) => {
    await dao.setRiderTripImage(id, prop, filename);
    return {
        url: buildRiderTripCdnUrl(filename),
        filename,
        prop,
        orderId: id
    };
}

const setOrderProofImage = async (id, filename, gps) => {
    await dao.setOrderProofImage(id, filename, gps);
    return {
        url: buildRiderTripCdnUrl(filename),
        filename,
        orderId: id
    };
}

const startRiderTrip = async (payload) => {
    if (!payload || !payload.orderId) {
        throw new Error('orderId is required');
    }
    if (payload.startKM === undefined || payload.startKM === null || isNaN(Number(payload.startKM))) {
        throw new Error('startKM is required and must be numeric');
    }
    if (!payload.selfieImageUrl || !payload.odometerImageUrl) {
        throw new Error('selfieImageUrl and odometerImageUrl are required');
    }
    const tripId = `T-${Date.now()}-${String(payload.orderId).slice(-6)}`;
    await dao.startRiderTrip(payload.orderId, {
        tripId,
        startKM: Number(payload.startKM),
        selfieImageUrl: payload.selfieImageUrl,
        selfieGps: payload.selfieGps,
        selfieCapturedAt: payload.selfieCapturedAt ? new Date(payload.selfieCapturedAt) : undefined,
        odometerImageUrl: payload.odometerImageUrl,
        odometerCapturedAt: payload.odometerCapturedAt ? new Date(payload.odometerCapturedAt) : undefined
    });
    return { tripId, status: true };
}

const getPaymentValidationOrder = async () => {
    return dao.getPaymentValidationOrder();
}

const getCustomerVoucherOrderList = async (customerId, voucherCode, checkForToday) => {
    return dao.getCustomerVoucherOrderList(customerId, voucherCode, checkForToday);
}

const getVoucherUsedOrderList = async (voucherCode) => {
    return dao.getVoucherUsedOrderList(voucherCode);
}

const getLastUnratedDeliveredOrder = async (customerId) => {
    let today = getTodayStartTime();
    today.setDate(today.getDate())
    let day3Before = new Date(today);
    day3Before.setDate(day3Before.getDate() - 3);
    return dao.getLastUnratedDeliveredOrder(customerId, day3Before, today)
}

const getLastUnratedDeliveredOrderList = async (customerId) => {
    let today = getTodayStartTime();
    today.setDate(today.getDate())
    let day3Before = new Date(today);
    day3Before.setDate(day3Before.getDate() - 5);
    return dao.getLastUnratedDeliveredOrderList(customerId, day3Before, today)
}

const exportFoodOrderList = async (searchObj) => {
    return dao.exportFoodOrderList(searchObj);
}
const exportApartmentFoodOrderList= async (searchObj) => {
    return dao.exportApartmentFoodOrderList(searchObj);
}

const getKitchenAssignedOrders = async (kitchenIdList) => {
    return dao.getKitchenAssignedOrders(kitchenIdList);
}

const getAssignedMontlyOrders = async (kitchenId) => {
    return dao.getAssignedMontlyOrders(kitchenId);
}

const kitchenWiseOrders = async () => {
    return dao.kitchenWiseOrders();
}

const getCustomerPastFoodOrderInfo = async (customerId) => {
    return dao.getCustomerPastFoodOrderInfo(customerId);
}

const changeFoodOrderAddress = async (id, address) => {
    return dao.changeFoodOrderAddress(id, address);
}

const changeChildOrdersAddress = async (ids, address) => {
    return dao.changeChildOrdersAddress(ids, address);
}

const getCustomerFirstOrder = async (ids) => {
    return dao.getCustomerFirstOrder(ids);
}
const orderListToDeliver = async (searchObj, page) => {
    return dao.orderListToDeliver(searchObj, page);
}

const getOrdersByOrderTypeAndCustomerId = async (orderType, customerId) => {
    return dao.getOrdersByOrderTypeAndCustomerId(orderType, customerId);
}
const updateApartmentOrderOtp = async (orderId, newOtp) => {
    return await dao.updateApartmentOrderOtp(orderId, newOtp);
}

const getOyoOrderListByDateRange = async (fromDate, toDate, hotelIds, page, limit) => {
    return dao.getOyoOrderListByDateRange(fromDate, toDate, hotelIds, page, limit)
}
const getApartmentOrderListByDateRange = async (fromDate, toDate, apartmentIds, page, limit) => {
    try {
        // Validate apartmentIds before passing to DAO
        const validatedApartmentIds = apartmentIds && apartmentIds.length > 0 
            ? apartmentIds.filter(id => id && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id))
            : [];

        return await dao.getApartmentOrderListByDateRange(
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

const getApartmentTodayOrderCount = async (kitchenId) => {
    return dao.getApartmentTodayOrderCount(kitchenId);
}

const getApartmentAdvanceOrderCount = async (kitchenId) => {
    return dao.getApartmentAdvanceOrderCount(kitchenId);
}

const getApartmentMealTypeCounts = async (kitchenId, apartmentType) => {
    return dao.getApartmentMealTypeCounts(kitchenId, apartmentType);
}

const getApartmentOrderCounts = async (kitchenId, apartmentType, mealType) => {
    return dao.getApartmentOrderCounts(kitchenId, apartmentType, mealType);
}

const getApartmentOrdersByType = async (kitchenId, apartmentType, mealType, status) => {
  return dao.getApartmentOrdersByType(kitchenId, apartmentType, mealType, status);
}

const getApartmentOrderCountsByDate = async (kitchenId) => {
    try {
        const todayCount = await dao.getApartmentTodayOrderCount(kitchenId);
        const advanceCount = await dao.getApartmentAdvanceOrderCount(kitchenId);
        const mealTypeCounts = await dao.getApartmentMealTypeCounts(kitchenId, 'today');
        const advanceMealTypeCounts = await dao.getApartmentMealTypeCounts(kitchenId, 'advance');
        
        return {
            todayCount: todayCount.todayCount || 0,
            advanceCount: advanceCount.advanceCount || 0,
            mealTypeCounts: mealTypeCounts || {
                breakfastOrder: 0,
                lunchOrder: 0,
                HighTeaOrder: 0,
                dinnerOrder: 0
            },
            advanceMealTypeCounts: advanceMealTypeCounts || {
                breakfastOrder: 0,
                lunchOrder: 0,
                HighTeaOrder: 0,
                dinnerOrder: 0
            }
        };
    } catch (error) {
        console.error('Error in getApartmentOrderCountsByDate:', error);
        return {
            todayCount: 0,
            advanceCount: 0,
            mealTypeCounts: {
                breakfastOrder: 0,
                lunchOrder: 0,
                HighTeaOrder: 0,
                dinnerOrder: 0
            },
            advanceMealTypeCounts: {
                breakfastOrder: 0,
                lunchOrder: 0,
                HighTeaOrder: 0,
                dinnerOrder: 0
            }
        };
    }
}

const updateRouteInfo = async (foodOrderId, routeData) => {
    return dao.updateRouteInfo(foodOrderId, routeData);
};

const updateRunnerLocation = async (orderId, location) => {
    return dao.updateRunnerLocation(orderId, location);
};

module.exports = {
    getKitchenOrderDetail,
    getKitchenSubOrderDetail,
    getCustomerOrderDetail,
    saveFoodOrder,
    updateFoodOrder,
    getKitchenOrdersCount,
    updateOrderStatus,
    getKitchenPastOrders,
    getKitchenPastOrdersReport,
    updateFeedbackstatus,
    checkCancelEligibility,
    getFoodOrder,
    searchFoodOrderList,
    getdashboardCount,
    getListForReward,
    updateDeliveryOrder,
    updateOrderStatusAfterDelivery,
    payAmtToKitchen,
    getfcmFoodOrder,
    autoRefundOnFoodOrder,
    getCustomerOpenOrders,
    getCustomerSpecificOrders,
    checkOrderValidForKitchen,
    getKitchenDashboardCount,
    getCurrentOrdersCount,
    getClusterCurrentOrdersCount,
    getCurrentOrdersList,
    getClusterCurrentOrdersList,
    performOrderTransfer,
    getRefundOrders,
    getCustomerCurrentOpenOrders,
    getCustomerPastOrders,
    getCustomerCouponOrderList,
    getFoodOrderListByOrderNo,
    getFoodOrderByOrderNo,
    updateManualDelivery,
    updateDeliveryByMealaweBoy,
    updatePackageImage,
    setRiderTripImage,
    setOrderProofImage,
    startRiderTrip,
    getPaymentValidationOrder,
    getCustomerVoucherOrderList,
    getVoucherUsedOrderList,
    getLastUnratedDeliveredOrder,
    updatePendingOrdersProps,
    updatePendingOrdersDate,
    getLastUnratedDeliveredOrderList,
    exportFoodOrderList,
    getKitchenAssignedOrders,
    getAssignedMontlyOrders,
    kitchenWiseOrders,
    getCustomerPastFoodOrderInfo,
    changeFoodOrderAddress,
    changeChildOrdersAddress,
    payFoodOrderAmtToKitchen,
    updateFoodOrderProps,
    getCustomerFirstOrder,
    orderListToDeliver,
    getCustomerPastOrdersByType,
    getOrdersByOrderTypeAndCustomerId,
    getFoodOrderbyOrderNoThinkOwl,
    getFoodOrderbyCustomerEmailThinkOwl,
    updateApartmentOrderOtp,
    getOyoOrderListByDateRange,
    getApartmentOrderListByDateRange,
    getApartmentTodayOrderCount,
    getApartmentAdvanceOrderCount,
    getApartmentMealTypeCounts,
    getApartmentOrderCounts,
    getApartmentOrdersByType,
    getApartmentOrderCountsByDate,
    getFoodOrderByorderNo,
    exportApartmentFoodOrderList,
    updateRouteInfo,
    updateRunnerLocation
}