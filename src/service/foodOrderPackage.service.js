const dao = require('../dao/foodOrderPackage.dao');
const foodOrderdao = require('../dao/foodorder.dao');
const { saveMultipleOrders, updateFoodOrderDate, updateFoodMealType, getAssignedMontlyOrders } = require('../dao/foodorder.dao')
const counterDao = require('../dao/counters.dao');
const { sendFcmMessage, sendGenericFcmMessage } = require('../util/fcm-message-handler');
const { deductMoneyPointsFromWallet, addMoneyPointsInWallet, createCashBack, updatedCashBack } = require('../util/user-wallet-util');
const { checkUserFirstOrderReward } = require('../util/reward-points-util');
const { getLocalDate, getTodayStartTime, getLocalMidDate,changeToLocalDate } = require('../util/date-util');
const { checkRefundEligibility } = require('../util/payment-validation-util');
const { callTreePlantAPI } = require('../util/grow-billion-tree-util');
const { checkLatLngInCluster } = require('../util/google-map-api-util');
const { getCustomerProfile, updateRMInfo } = require('./customerProfile.service');
const { serverLog } = require('../util/firebasedb-util');
const { sendOrderWhatsappMsg } = require('../util/thinkowl-util');

const getISTDateParts = (date) => {
    const istString = new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    return {
        date: istDate.getDate(),
        month: istDate.getMonth(),
        year: istDate.getFullYear()
    };
};

const isSameDayIST = (d1, d2) => {
    const p1 = changeToLocalDate(d1);
    const p2 = changeToLocalDate(d2);
    return (
        p1.getDate() === p2.getDate() &&
        p1.getMonth() === p2.getMonth() &&
        p1.getFullYear() === p2.getFullYear()
    );
};
const saveOrderPackage = async (foodOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const foodOrderNo = await counterDao.getNextSequenceValue('Food_Order_Package_No');
            foodOrder.orderNo = 'MEAL' + parseInt(foodOrderNo);
            const clusterObj = await checkLatLngInCluster(foodOrder.customerLocation.geolocation);
            // console.log('saveOrderPackage clusterObj',clusterObj);     
            if (clusterObj) {
                foodOrder.clusterId = clusterObj.clusterId;
                foodOrder.clusterName = clusterObj.clusterName;
            }
            const customerProfile = await getCustomerProfile(foodOrder.customerId);
            if (customerProfile && customerProfile.rmInfo) {
                foodOrder.rmInfo = customerProfile.rmInfo;
            }
            // console.log('saveOrderPackage clusterObj1',foodOrder.clusterId,foodOrder.clusterName);                 
            const newFoodOrder = await dao.saveOrderPackage(foodOrder);
            resolve(newFoodOrder);
        }
        catch (e) {
            reject(e);
        }
    });
}

const updateOrderPackage = async (foodOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('updateOrderPackage 1');
            const updatedFoodOrder = await dao.updateOrderPackage(foodOrder);
            // console.log('updateOrderPackage 1.1');
            try {
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'placed') {
                    checkUserFirstOrderReward(updatedFoodOrder);
                    serverLog('updateOrderPackage placed 2');
                    console.log('updateOrderPackage placed 2');
                    if (updatedFoodOrder.moneyWalletPointsUsed) {
                        deductMoneyPointsFromWallet(updatedFoodOrder.customerId, updatedFoodOrder.customerName, updatedFoodOrder.moneyWalletPointsUsed,
                            `Points redeemed on subscription order no. ${updatedFoodOrder.orderNo}`);
                    }
                    if (updatedFoodOrder.mealaweWalletPointsUsed && updatedFoodOrder.mealaweWalletPointsUsed > 0) {
                        // deductMealawePointsFromWallet(updatedFoodOrder.customerId,updatedFoodOrder.customerName,updatedFoodOrder.mealaweWalletPointsUsed,
                        //     `Mealawe points redeemed on order no. ${updatedFoodOrder.orderNo}`);
                        updatedCashBack(updatedFoodOrder.customerId, updatedFoodOrder.orderNo, updatedFoodOrder.mealaweWalletPointsUsed);
                    }
                    if (foodOrder.treePlantationOpted) {
                        callTreePlantAPI(foodOrder);
                    }
                    try {
                        sendOrderWhatsappMsg('ORDER_CREATED', {
                            order: {
                                orderNo: updatedFoodOrder.orderNo,
                                ItemName: updatedFoodOrder.mealPackage.packageName
                            },
                            customer: {
                                customerName: updatedFoodOrder.customerName,
                                customerMobile: updatedFoodOrder.customerPhoneNo,
                            }
                        }).catch(err => serverLog('sendOrderWhatsappMsg ORDER_CREATED error:', err));
                    } catch (error) {
                        console.log(error);
                        serverLog('updateOrderPackage=>',error);
                    }
                    // console.log('updateOrderPackage placed 3');
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'accepted') {
                    sendFcmMessage(updatedFoodOrder.orderstatus, updatedFoodOrder.orderNo, updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && updatedFoodOrder.orderstatus === 'refundCompleted') {
                    sendGenericFcmMessage(`Amount Rs.${updatedFoodOrder.refund_amount} of order no. ${updatedFoodOrder.orderNo} has been refunded to your bank account`,
                        updatedFoodOrder.customerId, 'USER');
                }
                if (updatedFoodOrder && (updatedFoodOrder.orderstatus === 'cancelledByKitchen'
                    || updatedFoodOrder.orderstatus === 'rejectedByKitchen')) {
                    serverLog('updateOrderSubscription cancelled 3')
                    autoRefundOnPackage(updatedFoodOrder);
                }
            } catch (e) {
                serverLog('error while sending notification to kitchen partner ',e);
                reject(e);
            }
            resolve(updatedFoodOrder);
        }
        catch (e) {
            serverLog('error while updating food order ',e);
            reject(e);
        }
    });
}

const autoRefundOnPackage = async (foodOrder, autoCancel) => {
    try {
        // console.log('autoRefundOnPackage 1')
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
            await dao.updateOrderPackage(foodOrder,true);
            // console.log('autoRefundOnPackage 2')   
            sendFcmMessage(foodOrder.orderstatus, foodOrder.orderNo, foodOrder.customerId, 'USER');
            // need to change here    
            let mealawePoinstUsed = 0;
            if (foodOrder.mealaweWalletPointsUsed) {
                mealawePoinstUsed = foodOrder.mealaweWalletPointsUsed;
                // addMealawePointsInWallet(foodOrder.customerId,foodOrder.customerName,mealawePoinstUsed,
                //     `Mealawe points added on refund of order no. ${foodOrder.orderNo}`);
                createCashBack(foodOrder.customerId, foodOrder.customerName, foodOrder.customerPhoneNo, foodOrder.customerEmail,
                    mealawePoinstUsed, `Cashback on refund of order no. ${foodOrder.orderNo}`);
                // console.log('autoRefundOnPackage mealawe points added',foodOrder.orderNo);
            }
            refund_amount = refund_amount - mealawePoinstUsed;
            addMoneyPointsInWallet(foodOrder.customerId, foodOrder.customerName, refund_amount,
                `Points added on refund of order no. ${foodOrder.orderNo}`);
            // console.log('autoRefundOnPackage completed ',foodOrder.orderNo);
        }
    }
    catch (e) {
        // console.log('autoRefundOnPackage error => ',e)
    }
}



const getOrderPackage = async (id) => {
    return dao.getOrderPackage(id);
}
const getCustomerPackageList = async (customerId, page) => {
    return dao.getCustomerPackageList(customerId, page);
}
const getKitchenSubDashboardCount = async (kitchenId, onlyCount) => {
    return dao.getKitchenSubDashboardCount(kitchenId, onlyCount);
}

const checkSubOrderValidForKitchen = async (id, currentStatus) => {
    return new Promise(async (resolve, reject) => {
        try {
            const statusObj = { valid: false, orderstatus: currentStatus };
            const foodOrder = await dao.getOrderPackage(id);
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

const createDailyPackageOrder = async (packageOrder) => {
    return new Promise(async (resolve, reject) => {
        try {
            const savedPackageOrder = await dao.getOrderPackageByOrderNo(packageOrder.orderNo);
            // check of already saved daily order
            const savedDailyOrder = await foodOrderdao.findDailyOrders(packageOrder.orderNo);
            if (savedDailyOrder && savedDailyOrder.length > 0) {
                savedDailyOrder.forEach(dbOrder => {
                    packageOrder.dailyOrderList.push({
                        ...dbOrder,
                        foodOrderId: dbOrder._id
                    });
                });
                const updatedOrder = await dao.updateOrderAfterDailyOrderCreated(packageOrder);
                resolve(updatedOrder);
            } else if (savedPackageOrder && savedPackageOrder.dailyOrderList && savedPackageOrder.dailyOrderList.length > 0) {
                resolve(savedPackageOrder);
            } else {
                const dailyOrderList = [];
                let startDate;
                if (packageOrder.subscriptionStartDate) {
                    // startDate = changeToLocalDate(packageOrder.subscriptionStartDate);
                    startDate = getLocalMidDate(packageOrder.subscriptionStartDate);
                }

                const totalMealdays = packageOrder.mealPackage.days;
                const deliveryOnWeekends = packageOrder.mealPackage.deliveryOnWeekends;
                const multiDateAllowed = packageOrder.multiDateAllowed;
                const userSelectedDates = packageOrder.userSelectedDates;
                const totalsubscriptionDays = packageOrder.subscriptionDays;
                let isTrial = false;
                let totaldays = totalMealdays;
                if (totalsubscriptionDays > totalMealdays) {
                    totaldays = totalsubscriptionDays;
                }
                // // console.log('createDailyPackageOrder1 ', totaldays,totalsubscriptionDays , totalMealdays); 
                let dailyTaxes, dailyCgst, dailySgst, dailyPlatformCharges, cutleryDiscount, ecoFriendlyPackagingCharges, subscriptionDeliveryCharges, dailyAmountPaid, dailyVoucherDiscount = 0, dailyMoneyWalletPointsUsed = 0, dailyMealaweWalletPointsUsed = 0;
                let mealCount = 1;
                if (packageOrder.mealTimeLunch && packageOrder.mealTimeDinner) {
                    mealCount = 2;
                }
                if (packageOrder.mealPackage.packageSubCategory === 'Trial') {
                    isTrial = true;
                }
                if (packageOrder.voucherCode) {
                    dailyVoucherDiscount = parseFloat((packageOrder.voucherDiscount / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.couponCode) {
                    dailyCouponDiscount = parseFloat((packageOrder.couponDiscount / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.moneyWalletPointsUsed) {
                    dailyMoneyWalletPointsUsed = parseFloat((packageOrder.moneyWalletPointsUsed / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.mealaweWalletPointsUsed) {
                    dailyMealaweWalletPointsUsed = parseFloat((packageOrder.mealaweWalletPointsUsed / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.dontSendCutlery) {
                    cutleryDiscount = (packageOrder.cutleryDiscount / (totaldays * mealCount)).toFixed(2);
                }
                if (packageOrder.platformCharges) {
                    dailyPlatformCharges = parseFloat((packageOrder.platformCharges / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.platformChargesDiscount) {
                    platformChargesDiscount = parseFloat((packageOrder.platformChargesDiscount / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.subscriptionDeliveryCharges) {
                    subscriptionDeliveryCharges = parseFloat((packageOrder.subscriptionDeliveryCharges / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.subscriptionDeliveryChargesDiscount) {
                    subscriptionDeliveryChargesDiscount = parseFloat((packageOrder.subscriptionDeliveryChargesDiscount / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.ecoFriendlyPackagingCharges) {
                    ecoFriendlyPackagingCharges = parseFloat((packageOrder.ecoFriendlyPackagingCharges / (totaldays * mealCount)).toFixed(2));
                }
                dailyAmountPaid = parseFloat(((packageOrder.amount + dailyMoneyWalletPointsUsed + dailyMealaweWalletPointsUsed) / (totaldays * mealCount)).toFixed(2));
                dailyTaxes = parseFloat((packageOrder.taxes / (totaldays * mealCount)).toFixed(2));
                if (isNaN(dailyTaxes)) {
                    dailyTaxes = 0;
                }
                if (packageOrder.cgst) {
                    dailyCgst = parseFloat((packageOrder.cgst / (totaldays * mealCount)).toFixed(2));
                }
                if (packageOrder.sgst) {
                    dailySgst = parseFloat((packageOrder.sgst / (totaldays * mealCount)).toFixed(2));
                }

                for (let i = 0, j = 0; i < totaldays; i++, j++) {
                    let deliveryDate;
                    if (multiDateAllowed && userSelectedDates) {
                        deliveryDate = new Date(userSelectedDates[j]);
                    } else {
                        deliveryDate = new Date((new Date(startDate)).setDate(startDate.getDate() + j));
                    }

                    const day = deliveryDate.getDay() + 1;
                    let itemDescription;
                    let itemType;
                    let addWeekendOrder = false;
                    itemType = packageOrder.mealPackage.packageType;
                    if (packageOrder.mealPackage.packageType === 'Veg') {
                        itemDescription = packageOrder.mealPackage.vegMealDescription;
                    } else if (packageOrder.mealPackage.packageType === 'NonVeg') {
                        itemDescription = packageOrder.mealPackage.nonVegMealDescription;
                    }
                    const addonList = [];
                    let payToKitchenPerMeal = packageOrder.mealPackage.payToKitchenPerMeal;
                    let firstslotPrice = packageOrder.mealPackage.payToKitchenPerMeal;
                    let secondslotPrice = packageOrder.mealPackage.payToKitchenPerMeal2;

                    let itemAmountPerMeal = payToKitchenPerMeal;
                    let addonAmountPerMeal = 0;

                    let giveSweet = false;
                    let dailyNonVeg = false;
                    packageOrder.mealPackage.addonsList.forEach(addon => {

                        if (addon.selected) {
                            if (addon.daily) {
                                addonAmountPerMeal = addonAmountPerMeal + addon.payKitchenExtraPerMeal;
                                delete addon?.showKitchen;
                                addonList.push({
                                    addOnName: addon.addonName,
                                    imageUrl: undefined,
                                    count: packageOrder.mealPackage.count,
                                    addOnPrice: addon.payKitchenExtraPerMeal,
                                    hidetoKitchen: addon.hidetoKitchen ? addon.hidetoKitchen : false,
                                    addOnType: undefined,
                                    mealawePrice: 0
                                });
                                if (addon.addOnType === 'Sweet') {
                                    itemDescription += ' with Sweet';
                                    giveSweet = true;
                                }
                                if (addon.addOnType === 'NonVeg') {
                                    itemDescription = packageOrder.mealPackage.nonVegMealDescription;
                                    itemType = addon.addOnType;
                                    dailyNonVeg = true;
                                }
                            } else if (addon.day === day) {
                                // // console.log('addon day',day,addon.day,deliveryOnWeekends); 
                                if ((addon.day === 1 || addon.day === 7) && !deliveryOnWeekends) {
                                    addWeekendOrder = true;
                                    // // console.log('addon day weekend',day,addon.day,deliveryOnWeekends);                            
                                }
                                if (addon.addOnType === 'Veg') {
                                    itemDescription = packageOrder.mealPackage.vegMealDescription;
                                    itemType = addon.addOnType;
                                } else if (addon.addOnType === 'NonVeg') {
                                    itemDescription = packageOrder.mealPackage.nonVegMealDescription;
                                    itemType = addon.addOnType;
                                }
                                if (dailyNonVeg) {
                                    itemDescription = packageOrder.mealPackage.nonVegMealDescription;
                                    itemType = 'NonVeg';
                                }
                                if (giveSweet) {
                                    itemDescription += ' with Sweet';
                                }
                                addonAmountPerMeal = addonAmountPerMeal + addon.payKitchenExtraPerMeal;
                            }
                        }
                    });
                    const foodOrder = {};
                    foodOrder.subOrderId = Math.ceil(Math.random() * 10000);
                    foodOrder.orderDate = getLocalMidDate(deliveryDate);
                    foodOrder.itemAmount = (payToKitchenPerMeal + addonAmountPerMeal) * packageOrder.mealPackage.count;
                    foodOrder.amount = dailyAmountPaid;
                    foodOrder.deliveryCharges = 0;
                    foodOrder.taxes = dailyTaxes;
                    foodOrder.cgst = dailyCgst;
                    foodOrder.sgst = dailySgst;
                    foodOrder.platformCharges = dailyPlatformCharges;
                    foodOrder.subscriptionDeliveryCharges = subscriptionDeliveryCharges;
                    foodOrder.ecoFriendlyPackagingCharges = ecoFriendlyPackagingCharges;
                    foodOrder.cutleryDiscount = cutleryDiscount;
                    foodOrder.discount = 0;
                    foodOrder.isTrial = isTrial;
                    foodOrder.kitchenDiscount = 0;
                    foodOrder.moneyWalletPointsUsed = dailyMoneyWalletPointsUsed;
                    foodOrder.mealaweWalletPointsUsed = dailyMealaweWalletPointsUsed;
                    foodOrder.specialRequest = packageOrder.specialRequest;
                    foodOrder.deliveryPartnerInstruction = packageOrder.deliveryPartnerInstruction;
                    foodOrder.specialInstruction = packageOrder.specialInstruction;
                    foodOrder.nonContactDelivery = false;
                    // foodOrder.subscriptionSlot = order.subscriptionSlot;                    
                    foodOrder.customerId = packageOrder.customerId;
                    foodOrder.customerName = packageOrder.customerName;
                    foodOrder.customerLocation = packageOrder.customerLocation;
                    foodOrder.customerName = packageOrder.customerName;
                    foodOrder.customerLocation = packageOrder.customerLocation;
                    foodOrder.customerEmail = packageOrder.customerEmail;
                    foodOrder.customerPhoneNo = packageOrder.customerPhoneNo;
                    foodOrder.kitchenId = packageOrder.kitchenId;
                    foodOrder.kitchenName = packageOrder.kitchenName;
                    foodOrder.kitchenPhoneNo = packageOrder.kitchenPhoneNo;
                    foodOrder.kitchenAddress = packageOrder.kitchenAddress;
                    foodOrder.kitchenGeolocation = packageOrder.kitchenGeolocation;
                    foodOrder.deliveryByMealaweBoy = packageOrder.deliveryByMealaweBoy;
                    foodOrder.skipWalletPayment = packageOrder.skipWalletPayment;
                    foodOrder.orderCreatedBy = packageOrder.orderCreatedBy;
                    foodOrder.deliveryVendor = '';
                    foodOrder.subscriptionLunchSlot = packageOrder.subscriptionLunchSlot;
                    foodOrder.subscriptionDinnerSlot = packageOrder.subscriptionDinnerSlot;
                    foodOrder.subscriptionBreakfastSlot = packageOrder.subscriptionBreakfastSlot;
                    foodOrder.dontSendCutlery = packageOrder.dontSendCutlery ? packageOrder.dontSendCutlery : false;
                    foodOrder.orderType = 'subscription';
                    foodOrder.orderstatus = 'accepted';
                    foodOrder.feedbackProvided = false;
                    foodOrder.startManualDelivery = true;
                    foodOrder.itemList = [{
                        itemName: packageOrder.mealPackage.packageName,
                        imageUrl: undefined,
                        count: packageOrder.mealPackage.count,
                        itemPrice: itemAmountPerMeal,
                        itemType: itemType,
                        itemDescription: itemDescription,
                        itemIsCombo: true,
                        itemIsBreakfast: false,
                        mealawePrice: 0
                    }];
                    foodOrder.addOns = addonList;
                    foodOrder.subscriptionMasterId = packageOrder._id;
                    foodOrder.subscriptionMasterOrderId = packageOrder.orderNo;
                    foodOrder.packageName = packageOrder.mealPackage.packageName;
                    foodOrder.packageCategory = packageOrder.mealPackage.packageCategory;
                    foodOrder.packageSubCategory = packageOrder.mealPackage.packageSubCategory;
                    if (firstslotPrice) {
                        foodOrder.payToKitchenPerMealWithAddon = (firstslotPrice + addonAmountPerMeal) * packageOrder.mealPackage.count;
                    }
                    if (secondslotPrice) {
                        foodOrder.payToKitchenPerMealWithAddon2 = (secondslotPrice + addonAmountPerMeal) * packageOrder.mealPackage.count;
                    }

                    // foodOrder.subscriptionChildId = order._id;
                    foodOrder.distance = 0;
                    foodOrder.mealaweDeliveryDiscount = 0;
                    foodOrder.mealaweItemDiscount = 0;
                    foodOrder.mealaweTotalAmt = dailyAmountPaid;
                    foodOrder.mealaweKitchenDiscount = 0;
                    if (packageOrder.voucherCode) {
                        foodOrder.voucherCode = packageOrder.voucherCode;
                        foodOrder.voucherDiscount = dailyVoucherDiscount;
                    } else {
                        foodOrder.voucherDiscount = 0;
                    }
                    if (packageOrder.couponCode) {
                        foodOrder.couponCode = packageOrder.couponCode;
                        foodOrder.couponDiscount = dailyCouponDiscount;
                    } else {
                        foodOrder.couponDiscount = 0;
                    }

                    foodOrder.extraDiscount = 0;
                    foodOrder.skipCommission = true;
                    foodOrder.clusterId = packageOrder.clusterId;
                    foodOrder.clusterName = packageOrder.clusterName;
                    foodOrder.routeNo = packageOrder.routeNo;
                    foodOrder.routeRank = packageOrder.routeRank;
                    foodOrder.rmInfo = packageOrder.rmInfo;
                    let inserOrder = false;
                    if (!packageOrder.multiDateAllowed) {
                        if (deliveryOnWeekends) {
                            inserOrder = true;
                        } else {
                            if (day === 1 || day === 7) {
                                if (addWeekendOrder) {
                                    inserOrder = true;
                                } else {
                                    i--;
                                }
                            } else {
                                inserOrder = true;
                            }
                        }
                    }

                    if (inserOrder || packageOrder.multiDateAllowed) {
                        if (packageOrder.mealTimeLunch) {
                            dailyOrderList.push({ ...foodOrder, mealType: 'Lunch', routeNo: packageOrder.LunchrouteNo ? packageOrder.LunchrouteNo : packageOrder.routeNo, routeRank: packageOrder.LunchrouteRank ? packageOrder.LunchrouteRank : packageOrder.routeRank });
                        }
                        if (packageOrder.mealTimeDinner) {
                            dailyOrderList.push({ ...foodOrder, mealType: 'Dinner', routeNo: packageOrder.DinnerrouteNo ? packageOrder.DinnerrouteNo : packageOrder.routeNo, routeRank: packageOrder.DinnerrouteRank ? packageOrder.DinnerrouteRank : packageOrder.routeRank });
                        }
                        if (packageOrder.mealTimeBreakfast) {
                            dailyOrderList.push({ ...foodOrder, mealType: 'Breakfast' });
                        }
                    }
                }

                const updatedOrderList = await createFoodOrderTosave(dailyOrderList, 0);
                packageOrder.dailyOrderList = updatedOrderList;
                const dbOrderList = await saveMultipleOrders(updatedOrderList);
                dbOrderList.forEach(dbOrder => {
                    packageOrder.dailyOrderList.forEach(order => {
                        serverLog(`dbOrder.orderNo === order.orderNo`, dbOrder.orderNo, order.orderNo);
                        if (dbOrder.orderNo == order.orderNo) {
                            order.foodOrderId = dbOrder._id;
                        }
                    })
                });
                const updatedOrder = await dao.updateOrderAfterDailyOrderCreated(packageOrder);
                resolve(updatedOrder);

                // packageOrder.dailyOrderList = updatedOrderList;
                // resolve(packageOrder);
            }
        } catch (e) {
            // console.log('error while createDailyPackageOrder ',e);
            reject(e);
        }
    });
}

const createFoodOrderTosave = async (orders, index) => {
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

const getKitchenPastPackageOrders = async (kitchenId, page) => {
    return dao.getKitchenPastPackageOrders(kitchenId, page);
}
const getCurrentPackageCount = async () => {
    return dao.getCurrentPackageCount();
}
const getClusterCurrentPackageCount = async (clusterList) => {
    return dao.getCurrentPackageCount(clusterList);
}

const getCurrentPackageOrdersList = async (status, page, limit, clusterList) => {
    return dao.getCurrentPackageOrdersList(status, page, limit, clusterList);
}

const resechedulePackageOrder = async (subscriptionOrderId, foodOrderId, orderDate, body) => {
    const updatedOrder = await updateFoodOrderDate(foodOrderId, orderDate, body);
    if(!body){
        body={orderNo:updatedOrder.orderNo}
    }else{
        body.orderNo=updatedOrder.orderNo;
    }
    await dao.updatePackageFoodOrderDate(subscriptionOrderId, foodOrderId, orderDate, body);
    return updatedOrder;
}
const changeMealTypePackageOrder = async (subscriptionOrderId, foodOrderId, mealType, slot,body) => {
    // console.log(subscriptionOrderId,foodOrderId,mealType,slot,'foodorderpackageservice')
    const updatedOrder = await updateFoodMealType(foodOrderId, mealType, slot,null,body);
    // console.log(updatedOrder)
    await dao.updatePackageFoodMealType(subscriptionOrderId, foodOrderId, mealType);   // As per QA 
    return updatedOrder;
}


const changeMealTypeAndDatePackageOrder = async (subscriptionOrderId, foodOrderId, mealType, slot, orderDate, body) => {
    try {
        const order = await foodOrderdao.getFoodOrder(foodOrderId);
        const today = new Date();
        const orderDateObj = new Date(order.orderDate);
        const rescheduleToDate = new Date(orderDate);
        
        // Today's Dinner → block meal type change ONLY if target date is also today
        // If target is a future date → meal type is free (Lunch or Dinner allowed)
        if (
            isSameDayIST(orderDateObj, today) &&
            order.mealType === 'Dinner' &&
            mealType !== 'Dinner' &&
            isSameDayIST(rescheduleToDate, today)
        ) {
            console.log('❌ Today Dinner meal type cannot be changed when rescheduling to today');
            return {};
        }

        const orderValid = await checkForRescheduleValidity(foodOrderId, orderDate, mealType, body);

        if (orderValid) {
            const updatedOrder = await updateFoodMealType(foodOrderId, mealType, slot, orderDate, body);
            await dao.changeMealTypeAndDatePackageOrder(subscriptionOrderId, foodOrderId, mealType, orderDate, body);
            return updatedOrder;
        } else {
            return {};
        }
    } catch (error) {
        console.log('changeMealTypeAndDatePackageOrder error =>', error);
        return {};
    }
};

// const checkForRescheduleValidity = async (foodOrderId,newDate) =>{
//     let valid = true;
//     try {
//         const today = new Date();
//         rescheduleDate = new Date(newDate);
//         const order = await foodOrderdao.getFoodOrder(foodOrderId);
//         orderDate = new Date(order.orderDate);
//         if(rescheduleDate.getDate() === today.getDate() || orderDate.getDate() === today.getDate()){
//             valid = false;
//         }
//         return valid;
//     } catch (error) {
//         valid = false;
//         return valid;
//     }
// }

const checkForRescheduleValidity = async (foodOrderId, newDate, mealType, body) => {
    try {
        const currentTime = new Date();
        const rescheduleDate = new Date(newDate);
        const order = await foodOrderdao.getFoodOrder(foodOrderId);
        const orderDate = new Date(order.orderDate);

        // Cannot reschedule TO today
        // ✅ NEW: if rescheduling TO today, only Dinner is allowed
        if (isSameDayIST(rescheduleDate, currentTime)) {
        if (mealType !== 'Dinner') {
            console.log('❌ Can only reschedule to today as Dinner');
            return false;
        }
        // Also check it's before cutoff
        const rescheduleCutoffTime = body && body.rescheduleCutoffTime;
        if (rescheduleCutoffTime) {
            const [cutoffHour, cutoffMinute] = rescheduleCutoffTime.split(':').map(Number);
            const istNow = changeToLocalDate(currentTime);
            const isPastCutoff =
            istNow.getHours() > cutoffHour ||
            (istNow.getHours() === cutoffHour && istNow.getMinutes() >= cutoffMinute);
            if (isPastCutoff) {
            console.log('❌ Past cutoff time for today reschedule');
            return false;
            }
        }
        // ✅ valid — tomorrow's order going to today as Dinner before cutoff
        console.log('✅ Rescheduling tomorrow order to today as Dinner — valid');
        return true; // skip the "cannot reschedule to today" block that was here before
        }

        // Today's Lunch — rescheduling is not allowed
        if (isSameDayIST(orderDate, currentTime) && order.mealType === 'Lunch') {
            console.log('❌ Today Lunch cannot be rescheduled');
            return false;
        }

        // Tomorrow's order — apply 10 PM IST cutoff
         // ✅ Today's order — check cutoff time
        if (isSameDayIST(orderDate, currentTime)) {
            const rescheduleCutoffTime = body && body.rescheduleCutoffTime;
            if (rescheduleCutoffTime) {
                const [cutoffHour, cutoffMinute] = rescheduleCutoffTime.split(':').map(Number);

                // Compare in IST
                const istNow = changeToLocalDate(currentTime);
                const currentHour = istNow.getHours();
                const currentMinute = istNow.getMinutes();

                const isPastCutoff =
                    currentHour > cutoffHour ||
                    (currentHour === cutoffHour && currentMinute >= cutoffMinute);

                if (isPastCutoff) {
                    console.log(`❌ Past cutoff time ${rescheduleCutoffTime} IST`);
                    return false;
                }
            }
        }

        // Tomorrow's order — apply 10 PM IST cutoff
        const tomorrowIST = changeToLocalDate(new Date(currentTime.getTime() + 24 * 60 * 60 * 1000));
        const orderDateIST = changeToLocalDate(orderDate);

        const isOrderTomorrow =
            tomorrowIST.getDate() === orderDateIST.getDate() &&
            tomorrowIST.getMonth() === orderDateIST.getMonth() &&
            tomorrowIST.getFullYear() === orderDateIST.getFullYear();

        if (isOrderTomorrow) {
            const istNow = changeToLocalDate(currentTime);
            if (istNow.getHours() >= 22) {
                console.log('❌ Past 10 PM IST cutoff for tomorrow order');
                return false;
            }
        }

        console.log('✅ Reschedule is valid');
        return true;
    } catch (error) {
        console.log('checkForRescheduleValidity error =>', error);
        return false;
    }
};

const checkRescheduleConflict = async (packageOrderId, date, mealType) => {
    try {
        const packageOrder = await dao.getOrderPackage(packageOrderId);
        if (!packageOrder || !packageOrder.dailyOrderList) return { conflict: false };

        // Works for both "2026-04-08" and full ISO strings
        const targetDateStr = date.split('T')[0]; // Always take just the date part

        const hasConflict = packageOrder.dailyOrderList.some(order => {
            const oDate = new Date(order.orderDate);
            
            // Use UTC date parts to avoid timezone shift on stored MongoDB dates
            const oYear = oDate.getUTCFullYear();
            const oMonth = String(oDate.getUTCMonth() + 1).padStart(2, '0');
            const oDay = String(oDate.getUTCDate()).padStart(2, '0');
            const oDateStr = `${oYear}-${oMonth}-${oDay}`;

            const isSameDay = oDateStr === targetDateStr;
            const isCancelled = ['cancelled', 'cancelledByKitchen', 'rejectedByKitchen', 'autoCancelled']
                .includes(order.orderstatus);

            return isSameDay && order.mealType === mealType && !isCancelled;
        });

        return { conflict: hasConflict };

    } catch (error) {
        throw error;
    }
};


const performPackageOrderTransfer = async (tranferredOrder) => {
    const order = await dao.performPackageOrderTransfer(tranferredOrder);
    if (order && order._id) {
        try {
            sendGenericFcmMessage(`Order no. ${order.orderNo} has been transferred to your kitchen`, order.kitchenId, 'KITCHEN');
        } catch (error) {
            // console.log('Error while sending generic message on order transfer')
        }
    }
    return order;
}

const getPackageRefundOrders = async () => {
    return dao.getPackageRefundOrders();
}

const searchPackageFoodOrderList = async (searchObj, page) => {
    return dao.searchPackageFoodOrderList(searchObj, page);
}

const getPaymentValidationOrderPackage = async () => {
    return dao.getPaymentValidationOrder();
}

const getSubscriptionEndDetailsByUserId = async (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const finalObj = {
                endingInFuture: [],
                ending2DayAfter: [],
                ending1DayAfter: [],
                endingToday: [],
                ended1DayBefore: [],
                ended2DayBefore: [],
                endedLongBack: []
            };
            let today = getTodayStartTime();
            let day1After = new Date(today);
            day1After.setDate(day1After.getDate() + 1);
            let day2After = new Date(today);
            day2After.setDate(day2After.getDate() + 2);
            let day3After = new Date(today);
            day3After.setDate(day3After.getDate() + 3);
            let day1Before = new Date(today);
            day1Before.setDate(day1Before.getDate() - 1);
            let day2Before = new Date(today);
            day2Before.setDate(day1Before.getDate() - 2);

            const orderList = await dao.getSubscriptionEndDetailsByUserId(userId);
            orderList.forEach(dailyorder => {
                const dailyOrderList = dailyorder.dailyOrderList.map(daily => daily.orderDate)
                dailyOrderList.sort((a, b) => {
                    if (a > b) {
                        return 1;
                    } else if (a < b) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
                const lastOrderDate = dailyOrderList[dailyOrderList.length - 1];
                const order = {
                    dailyOrderList,
                    lastOrderDate,
                    mealPackage: dailyorder.mealPackage,
                    orderNo: dailyorder.orderNo,
                    customerId: dailyorder.customerId,
                    customerName: dailyorder.customerName,
                    customerPhoneNo: dailyorder.customerPhoneNo,
                    customerEmail: dailyorder.customerEmail,
                    orderNo: dailyorder.orderNo,
                    subscriptionType: dailyorder.subscriptionType,
                    rmInfo: dailyorder.rmInfo,
                    clusterName: dailyorder.clusterName,
                    _id: dailyorder._id
                };
                if (lastOrderDate > day3After) {
                    finalObj.endingInFuture.push(order);
                } else if (lastOrderDate > day2After && lastOrderDate < day3After) {
                    finalObj.ending2DayAfter.push(order);
                } else if (lastOrderDate > day1After && lastOrderDate < day2After) {
                    finalObj.ending1DayAfter.push(order);
                } else if (lastOrderDate > today && lastOrderDate < day1After) {
                    finalObj.endingToday.push(order);
                } else if (lastOrderDate > day1Before && lastOrderDate < today) {
                    finalObj.ended1DayBefore.push(order);
                } else if (lastOrderDate > day2Before && lastOrderDate < day1Before) {
                    finalObj.ended2DayBefore.push(order);
                } else if (lastOrderDate < day2Before) {
                    finalObj.endedLongBack.push(order);
                }
            });
            resolve(finalObj)
            // resolve(orderList);
        } catch (error) {
            reject(error);
        }

    });
}

const getWooCoomerceOrder = async (wooCommerceId) => {
    return dao.getWooCoomerceOrder(wooCommerceId);
}

const getSubscriptionEndDetails = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const finalObj = {
                endingInFuture: [],
                ending2DayAfter: [],
                ending1DayAfter: [],
                endingToday: [],
                ended1DayBefore: [],
                ended2DayBefore: [],
                ended3DayBefore: [],
                endedLongBack: []
            };
            let today = getTodayStartTime();
            let day1After = new Date(today);
            day1After.setDate(day1After.getDate() + 1);
            let day2After = new Date(today);
            day2After.setDate(day2After.getDate() + 2);
            let day3After = new Date(today);
            day3After.setDate(day3After.getDate() + 3);
            let day1Before = new Date(today);
            day1Before.setDate(day1Before.getDate() - 1);
            let day2Before = new Date(today);
            day2Before.setDate(day1Before.getDate() - 2);
            let day3Before = new Date(today);
            day3Before.setDate(day1Before.getDate() - 3);
            const orderList = await dao.getSubscriptionEndDetails();
            orderList.forEach(dailyorder => {
                const dailyOrderList = dailyorder.dailyOrderList.map(daily => daily.orderDate)
                dailyOrderList.sort((a, b) => {
                    if (a > b) {
                        return 1;
                    } else if (a < b) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
                const lastOrderDate = dailyOrderList[dailyOrderList.length - 1];
                const order = {
                    city:dailyorder.city,
                    pincode: dailyorder.pincode,
                    dailyOrderList,
                    lastOrderDate,
                    mealPackage: dailyorder.mealPackage,
                    orderNo: dailyorder.orderNo,
                    customerId: dailyorder.customerId,
                    customerName: dailyorder.customerName,
                    customerPhoneNo: dailyorder.customerPhoneNo,
                    customerEmail: dailyorder.customerEmail,
                    orderNo: dailyorder.orderNo,
                    subscriptionType: dailyorder.subscriptionType,
                    rmInfo: dailyorder.rmInfo,
                    clusterName: dailyorder.clusterName,
                    mealTimeLunch: dailyorder.mealTimeLunch,
                    mealTimeDinner: dailyorder.mealTimeDinner,
                    mealTimeBreakfast: dailyorder.mealTimeBreakfast,
                    registeredPlatform:dailyorder.registeredPlatform,
                    orderDate: dailyorder.orderDate,
                    _id: dailyorder._id
                };

                if (lastOrderDate > day3After) {
                    finalObj.endingInFuture.push(order);
                } else if (lastOrderDate > day2After && lastOrderDate < day3After) {
                    finalObj.ending2DayAfter.push(order);
                } else if (lastOrderDate > day1After && lastOrderDate < day2After) {
                    finalObj.ending1DayAfter.push(order);
                } else if (lastOrderDate > today && lastOrderDate < day1After) {
                    finalObj.endingToday.push(order);
                } else if (lastOrderDate > day1Before && lastOrderDate < today) {
                    finalObj.ended1DayBefore.push(order);
                } else if (lastOrderDate > day2Before && lastOrderDate < day1Before) {
                    finalObj.ended2DayBefore.push(order);
                } else if (lastOrderDate > day3Before && lastOrderDate < day2Before) {
                    finalObj.ended3DayBefore.push(order);
                }
                else if (lastOrderDate < day2Before) {
                    finalObj.endedLongBack.push(order);
                }
            });
            resolve(finalObj)
            // resolve(orderList);
        } catch (error) {
            reject(error);
        }

    });
}


const getOrderPackageByOrderNo = async (orderNo) => {
    return dao.getOrderPackageByOrderNo(orderNo);
}

const getCustomerPastOrderInfo = async (customerId) => {
    return dao.getCustomerPastOrderInfo(customerId);
}

const getCustomerPastSubscriptionInfo = async (customerId) => {
    return dao.getCustomerPastSubscriptionInfo(customerId);
}
const getFoodOrdersPackageByCustomerEmailThinkowl = async (email) => {
    return dao.getFoodOrdersPackageByCustomerEmailThinkowl(email);
}

const getCustomerPastTrialOrderCount = async (customerId) => {
    let count = await dao.getCustomerPastTrialOrderCount(customerId);
    // if(count === 0){
    //     return count;
    // }
    // else{
    //     count--;
    //     return count;
    // }
    return count;
}

const exportFoodOrderPackageList = async (searchObj) => {
    return dao.exportFoodOrderPackageList(searchObj);
}

const exportActiveUserActiveOrders = async (searchObj) => {
    return dao.exportActiveUserActiveOrders(searchObj);
}

const exportPaymentFailedOrderList = async (searchObj) => {
    return dao.exportPaymentFailedOrderList(searchObj);
}

const checkForFreePlantation = async (customerId) => {
    return dao.checkForFreePlantation(customerId);
}

const updateRouteInfo = async (foodOrderId, payload) => {
    const orderInfo = await dao.updateRouteInfo(foodOrderId, payload);
    if (orderInfo.subscriptionBreakfastSlot && orderInfo.subscriptionBreakfastSlot != '') {
        await foodOrderdao.updateChildRouteInfo(foodOrderId, payload);
    } else if ((orderInfo.subscriptionDinnerSlot && orderInfo.subscriptionDinnerSlot != '') || 
               (orderInfo.subscriptionLunchSlot && orderInfo.subscriptionLunchSlot != '')) {
        await foodOrderdao.updateLunchDinnerChildRouteInfo(foodOrderId, payload);
    }
    
    return orderInfo;
}

const assignRMtoUserOrder = async (payload) => {
    return new Promise(async (resolve, reject) => {
        try {
            await updateRMInfo(payload.customerId, payload.rmInfo);
            const updatedOrder = await dao.updateRMInfo(payload.orderNo, payload.rmInfo);
            await foodOrderdao.updateRMInfo(payload.orderNo, payload.rmInfo);
            resolve(updatedOrder);
        } catch (error) {
            reject(error);
        }
    });
}

const firstTrialaftersubscription = async (searchObj) => {
    const orderList = await dao.firstTrialaftersubscription(searchObj);
    const customerMap = new Map();
    for (const order of orderList) {
        const customerId = order.customerId.toString();
        if (!customerMap.has(customerId)) {
            customerMap.set(customerId, []);
        }
        customerMap.get(customerId).push(order);
    }
    const result = [];
    for (const orders of customerMap.values()) {
        if (orders.length !== 2) continue;

        const firstTrial = orders.find(o => o.subscriptionType === 'first_trial');
        const firstSubscription = orders.find(o => o.subscriptionType === 'first_subscription');

        if (!firstTrial || !firstSubscription) continue;

        if (new Date(firstTrial.orderDate) < new Date(firstSubscription.orderDate)) {
            result.push(firstTrial, firstSubscription);
        }
    }
    return result;
}
const getChildOrdersStatusByPackageId = async (packageId) => {
    return dao.getChildOrdersStatusByPackageId(packageId);
}
module.exports = {
    saveOrderPackage,
    getCustomerPastSubscriptionInfo,
    changeMealTypeAndDatePackageOrder,
    // autoRefundOnPackage,
    updateOrderPackage,
    getOrderPackage,
    getCustomerPackageList,
    getKitchenSubDashboardCount,
    checkSubOrderValidForKitchen,
    createDailyPackageOrder,
    getKitchenPastPackageOrders,
    getCurrentPackageCount,
    getClusterCurrentPackageCount,
    getCurrentPackageOrdersList,
    resechedulePackageOrder,
    performPackageOrderTransfer,
    getPackageRefundOrders,
    searchPackageFoodOrderList,
    getPaymentValidationOrderPackage,
    getWooCoomerceOrder,
    getSubscriptionEndDetails,
    getOrderPackageByOrderNo,
    getCustomerPastOrderInfo,
    changeMealTypePackageOrder,
    getCustomerPastTrialOrderCount,
    exportFoodOrderPackageList,
    exportActiveUserActiveOrders,
    exportPaymentFailedOrderList,
    checkForFreePlantation,
    updateRouteInfo,
    assignRMtoUserOrder,
    getSubscriptionEndDetailsByUserId,
    firstTrialaftersubscription,
    checkRescheduleConflict,
    getFoodOrdersPackageByCustomerEmailThinkowl,
    getChildOrdersStatusByPackageId
}