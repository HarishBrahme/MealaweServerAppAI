const foodOrderService = require("../service/foodorder.service");
const bulkOrderService = require('../service/bulkFoodOrder.service');
const foodOrderDao = require('../dao/foodorder.dao');
const bulkOrderDao = require('../dao/bulkFoodOrder.dao');
const utilService = require('../service/utility.service');
const { getkitchenCommisionPercentage } = require("./payment-validation-util");
const { getKitchenWallet, depositeWalletBalance } = require("../dao/kitchenWallet.dao");
const { saveKitchenTransactionHistory, updatedKitchenTransactionHistory } = require("../dao/kitchenTransactionHistory.dao");
const { sendTransactionFcmMessage } = require("./fcm-message-handler");
const { serverLog } = require("./firebasedb-util");
const { createKitchenLedger } = require("./kitchen-ledger-wallet-util");
const { getOneVariable } = require("../service/appConfigVariable.service");

const updateServerOrderDeliveryPrice = async (deliveryTaskId, orderNoList, deliveryVendor, estimated_price, server) => {
    try {
        if (server !== 'DD' && server !== 'MLBulk' && server !== 'DDBulk' && server !== 'DDDaily') {
            await foodOrderService.updateFoodOrderProps(orderNoList,
                { deliveryTaskId, deliveryVendor, deliveryAmtPaidByMealawe: estimated_price }
            );
        } else if (server === 'MLBulk') {
            await bulkOrderService.updateBulkFoodOrderProps(orderNoList,
                { deliveryTaskId, deliveryVendor, deliveryAmtPaidByMealawe: estimated_price }
            );
        }
        else if (server === 'DD') {
            const body = {
                data: {
                    deliveryTaskId: deliveryTaskId,
                    orderNoList: orderNoList,
                    deliveryVendor: deliveryVendor,
                    deliveryAmtPaidByMealawe: estimated_price
                },
                urlQuery: 'updateFoodOrderProps',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
        else if (server === 'DDBulk') {
            const body = {
                data: {
                    deliveryTaskId: deliveryTaskId,
                    orderNoList: orderNoList,
                    deliveryVendor: deliveryVendor,
                    deliveryAmtPaidByMealawe: estimated_price
                },
                urlQuery: 'updateBulkOrderProps',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
        else if (server === 'DDDaily') {
            const body = {
                data: {
                    deliveryTaskId: deliveryTaskId,
                    orderNoList: orderNoList,
                    deliveryVendor: deliveryVendor,
                    deliveryAmtPaidByMealawe: estimated_price
                },
                urlQuery: 'updateDailyBulkOrderProps',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
    }
    catch (e) {
        serverLog('Error updateServerOrderDeliveryPrice() in order-callback-util.js', { deliveryTaskId, orderNoList, deliveryVendor, estimated_price, server }, 'ERROR');
        console.log('error while updateDeliveryPrice ', e)
    }
}

const getServerFoodOrderList = async (server, orders) => {
    return new Promise(async (resolve, reject) => {
        try {
            let orderlist = [];
            if (server !== 'DD' && server !== 'MLBulk' && server !== 'DDBulk' && server !== 'DDDaily') {
                orderlist = await foodOrderService.getFoodOrderListByOrderNo(orders);
            } else if (server === 'MLBulk') {
                orderlist = await bulkOrderService.getFoodOrderListByOrderNo(orders);
            }
            else if (server === 'DD') {
                const body = {
                    data: {
                        orders
                    },
                    urlQuery: 'getFoodOrderListByOrderNo',
                    method: 'POST'
                }
                orderlist = await utilService.accessDeskDyneData(body);
            }
            else if (server === 'DDBulk') {
                const body = {
                    data: {
                        orders
                    },
                    urlQuery: 'getBulkFoodOrderListByOrderNo',
                    method: 'POST'
                }
                orderlist = await utilService.accessDeskDyneData(body);
            }
            else if (server === 'DDDaily') {
                const body = {
                    data: {
                        orders
                    },
                    urlQuery: 'getBulkDailyFoodOrderListByOrderNo',
                    method: 'POST'
                }
                orderlist = await utilService.accessDeskDyneData(body);
            }
            resolve(orderlist);
        }
        catch (e) {
            // console.log('error while updateDeliveryPrice ',e);
            resolve([]);
        }
    });
}

const updateServerFoodOrderStatus = async (server, orderNo, status) => {
    try {
        console.log('updateServerFoodOrderStatus', server, orderNo, status);  //   
        if (server !== 'DD' && server !== 'MLBulk' && server !== 'DDBulk' && server !== 'DDDaily') {
            const existingOrder = await foodOrderService.getFoodOrderByOrderNo(orderNo);
            if (existingOrder && existingOrder.orderstatus !== status) {
                existingOrder.orderstatus = status;
                const updatedOrder = await foodOrderService.updateFoodOrder(existingOrder);
                // console.log('updateServerFoodOrderStatus#',updatedOrder.orderstatus);          
            }
        } else if (server === 'MLBulk') {
            const existingOrder = await bulkOrderService.getFoodOrderByOrderNo(orderNo);
            if (existingOrder && existingOrder.orderstatus !== status) {
                existingOrder.orderstatus = status;
                await bulkOrderDao.updateBulkFoodOrder(existingOrder);
            }
        }
        else if (server === 'DD') {
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
        else if (server === 'DDBulk') {
            const body = {
                data: {
                    orderNo: orderNo,
                    status: status
                },
                urlQuery: 'updateBulkOrderStatusAfterDelivery',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
        else if (server === 'DDDaily') {
            const body = {
                data: {
                    orderNo: orderNo,
                    status: status
                },
                urlQuery: 'updateDailyOrderStatusAfterDelivery',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
    }
    catch (e) {
        // console.log('error while updateServerFoodOrderStatus ',e)
    }
}

const updateServerFoodOrder = async (server, updateObj) => {
    try {
        // console.log('updateServerFoodOrder',server);     
        if (server !== 'DD' && server !== 'MLBulk' && server !== 'DDBulk' && server !== 'DDDaily') {
            await foodOrderDao.updateOrderWhilePayingKitchen(updateObj);
        } else if (server === 'MLBulk') {
            await bulkOrderDao.updateOrderWhilePayingKitchen(updateObj);
        }
        else if (server === 'DD') {
            // console.log('DDD',server)
            const body = {
                data: {
                    orderNos: updateObj,
                },
                urlQuery: 'updateOrderWhilePayingKitchen',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
        else if (server === 'DDBulk') {
            const body = {
                data: {
                    orderNos: updateObj,
                },
                urlQuery: 'updateBulkOrderWhilePayingKitchen',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
        else if (server === 'DDDaily') {
            const body = {
                data: {
                    orderNos: updateObj
                },
                urlQuery: 'updateBulkDailyOrderWhilePayingKitchen',
                method: 'POST'
            }
            await utilService.accessDeskDyneData(body);
        }
    }
    catch (e) {
        // console.log('error while updateServerFoodOrder ',e)
    }
}

const payServerFoodOrderAmtToKitchenDirect = async (orderNos, server) => {
    let totalAmtAfterCommisionPaidToKitchen = 0;
    let kitchenId;
    let kitchenName;
    let orderNoList = [];
    const ledgerObjList = [];
    const ordersToUpdateWhilePayingKitchen = [];
    const promiseArr = [];
    const orderlist = await getServerFoodOrderList(server, orderNos);
    try {
        if (server !== 'DDDaily' && server !== 'DDBulk' && server !== 'DD') {
            const commissionPercentage = await getkitchenCommisionPercentage();

            const [
                kitchenCommission,
                apartmentTodayCommission,
                apartmentAdvanceCommission] = await Promise.all([getkitchenCommisionPercentage(), getApartmentTodayCommission(), getApartmentAdvanceCommission()]);
                
                const getCommission = (orderType) => {
                if (orderType === 'apartment_today') {
                    return apartmentTodayCommission;
                }
                if (orderType === 'apartment_advance' && orderType === 'apartmentBulk') {
                    return apartmentAdvanceCommission;
                }
                return kitchenCommission;
            };

            if (orderlist && orderlist.length > 0) {
                orderlist.forEach(order => {
                    const loopPromise = new Promise(async (resolve, reject) => {
                        // console.log('order.amtPaidToKitchen',order.amtPaidToKitchen);
                        if (!order.amtPaidToKitchen) {
                            const commissionPercentage = getCommission(order.orderType);


                            let price = 0;
                            const kitchenDiscount = order.kitchenDiscount ? order.kitchenDiscount : 0;
                            let amoutToPayKitchen = order.itemAmount;
                            if (order.orderType === 'subscription') {
                                let currentMonthCount = await foodOrderDao.getAssignedMontlyOrders(order.kitchenId);
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
                            let amtAfterCommisionPaidToKitchen = parseInt(price - orderCommission);
                            totalAmtAfterCommisionPaidToKitchen += amtAfterCommisionPaidToKitchen
                            if (order.orderType === 'apartment_today' || order.orderType === 'apartment_advance' || order.orderType === 'apartmentBulk') {
                                if(order.enableDelivery){
                                    amtAfterCommisionPaidToKitchen = amtAfterCommisionPaidToKitchen + order.deliveryCharges;
                                }
                            }
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
                            let remark =`New Ledger Created for order no. ${order.orderNo}`;
                            if(order.orderType === 'subscription'){
                                remark =`New Ledger Created for order no. ${order.orderNo} (Inclusive of Food and Packaging Charges)`;
                            }

                            const ledgerObj = {
                                remark:remark,
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
                await updateServerFoodOrder(server, ordersToUpdateWhilePayingKitchen);
                ledgerObjList.forEach(async (ledgerObj) => {
                    await createKitchenLedger(ledgerObj);
                });
                sendTransactionFcmMessage('kitchen_credit', totalAmtAfterCommisionPaidToKitchen, kitchenId, 'KITCHEN');
            }
        } else if (server == 'DDBulk' && false) {
            if (orderlist && orderlist.length > 0) { // disabling kitchen payment for DDBulk           
                orderlist.forEach(order => {
                    kitchenId = order.kitchenId;
                    kitchenName = order.kitchenName
                    const loopPromise = new Promise(async (resolve, reject) => {
                        let amtAfterCommisionPaidToKitchen = 0;
                        order.itemList.forEach(orderitem => {
                            amtAfterCommisionPaidToKitchen += orderitem.payAmtToKitchen * orderitem.count;
                        });
                        totalAmtAfterCommisionPaidToKitchen += amtAfterCommisionPaidToKitchen;
                        const orderCommission = 0;
                        ordersToUpdateWhilePayingKitchen.push({
                            id: order._id,
                            amtPaidToKitchen: true,
                            amtAfterCommisionPaidToKitchen,
                            orderCommission,
                        });
                        orderNoList.push(order.orderNo);
                        resolve();
                    });
                    promiseArr.push(loopPromise);
                });
            }
            await Promise.all(promiseArr);
            if (kitchenId && orderNoList.length > 0) {
                await updateServerFoodOrder(server, ordersToUpdateWhilePayingKitchen);
                const kitchenDetails = {
                    kitchenId: kitchenId,
                    kitchenName: kitchenName,
                    totalAmtAfterCommisionPaidToKitchen: totalAmtAfterCommisionPaidToKitchen,
                    orderNoList: orderNoList
                }
                await getAndUpdateupdateKichenWalletballance(kitchenDetails);
            }
        } else if (server == 'DD') {
            const commissionPercentage = await getkitchenCommisionPercentage();
            if (orderlist && orderlist.length > 0) {
                orderlist.forEach(order => {
                    const loopPromise = new Promise(async (resolve, reject) => {
                        // console.log('order.amtPaidToKitchen',order.amtPaidToKitchen);
                        if (!order.amtPaidToKitchen) {
                            let price = 0;
                            const kitchenDiscount = order.kitchenDiscount ? order.kitchenDiscount : 0;
                            let amoutToPayKitchen = order.itemAmount;
                            if (order.orderType === 'subscription') {
                                let currentMonthCount = await getDDcurrentMonthCount(server, order.kitchenId);
                                if (currentMonthCount.currentMonthCount > 40) {
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
            // console.log('orderNoList promiseArr ',orderNoList.length)
            if (kitchenId && orderNoList.length > 0) {
                await updateServerFoodOrder(server, ordersToUpdateWhilePayingKitchen);
                ledgerObjList.forEach(async (ledgerObj) => {
                    await createKitchenLedger(ledgerObj);
                });
            }
        }
    }
    catch (e) {
        console.log('error while payServerFoodOrderAmtToKitchenDirect ', e)
    }
}

const getAndUpdateupdateKichenWalletballance = async (kitchenDetails) => {
    const { kitchenId, kitchenName, totalAmtAfterCommisionPaidToKitchen } = kitchenDetails;
    if (kitchenId && kitchenName && totalAmtAfterCommisionPaidToKitchen) {
        const wallet = await getKitchenWallet(kitchenId);
        if (wallet) {
            const transactionHistoryObj = {
                status: 'inprogress',
                mode: 'wallet',
                transaction_amount: totalAmtAfterCommisionPaidToKitchen,
                created_at: new Date(),
                kitchenId: kitchenId,
                kitchenName: kitchenName,
                wallet_balance: wallet.wallet_balance,
                transactionType: 'Credit',
                remark: `order no. ${kitchenDetails.orderNoList.join(', ')} amount`
            };
            // console.log('payAmtToKitchen transactionHistoryObj ',transactionHistoryObj);
            const kitchenTransactionHistory = await saveKitchenTransactionHistory(transactionHistoryObj);
            await depositeWalletBalance(kitchenId, totalAmtAfterCommisionPaidToKitchen);
            await updatedKitchenTransactionHistory(kitchenTransactionHistory._id, 'completed')
            sendTransactionFcmMessage('kitchen_credit', totalAmtAfterCommisionPaidToKitchen, kitchenId, 'KITCHEN');
            //send fcm to kitchen
        }
    }
}

const getDDcurrentMonthCount = async (server, KitchenId) => {
    try {
        if (server === 'DD') {
            const body = {
                urlQuery: `getAssignedMontlyOrders/${KitchenId}`,
                method: 'GET'
            }
            return await utilService.accessDeskDyneData(body);
        }
    }
    catch (e) {
    }
}

// In your payment utility file, add this function
// const getCommissionPercentage = async (orderType) => {
//     const defaultCommission = await getkitchenCommisionPercentage(); // Existing function

//     // Use apartment commission if order type is apartment, otherwise use default
//     if (orderType === 'apartment') {
//         return global.APARTMENT_COMMISSION || process.env.APARTMENT_COMMISSION || defaultCommission;
//     }

//     return defaultCommission;
// }

let APARTMENT_TODAY_COMMISSION;
let APARTMENT_ADVANCE_COMMISSION;

const getApartmentTodayCommission = async () => {
    if (APARTMENT_TODAY_COMMISSION !== undefined) {
        return APARTMENT_TODAY_COMMISSION;
    }

    const config = await getOneVariable('APARTMENT_TODAY_COMMISSION');
    if (config && config.configData) {
        APARTMENT_TODAY_COMMISSION = parseFloat(config.configData);
    } else {
        APARTMENT_TODAY_COMMISSION = parseFloat(process.env.APARTMENT_TODAY_COMMISSION || 0);
    }

    return APARTMENT_TODAY_COMMISSION;
};

const getApartmentAdvanceCommission = async () => {
    if (APARTMENT_ADVANCE_COMMISSION !== undefined) {
        return APARTMENT_ADVANCE_COMMISSION;
    }

    const config = await getOneVariable('APARTMENT_ADVANCE_COMMISSION');
    if (config && config.configData) {
        APARTMENT_ADVANCE_COMMISSION = parseFloat(config.configData);
    } else {
        APARTMENT_ADVANCE_COMMISSION = parseFloat(process.env.APARTMENT_ADVANCE_COMMISSION || 0);
    }

    return APARTMENT_ADVANCE_COMMISSION;
};


const payServerBulkFoodOrderAmtToKitchenDirect = async (orderNos, server) => {
    let totalAmtAfterCommisionPaidToKitchen = 0;
    let kitchenId;
    let kitchenName;
    let orderNoList = [];
    const ledgerObjList = [];
    const ordersToUpdateWhilePayingKitchen = [];
    const promiseArr = [];
    const orderlist = await getServerFoodOrderList(server, orderNos);
    try {
        if (server !== 'DDDaily' && server !== 'DDBulk' && server !== 'DD') {
            const commissionPercentage = await getkitchenCommisionPercentage();

            const [
                kitchenCommission,
                apartmentTodayCommission,
                apartmentAdvanceCommission] = await Promise.all([getkitchenCommisionPercentage(), getApartmentTodayCommission(), getApartmentAdvanceCommission()]);
                
                const getCommission = (orderType) => {
                if (orderType === 'apartment_today') {
                    return apartmentTodayCommission;
                }
                if (orderType === 'apartment_advance' && orderType === 'apartmentBulk') {
                    return apartmentAdvanceCommission;
                }
                return kitchenCommission;
            };

            if (orderlist && orderlist.length > 0) {
                orderlist.forEach(order => {
                    const loopPromise = new Promise(async (resolve, reject) => {
                        // console.log('order.amtPaidToKitchen',order.amtPaidToKitchen);
                        if (!order.amtPaidToKitchen) {
                            const commissionPercentage = getCommission(order.orderType);


                            let price = 0;
                            const kitchenDiscount = order.kitchenDiscount ? order.kitchenDiscount : 0;
                            let amoutToPayKitchen = order.itemAmount;
                            if (order.orderType === 'subscription') {
                                let currentMonthCount = await foodOrderDao.getAssignedMontlyOrders(order.kitchenId);
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
                            if (order.orderType === 'apartment_today' && order.orderType === 'apartment_advance' && order.orderType === 'apartmentBulk') {
                                // amtAfterCommisionPaidToKitchen += amtAfterCommisionPaidToKitchen
                            }
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
                await updateServerFoodOrder(server, ordersToUpdateWhilePayingKitchen);
                ledgerObjList.forEach(async (ledgerObj) => {
                    await createKitchenLedger(ledgerObj);
                });
                sendTransactionFcmMessage('kitchen_credit', totalAmtAfterCommisionPaidToKitchen, kitchenId, 'KITCHEN');
            }
        } 
    }
    catch (e) {
        console.log('error while payServerFoodOrderAmtToKitchenDirect ', e)
    }
}



module.exports = {
    updateServerOrderDeliveryPrice,
    getServerFoodOrderList,
    updateServerFoodOrderStatus,
    payServerFoodOrderAmtToKitchenDirect,
    payServerBulkFoodOrderAmtToKitchenDirect
}