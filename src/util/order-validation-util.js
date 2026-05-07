const { getVariables,getOneVariable } = require("../service/appConfigVariable.service");
const { getKitchenPartner } = require('../service/kitchenPartner.service');
const { getWalletBalance } = require("../service/userWallet.service");
const { getLocalDate, changeToLocalDate, compareDatesWithoutTime } = require("./date-util");
const { deductMoneyPointsFromWallet, addMoneyPointsInWallet, createCashBack, updatedCashBack } = require('../util/user-wallet-util');
const { serverLog } = require("../util/firebasedb-util");

global.minAdvOrderTime;
global.maxAdvOrderTime;
global.minAllDayOrderTime;
global.maxAlldayOrderTime;

global.minAdvOrderTimeStr;
global.maxAdvOrderTimeStr;
global.minAllDayOrderTimeStr;
global.maxAlldayOrderTimeStr;



const getDBTimeSlots = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            if (global.minAdvOrderTime && global.maxAdvOrderTime && global.minAllDayOrderTime && global.maxAlldayOrderTime) {
                resolve(true);
            } else {
                const orderDBTimings = await getVariables(['ADV_ORDER_START_TIME', 'ADV_ORDER_END_TIME', 'ALLDAY_ORDER_START_TIME', 'ALLDAY_ORDER_END_TIME']);
                if (orderDBTimings && orderDBTimings.length > 0) {
                    if (orderDBTimings[0] && orderDBTimings[0].configData) {
                        global.minAdvOrderTime = orderDBTimings[0].configData;
                        const advOrderStartDate = getLocalDate();
                        const stdDefaultMinTime = global.minAdvOrderTime.split(':');
                        let advStartHour = parseInt(stdDefaultMinTime[0]);
                        let advStartMin = parseInt(stdDefaultMinTime[1]);
                        advOrderStartDate.setHours(advStartHour);
                        advOrderStartDate.setMinutes(advStartMin);
                        global.minAdvOrderTimeStr = advOrderStartDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    }
                    if (orderDBTimings[1] && orderDBTimings[1].configData) {
                        global.maxAdvOrderTime = orderDBTimings[1].configData;
                        const advOrderEndDate = getLocalDate();
                        const stdDefaultMaxTime = global.maxAdvOrderTime.split(':');
                        let advEndHour = parseInt(stdDefaultMaxTime[0]);
                        let advEndMin = parseInt(stdDefaultMaxTime[1]);
                        advOrderEndDate.setHours(advEndHour);
                        advOrderEndDate.setMinutes(advEndMin);
                        global.maxAdvOrderTimeStr = advOrderEndDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    }
                    if (orderDBTimings[2] && orderDBTimings[2].configData) {
                        global.minAllDayOrderTime = orderDBTimings[2].configData;
                        const allDayOrderStartTime = global.minAllDayOrderTime.split(':');
                        let allDayStartHour = parseInt(allDayOrderStartTime[0]);
                        let allDayStartMin = parseInt(allDayOrderStartTime[1]);
                        const allDayOrderStartDate = getLocalDate();
                        allDayOrderStartDate.setHours(allDayStartHour);
                        allDayOrderStartDate.setMinutes(allDayStartMin);
                        global.minAllDayOrderTimeStr = allDayOrderStartDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    }
                    if (orderDBTimings[3] && orderDBTimings[3].configData) {
                        global.maxAlldayOrderTime = orderDBTimings[3].configData;
                        const allDayOrderEndTime = global.maxAlldayOrderTime.split(':');
                        let allDayEndHour = parseInt(allDayOrderEndTime[0]);
                        let allDayEndMin = parseInt(allDayOrderEndTime[1]);
                        const allDayOrderEndDate = getLocalDate();
                        allDayOrderEndDate.setHours(allDayEndHour);
                        allDayOrderEndDate.setMinutes(allDayEndMin);
                        global.maxAlldayOrderTimeStr = allDayOrderEndDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                    }
                    resolve(true);
                } else {
                    reject({ error: 'No value in DB' });
                }
            }
        } catch (error) {
            serverLog('error while fetching adv start end timing ', error);
            reject(error);
        }
    });
}

const checkOrderingTiming = (startTime, endTime) => {
    serverLog('checkOrderingTiming ', startTime, endTime)
    const orderEndTime = endTime.split(':');
    let orderEndHour = parseInt(orderEndTime[0]);
    let orderEndMin = parseInt(orderEndTime[1]);
    let endTimeDate = getLocalDate();
    endTimeDate.setHours(orderEndHour);
    endTimeDate.setMinutes(orderEndMin);

    const orderStartTime = startTime.split(':');
    let orderStartHour = parseInt(orderStartTime[0]);
    let orderStartMin = parseInt(orderStartTime[1]);
    let startTimeDate = getLocalDate();
    startTimeDate.setHours(orderStartHour);
    startTimeDate.setMinutes(orderStartMin);

    const currentTime = getLocalDate();
    if (currentTime.getTime() < startTimeDate.getTime() || currentTime.getTime() > endTimeDate.getTime()) {
        return false;
    } else {
        return true;
    }

}

const foodOrderTimeValidation = async (foodOrder, kitchenPatner) => {
    return new Promise(async (resolve, reject) => {
        try {
            let validOrder = true;
            let msg;
            const indialLocalTime = getLocalDate();
            const localTodayDate = indialLocalTime.getDate();
            const after1Day = new Date(getLocalDate().setDate(localTodayDate + 1));
            const after2Day = new Date(getLocalDate().setDate(localTodayDate + 2));
            const after15Day = new Date(getLocalDate().setDate(localTodayDate + 15));

            const orderDate = changeToLocalDate(foodOrder.orderDate);
            const orderTodayDate = orderDate.getDate();
            const indialLocalTimegetTime = indialLocalTime.getTime();
            const orderDategetTime = orderDate.getTime();
            if ((indialLocalTimegetTime - orderDategetTime > 2 * 60 * 1000) || localTodayDate !== orderTodayDate) {
                validOrder = false;
                msg = 'Invalid Order Date';
                serverLog('orderValidation failed 1 ### ', localTodayDate, orderTodayDate);
            } else {
                serverLog('orderValidation 1 else ### ', localTodayDate, orderTodayDate);
                await getDBTimeSlots();
                // if(foodOrder && foodOrder.orderType === 'daily'){
                //     kitchenPatner.mealTiming.forEach(element => {        
                //       if (element.mealType === foodOrder.mealType){          
                //         const acceptOrderFrom = changeToLocalDate(element.acceptOrderFrom);          
                //         const fromHour = acceptOrderFrom.getHours(); 
                //         const fromMins = acceptOrderFrom.getMinutes();
                //         let startTimeDate = getLocalDate();
                //         startTimeDate.setHours(fromHour);
                //         startTimeDate.setMinutes(fromMins);

                //         const acceptOrderTill = changeToLocalDate(element.acceptOrderTill);
                //         const tillHour = acceptOrderTill.getHours(); 
                //         const tillMins = acceptOrderTill.getMinutes();  
                //         let endTimeDate = getLocalDate();
                //         endTimeDate.setHours(tillHour);
                //         endTimeDate.setMinutes(tillMins);  
                //         const currentTime = getLocalDate();
                //        serverLog('validateDailyTimings ',currentTime,startTimeDate,endTimeDate);
                //         if(currentTime.getTime() < startTimeDate.getTime() || currentTime.getTime() > endTimeDate.getTime()){
                //             validOrder = false;
                //             msg = `You have missed ${foodOrder.mealType} ordering time of ${foodOrder.kitchenName}`;
                //            serverLog('orderValidation failed 2 ### ',startTimeDate);
                //         }else{                          
                //           validOrder = true;
                //          serverLog('orderValidation 2 else ### ',startTimeDate);
                //         }} 
                //     });
                //   }
                if (foodOrder && foodOrder.orderType === 'advance') {
                    const orderComplitionDate = changeToLocalDate(foodOrder.orderComplitionDate);
                    const orderComplitionDay = orderComplitionDate.getDate();
                    if (orderComplitionDay !== after1Day.getDate() && orderComplitionDay !== after2Day.getDate()) {
                        validOrder = false;
                        msg = 'Advance order can only be placed for tomorrow and day after';
                        serverLog('orderValidation failed 3 ### ', orderComplitionDay);
                    } else {
                        serverLog('orderValidation 3 else ### ', orderComplitionDay);
                        const orderingTimeValid = checkOrderingTiming(global.minAdvOrderTime, global.maxAdvOrderTime);
                        if (!orderingTimeValid) {
                            validOrder = false
                            msg = `You can place advance order between ${global.minAdvOrderTimeStr} to ${global.maxAdvOrderTimeStr} only`;
                            serverLog('orderValidation failed 4 ### ', orderDate);
                        } else {
                            serverLog('orderValidation 4 else ### ', orderDate);
                        }
                    }
                }
                else if (foodOrder && (foodOrder.orderType === 'allDay' || foodOrder.orderType === 'subscriptionParent')) {
                    const orderingTimeValid = checkOrderingTiming(global.minAllDayOrderTime, global.maxAlldayOrderTime);
                    if (!orderingTimeValid) {
                        validOrder = false;
                        msg = `You can place order between ${global.minAllDayOrderTimeStr} to ${global.maxAlldayOrderTimeStr} only`;
                        serverLog('orderValidation failed 5 ### ', orderDate);
                    } else {
                        serverLog('orderValidation 5 else ### ', orderDate);
                    }
                } else if (foodOrder.orderType === 'subscriptionPackage' && foodOrder.subscriptionStartDate && !foodOrder.multiDateAllowed) {
                    const subsDate = changeToLocalDate(foodOrder.subscriptionStartDate);
                    const result = compareDatesWithoutTime(subsDate, indialLocalTime);

                    if (result === 0) {
                        // Selected date is TODAY — only allow if before cutoff and dinner only
                        try {
                            const cutoffDoc = await getOneVariable('SUBSCRIPTION_DINNER_RESCHEDULE_CUTOFF_TIME');
                            const cutoffTimeStr = cutoffDoc?.configData || null;
                            serverLog('cutoff doc ### ', cutoffDoc, 'cutoffTimeStr ### ', cutoffTimeStr);
                            if (cutoffTimeStr && typeof cutoffTimeStr === 'string') {
                                const [cutoffHour, cutoffMin] = cutoffTimeStr.split(':').map(Number);
                                const cutoff = getLocalDate();
                                cutoff.setHours(cutoffHour, cutoffMin, 0, 0);
                                const now = getLocalDate();

                                const isDinnerOnly = foodOrder.mealTimeDinner === true && foodOrder.mealTimeLunch !== true;

                                if (now < cutoff && isDinnerOnly) {
                                    // Valid: before cutoff and dinner only
                                    validOrder = true;
                                    serverLog('orderValidation today dinner allowed ### ', now, cutoff);
                                } else if (now >= cutoff) {
                                    validOrder = false;
                                    msg = 'Today\'s dinner ordering time has passed. Please select a future date.';
                                    serverLog('orderValidation failed — past cutoff ### ', now, cutoff);
                                } else {
                                    // Before cutoff but not dinner only
                                    validOrder = false;
                                    msg = 'Only dinner can be ordered for today\'s date.';
                                    serverLog('orderValidation failed — not dinner only for today ### ');
                                }
                            } else {
                                // Config not set — fall back to future date only
                                validOrder = false;
                                msg = 'Subscription order can only be placed for future date###1';
                                serverLog('orderValidation failed — no cutoff config ### ');
                            }
                        } catch (err) {
                            serverLog('Error fetching SUBSCRIPTION_DINNER_RESCHEDULE_CUTOFF_TIME ### ', err);
                            validOrder = false;
                            msg = 'Subscription order can only be placed for future date###2';
                        }
                    } else if (result !== 1) {
                        // Past date
                        validOrder = false;
                        msg = 'Subscription order can only be placed for future date###3';
                        serverLog('orderValidation failed — past date ### ', orderDate);
                    } else {
                        // Future date — always valid
                        serverLog('orderValidation 5 else ### ', orderDate);
                    }

                    } else if (foodOrder.orderType === 'subscriptionPackage' && !foodOrder.subscriptionStartDate && foodOrder.multiDateAllowed) {

                        for (let d = 0; d < foodOrder.userSelectedDates.length; d++) {
                            const subsDate = changeToLocalDate(foodOrder.userSelectedDates[d]);
                            const result = compareDatesWithoutTime(subsDate, indialLocalTime);

                            if (result === 0) {
                                // Today is selected in multi-date — apply same cutoff + dinner-only check
                                try {
                                    const cutoffDoc = await getOneVariable('SUBSCRIPTION_DINNER_RESCHEDULE_CUTOFF_TIME');
                                    const cutoffTimeStr = cutoffDoc?.configData || null;
                                    serverLog('multiDate cutoff doc ### ', cutoffDoc, 'cutoffTimeStr ### ', cutoffTimeStr);

                                    if (cutoffTimeStr && typeof cutoffTimeStr === 'string') {
                                        const [cutoffHour, cutoffMin] = cutoffTimeStr.split(':').map(Number);
                                        const cutoff = getLocalDate();
                                        cutoff.setHours(cutoffHour, cutoffMin, 0, 0);
                                        const now = getLocalDate();

                                        const isDinnerOnly = foodOrder.mealTimeDinner === true && foodOrder.mealTimeLunch !== true;

                                        if (now < cutoff && isDinnerOnly) {
                                            // Valid: today selected, before cutoff, dinner only
                                            serverLog('multiDate orderValidation today dinner allowed ### ', now, cutoff);
                                            continue; // this date is valid, check next
                                        } else if (now >= cutoff) {
                                            validOrder = false;
                                            msg = "Today's dinner ordering time has passed. Please select a future date.";
                                            serverLog('multiDate orderValidation failed — past cutoff ### ', now, cutoff);
                                            break;
                                        } else {
                                            // Before cutoff but lunch also selected
                                            validOrder = false;
                                            msg = 'Only dinner can be ordered for today\'s date. Please deselect lunch for today.';
                                            serverLog('multiDate orderValidation failed — not dinner only for today ### ');
                                            break;
                                        }
                                    } else {
                                        // No cutoff config — reject today
                                        validOrder = false;
                                        msg = 'Subscription order can only be placed for future date.';
                                        serverLog('multiDate orderValidation failed — no cutoff config ### ');
                                        break;
                                    }
                                } catch (err) {
                                    serverLog('Error fetching SUBSCRIPTION_DINNER_RESCHEDULE_CUTOFF_TIME for multiDate ### ', err);
                                    validOrder = false;
                                    msg = 'Subscription order can only be placed for future date.';
                                    break;
                                }
                            } else if (result !== 1) {
                                // Past date — always invalid
                                validOrder = false;
                                msg = 'Subscription order can only be placed for future date.';
                                serverLog('multiDate orderValidation failed — past date ### ', subsDate);
                                break;
                            } else {
                                // Future date — valid, continue
                                serverLog('multiDate orderValidation date ok ### ', subsDate);
                            }
                        }
                    }
            }
            resolve({ validOrder, msg });
        } catch (error) {
            serverLog('Error inside payment-validation-util.js function checkRefundEligibility ==> ', error);
            reject(error);
        }
    });
};

const bulkFoodOrderTimeValidation = async (foodOrder, kitchenPatner) => {
    return new Promise(async (resolve, reject) => {
        try {
            let validOrder = true;
            let msg;
            resolve({ validOrder, msg });
        } catch (error) {
            serverLog('Error inside order-validation-util.js function bulkFoodOrderTimeValidation ==> ', error);
            reject(error);
        }
    });
};

const foodordervalidation = (foodOrder) => {
    let validOrder = true;
    return new Promise(async (resolve, reject) => {
        try {
            // const kitchenPatner = await getKitchenPartner(foodOrder.kitchenId);
            const kitchenPatner = undefined;
            const timingValidation = await foodOrderTimeValidation(foodOrder, kitchenPatner);
            if (timingValidation.validOrder) {
                serverLog('orderValidation 6 else ### ', timingValidation.validOrder);
                let walletBalance = 0;
                let itemAmount = 0;
                let mealaweTotalAmt = 0;
                let subscriptionCount = 1
                const userWallet = await getWalletBalance(foodOrder.customerId);
                if (userWallet && userWallet.wallet_balance > 0) {
                    walletBalance = userWallet.wallet_balance;
                }
                if (foodOrder.moneyWalletPointsUsed > walletBalance) {
                    validOrder = false;
                    serverLog('orderValidation failed 7 ### ', foodOrder.moneyWalletPointsUsed, walletBalance);
                }
                else {
                    serverLog('orderValidation 7 else ### ', foodOrder.moneyWalletPointsUsed, walletBalance);
                }

                if (foodOrder.orderType === 'allDay' || foodOrder.orderType === 'subscriptionParent') {
                    if (foodOrder.orderType === 'subscriptionParent' && foodOrder.subscriptionDays) {
                        subscriptionCount = foodOrder.subscriptionDays;
                    }
                    foodOrder.itemList.forEach(ele => {
                        if (ele.itemPrice <= 0) {
                            validOrder = false;
                            serverLog('orderValidation failed 8 fooditem ### ', ele.itemPrice);
                        }
                        itemAmount += (ele.itemPrice * ele.count * subscriptionCount);
                        mealaweTotalAmt += (ele.mealawePrice * ele.count * subscriptionCount);
                    });
                    foodOrder.addOns.forEach(ele => {
                        if (ele.addOnPrice <= 0) {
                            validOrder = false;
                            serverLog('orderValidation failed 8 ### addon', ele.addOnPrice);
                        }
                        itemAmount += (ele.addOnPrice * ele.count * subscriptionCount);
                        mealaweTotalAmt += (ele.mealawePrice * ele.count * subscriptionCount);
                    });

                    if (itemAmount !== foodOrder.itemAmount) {
                        validOrder = false;
                        serverLog('orderValidation failed 9 ### ', itemAmount, foodOrder.itemAmount);
                    } else {
                        serverLog('orderValidation 9 else ### ', itemAmount, foodOrder.itemAmount);
                    }

                    if (mealaweTotalAmt !== foodOrder.mealaweTotalAmt) {
                        validOrder = false;
                        serverLog('orderValidation failed 10 ### ', mealaweTotalAmt, foodOrder.mealaweTotalAmt);
                    } else {
                        serverLog('orderValidation 10 else ### ', mealaweTotalAmt, foodOrder.mealaweTotalAmt);
                    }
                    foodOrder.extraDiscount = foodOrder.extraDiscount ? foodOrder.extraDiscount : 0;
                    foodOrder.cutleryDiscount = foodOrder.cutleryDiscount ? foodOrder.cutleryDiscount : 0;
                    foodOrder.couponDiscount = foodOrder.couponDiscount ? foodOrder.couponDiscount : 0;
                    foodOrder.treePlantationAmount = foodOrder.treePlantationAmount ? foodOrder.treePlantationAmount : 0;
                    foodOrder.treePlantationDiscount = foodOrder.treePlantationDiscount ? foodOrder.treePlantationDiscount : 0;
                    foodOrder.platformCharges = foodOrder.platformCharges ? foodOrder.platformCharges : 0;
                    foodOrder.platformChargesDiscount = foodOrder.platformChargesDiscount ? foodOrder.platformChargesDiscount : 0;
                    const totalOrderAmt = foodOrder.mealaweTotalAmt + foodOrder.deliveryCharges + foodOrder.taxes + foodOrder.treePlantationAmount + foodOrder.platformCharges ;
                    let totalSaving = 0;
                    if (foodOrder.mealaweWalletPointsUsed) {
                        totalSaving = foodOrder.mealaweKitchenDiscount + foodOrder.moneyWalletPointsUsed + foodOrder.mealaweWalletPointsUsed +
                            foodOrder.voucherDiscount + foodOrder.extraDiscount + foodOrder.cutleryDiscount + foodOrder.couponDiscount +
                             foodOrder.treePlantationDiscount + foodOrder.platformChargesDiscount;
                    } else {
                        totalSaving = foodOrder.mealaweDeliveryDiscount + foodOrder.mealaweItemDiscount + foodOrder.discount + foodOrder.cutleryDiscount +
                            foodOrder.mealaweKitchenDiscount + foodOrder.moneyWalletPointsUsed + foodOrder.voucherDiscount + foodOrder.couponDiscount + foodOrder.extraDiscount
                            + foodOrder.treePlantationDiscount + foodOrder.platformChargesDiscount;
                    }
                    const calculatedPrice = Math.ceil(totalOrderAmt - totalSaving);
                    const billPrice = Math.ceil(foodOrder.amount);
                    if (calculatedPrice !== billPrice && false) {
                        validOrder = false;
                        serverLog('orderValidation failed 11 ### ', totalOrderAmt - totalSaving, foodOrder.amount, calculatedPrice, billPrice);
                    } else {
                        serverLog('orderValidation 11 else ### ', totalOrderAmt - totalSaving, foodOrder.amount, calculatedPrice, billPrice);
                    }
                }


                resolve({ status: validOrder });
            } else {
                serverLog('orderValidation failed 6 else### ', timingValidation.validOrder);
                resolve({ status: false, msg: timingValidation.msg });
            }

        } catch (error) {
            serverLog('Error inside payment-validation-util.js function checkRefundEligibility ==> ', error);
            reject(error);
        }
    });
}

const bulkFoodordervalidation = (foodOrder) => {
    let validOrder = true;
    return new Promise(async (resolve, reject) => {
        try {
            // const kitchenPatner = await getKitchenPartner(foodOrder.kitchenId);
            const kitchenPatner = undefined;
            const timingValidation = await bulkFoodOrderTimeValidation(foodOrder, kitchenPatner);
            if (timingValidation.validOrder) {
                serverLog('orderValidation bulk 1 else ### ', timingValidation.validOrder);
                let walletBalance = 0;
                let itemAmount = 0;
                let mealaweTotalAmt = 0;
                let subscriptionCount = 1
                const userWallet = await getWalletBalance(foodOrder.customerId);
                if (!foodOrder.moneyWalletPointsUsed) {
                    foodOrder.moneyWalletPointsUsed = 0;
                }
                if (userWallet && userWallet.wallet_balance > 0) {
                    walletBalance = userWallet.wallet_balance;
                }
                if (foodOrder.moneyWalletPointsUsed > walletBalance) {
                    validOrder = false;
                    serverLog('orderValidation failed 7 ### ', foodOrder.moneyWalletPointsUsed, walletBalance);
                }
                else {
                    serverLog('orderValidation 7 else ### ', foodOrder.moneyWalletPointsUsed, walletBalance);
                }
                // if(foodOrder.moneyWalletPointsUsed){
                //     deductMoneyPointsFromWallet(foodOrder.customerId,foodOrder.customerName,foodOrder.moneyWalletPointsUsed,
                //         `Points redeemed on subscription order no. ${foodOrder.orderNo}`);
                // } 
                if (foodOrder.packagingCostByUser) {
                    foodOrder.packagingCostByUser = foodOrder.packagingCostByUser ? foodOrder.packagingCostByUser : 0;
                }

                // if(foodOrder.orderType === 'allDay' || foodOrder.orderType === 'subscriptionParent' ){
                // if(foodOrder.orderType === 'subscriptionParent' && foodOrder.subscriptionDays){
                //     subscriptionCount = foodOrder.subscriptionDays;
                // }
                let totalSaving = 0;
                if (foodOrder.voucherDiscount) {
                    totalSaving += foodOrder.voucherDiscount;
                }
                // if (foodOrder.discount) {
                //     totalSaving += foodOrder.discount;
                // }

                foodOrder.itemList.forEach(ele => {
                    if (ele.itemPrice <= 0) {
                        validOrder = false;
                        serverLog('orderValidation bulk failed 1 fooditem ### ', ele.itemPrice);
                    }
                    itemAmount += (ele.itemPrice * ele.count);
                });

                // foodOrder.addOns.forEach(ele => {
                //     if(ele.addOnPrice <= 0 ){                        
                //         validOrder = false;
                //        serverLog('orderValidation failed 8 ### addon',ele.addOnPrice);
                //     }
                //     itemAmount += (ele.addOnPrice * ele.count * subscriptionCount);
                //     mealaweTotalAmt += (ele.mealawePrice * ele.count * subscriptionCount);
                // });

                if (itemAmount !== foodOrder.bulkItemAmount) {
                    validOrder = false;
                    serverLog('orderValidation bulk failed 2 ### ', itemAmount, foodOrder.bulkItemAmount);
                } else {
                    serverLog('orderValidation bulk 2 else ### ', itemAmount, foodOrder.bulkItemAmount);
                }

                // if(mealaweTotalAmt !== foodOrder.mealaweTotalAmt){   
                //     validOrder = false;                 
                //    serverLog('orderValidation failed 10 ### ',mealaweTotalAmt,foodOrder.mealaweTotalAmt);                    
                // }else{
                //    serverLog('orderValidation 10 else ### ',mealaweTotalAmt,foodOrder.mealaweTotalAmt);
                // }
                // foodOrder.extraDiscount = foodOrder.extraDiscount ? foodOrder.extraDiscount : 0;
                serverLog(foodOrder.bulkItemAmount , foodOrder.taxes ,foodOrder.packagingCostByUser , totalSaving);
                if(foodOrder.foodOrderType==='apartmentBulk'){
                    foodOrder.packagingCostByUser=0;
                    foodOrder.finalBulkDelDiscount = foodOrder.finalBulkDelDiscount
                }
                
                let totalOrderAmt = foodOrder.bulkItemAmount + foodOrder.taxes + foodOrder.packagingCostByUser  + (foodOrder.finalBulkPlatformCharges?foodOrder.finalBulkPlatformCharges:0) - (foodOrder.finalBulkPlatformDiscount?foodOrder.finalBulkPlatformDiscount:0) + (foodOrder.totalEcoFriendlyPackagingCharges?foodOrder.totalEcoFriendlyPackagingCharges:0) - (foodOrder.totalEcoFriendlyPackagingChargesDiscount?foodOrder.totalEcoFriendlyPackagingChargesDiscount:0)+ (foodOrder.platformCharges?foodOrder.platformCharges:0)-(foodOrder.platformChargesCommonDiscount?foodOrder.platformChargesCommonDiscount:0);
                if (foodOrder.mealaweWalletPointsUsed) {
                    totalSaving = foodOrder.mealaweKitchenDiscount + foodOrder.moneyWalletPointsUsed + foodOrder.mealaweWalletPointsUsed +
                        foodOrder.voucherDiscount + foodOrder.extraDiscount;
                } else {
                    totalSaving = foodOrder.discount + foodOrder.moneyWalletPointsUsed + foodOrder.voucherDiscount;
                }
                if((foodOrder.foodOrderType==='apartmentBulk' && !foodOrder.enableSelfPickup && foodOrder.enableDelivery) || foodOrder.foodOrderType !='apartmentBulk'){
                    totalOrderAmt = totalOrderAmt +((foodOrder.finalBulkDelCharges?foodOrder.finalBulkDelCharges:0) - (foodOrder.finalBulkDelDiscount?foodOrder.finalBulkDelDiscount:0))
                }
                let amt = parseFloat(parseFloat(foodOrder.amount).toFixed(2));
                let tamt = parseFloat(parseFloat(totalOrderAmt - totalSaving).toFixed(2));
        
                if (tamt != amt) {
                    validOrder = false;
                    serverLog('orderValidation bulk failed 3 if ### ', totalOrderAmt, foodOrder.amount, tamt, amt);
                }
                else {
                    serverLog('orderValidation bulk 3 else ###', totalOrderAmt, foodOrder.amount);
                }
                // }
                resolve({ status: validOrder });
            } else {
                serverLog('orderValidation bulk failed 4 else### ', timingValidation.validOrder);
                resolve({ status: false, msg: timingValidation.msg });
            }

        } catch (error) {
            serverLog('Error inside order-validation-util.js function bulkFoodordervalidation ==> ', error);
            reject(error);
        }
    });
}

const marketPlaceOrderValidation = (foodOrder) => {
    let validOrder = true;
    return new Promise(async (resolve, reject) => {
        try {
            let walletBalance = 0;
            let itemAmount = 0;
            const userWallet = await getWalletBalance(foodOrder.customerId);
            if (userWallet && userWallet.wallet_balance > 0) {
                walletBalance = userWallet.wallet_balance;
            }
            if (foodOrder.moneyWalletPointsUsed > walletBalance) {
                validOrder = false;
                serverLog('orderValidation failed 7 ### ', foodOrder.moneyWalletPointsUsed, walletBalance);
            } else {
                serverLog('orderValidation 7 else ### ', foodOrder.moneyWalletPointsUsed, walletBalance);
            }
            resolve({ status: validOrder });

        } catch (error) {
            serverLog('Error inside order-validation-util.js function marketPlaceOrderValidation ==> ', error);
            reject(error);
        }
    });
}

module.exports = {
    foodordervalidation,
    bulkFoodordervalidation,
    marketPlaceOrderValidation
}