const { getfcmFoodOrder, autoRefundOnFoodOrder, getPaymentValidationOrder } = require("../service/foodorder.service");
const { getPaymentBulkValidationOrder } = require("../service/bulkFoodOrder.service");
const { getPaymentValidationOrderPackage } = require("../service/foodOrderPackage.service");
const { getCashbackListForExpiry, expireCashBackList } = require("../service/cashback.service");
const { getSubscriptionEndDetails } = require("../service/foodOrderPackage.service")
const { sendFcmMessage, sendGenericFcmMessage } = require("./fcm-message-handler");
const { getLocalDate, changeToLocalDate } = require("./date-util");
const cluster = require("cluster");
const { validateCronePaytmPaymentTransaction } = require("../service/paymentGateway.service");
const { getWooCommerceMealOrders } = require("./woo-commerce.util");
const { performPidgeTask } = require("./pidge-util");
const { getPaymentMarketPlaceMainValidationOrder } = require("../service/marketPlaceMainOrder.service");
const { validateCroneJusPayPaymentTransaction } = require("../service/paymentGatewayJusPay.service");
const { isAutoScalingInstance } = require("../config/aws-config");
const { transferLedgerListToWallet, transferWalletListToBank } = require("./kitchen-ledger-wallet-util");
const { serverLog } = require("./firebasedb-util");
const { sendRenewal2Days, sendRenewal1Day, sendRenewToday, sendRenewal3Days, sendSecondMessageCarousel, sendFinalOffer } = require("../util/whatsapp/whatsapp.service");
const { retentionAutoUpdateLead } = require("../util/telecrm-util");
const { userNotPurchaseOrPurchase } = require("../service/customerProfile.service");
const { cleanupPastMenuItems } = require("../service/apartmentMenu.service");
const { retentionAutoUpdateLeadNetcore } = require("../util/netcore-util");

const fcmMessageInterval = async () => {
    try {
        serverLog("fcmMessageInterval initialize");
        const foodOrderList = await getfcmFoodOrder();
        serverLog("fcmMessageInterval Started");
        foodOrderList.forEach(order => {
            checkForAutoCancelOrder(order);
        });
    } catch (e) {
        // console.log('erroe while getting food order ',e);
    }
}

const checkForAutoCancelOrder = async (foodOrder) => {
    try {
         // Skip auto-cancel for apartment orders
        if (foodOrder.orderType === 'apartment_today' || foodOrder.orderType === 'apartment_advance') {
            console.log(`Skipping auto-cancel for apartment order ${foodOrder.orderNo}`);
            return; // Exit early, no auto-cancel for apartments
        }
        const transactionTime = foodOrder.transactionTime ? foodOrder.transactionTime : foodOrder.orderDate;
        const orderDate = (new Date(transactionTime)).getTime();
        const currentTime = (new Date()).getTime();
        const timeDiff = currentTime - orderDate;
        const twoHours = 1000 * 60 * 45; // 45 min
        if (timeDiff > twoHours) {
            // console.log('checkForAutoCancelOrder ',foodOrder.orderDate,orderDate,currentTime,timeDiff);

            autoRefundOnFoodOrder(foodOrder, true);

        } else {
            sendFcmMessage(foodOrder.orderstatus, foodOrder.orderNo, foodOrder.kitchenId, 'KITCHEN');
        }
    } catch (e) {
        // console.log('auto cancel food order error ',e);
    }
}


const timeBasedCroneJobs = async () => {
    serverLog("timeBasedCroneJobs start");
    try {
        const currentTime = getLocalDate();
        // console.log({currentTime});
        
        const hour = currentTime.getHours();
        // console.log({hour});
        
        const minute = currentTime.getMinutes();
        // console.log({minute});
        
        expireCashback(hour, minute);
        endMealNotification(hour, minute);
        vendorLedgerWalletCron(hour, minute);
        cleanupPastMenuItemsCron(hour, minute);  // ✅ ADD THIS LINE

    } catch (e) {
        // console.log('error while getting food order ',e);
    }
}

const checkAndSendNotPurchasedMessages = async () => {
    try {
        const list = await userNotPurchaseOrPurchase();
        const currentTime = getLocalDate().getTime();
        if (list && list.lastLogin24HoursNotPurchasedMealawe?.length > 0) {
            list.lastLogin24HoursNotPurchasedMealawe.forEach(user => {
                if (user.lastLogin) {
                    const lastLoginTime = changeToLocalDate(user.lastLogin).getTime();
                    const diffInHours = (currentTime - lastLoginTime) / (1000 * 60 * 60);
                    if (diffInHours >= 24 && diffInHours <= 48) {
                        sendSecondMessageCarousel(user.phoneNo);
                    }
                }
            });
        }
        if (list && list.lastLogin48HoursNotPurchasedMealawe?.length > 0) {
            list.lastLogin48HoursNotPurchasedMealawe.forEach(user => {
                if (user.lastLogin) {
                    const lastLoginTime = changeToLocalDate(user.lastLogin).getTime();
                    const diffInHours = (currentTime - lastLoginTime) / (1000 * 60 * 60);
                    if (diffInHours > 48 && diffInHours <= 72) {
                        sendFinalOffer(user.phoneNo);
                    }
                }
            });
        }
    } catch (e) {
        console.log('error while checkAndSendNotPurchasedMessages ', e);
    }
}

const expireCashback = async (hour, minute) => {
    try {
        // console.log('expireCashback ',hour,minute);
        if (hour === 9 && minute > 15 && minute <= 30) {
            const list = await getCashbackListForExpiry(0);
            sendCashBackNotification(list, 'today', 0);
        }
        if (hour === 10 && minute > 15 && minute <= 30) {
            const list = await getCashbackListForExpiry(1);
            sendCashBackNotification(list, 'in 1 day', 0);
        }
        if (hour === 11 && minute > 15 && minute <= 30) {
            const list = await getCashbackListForExpiry(2);
            sendCashBackNotification(list, 'in 2 days', 0);
        }
        if ((hour === 1 || hour === 3 || hour === 5) && minute > 15 && minute <= 30) {
            await expireCashBackList();
        }
    } catch (e) {
        // console.log('error while getting food order ',e);
    }
}

const endMealNotification = async (hour, minute) => {
    try {
        const mealEndList = await getSubscriptionEndDetails();
        if (hour === 8 && minute > 15 && minute <= 30) {
            sendMealEndNotification(mealEndList.endingToday, 'today', 0);
            sendRenewToday(mealEndList.endingToday);
            retentionAutoUpdateLead(
                mealEndList.endingToday,
                order => `App Data: Meal Ending Today - Order No: ${order.orderNo}`,'Ending Today'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.endingToday,
                order => `App Data: Meal Ending Today - Order No: ${order.orderNo}`,'Ending Today','Subscription_Ending_Today'
            );
        }
        if (hour === 7 && minute > 15 && minute <= 30) {
            sendMealEndNotification(mealEndList.ending1DayAfter, 'in 1 day', 0);
            sendRenewal1Day(mealEndList.ending1DayAfter);
            retentionAutoUpdateLead(
                mealEndList.ending1DayAfter,
                'Ending Tomorrow'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.ending1DayAfter,
                order => `App Data: Meal Ending Tomorrow - Order No: ${order.orderNo}`,'Ending Tomorrow','Subscription__Ending_Tomorrow'
            );
        }
        if (hour === 6 && minute > 15 && minute <= 30) {
            sendMealEndNotification(mealEndList.ending2DayAfter, 'in 2 days', 0);
            sendRenewal2Days(mealEndList.ending2DayAfter);
            checkAndSendNotPurchasedMessages();
            retentionAutoUpdateLead(
                mealEndList.ending2DayAfter,
                'Ending After 2 days'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.ending2DayAfter,
                order => `App Data: Meal Ending After 2 days - Order No: ${order.orderNo}`,'Ending After 2 days','Subscription__Ending_After2days'
            );
        }
        if (hour === 5 && minute > 15 && minute <= 45) {
            sendMealEndNotification(mealEndList.ended1DayBefore, 'ended 1 day ago', 0);
            retentionAutoUpdateLead(
                mealEndList.ended1DayBefore,
                'Ended Yesterday'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.ended1DayBefore,
                order => `App Data: Meal Ended Yesterday - Order No: ${order.orderNo}`,'Ended Yesterday','Subscription__Ended_Yesterday'
            );
        }
        if (hour === 4 && minute > 15 && minute <= 30) {
            sendMealEndNotification(mealEndList.ended2DayBefore, 'ended 2 day ago', 0);
            retentionAutoUpdateLead(
                mealEndList.ended2DayBefore,
                'Ended 2 Days Back'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.ended2DayBefore,
                order => `App Data: Meal Ended 2 Days Back - Order No: ${order.orderNo}`,'Ended 2 Days Back','Subscription__Ended_2DaysBack'
            );
            
        }
        if (hour === 1 && minute > 15 && minute <= 30) {
            sendMealEndNotification(mealEndList.ended3DayBefore, 'ended 3 day ago', 0);
            sendRenewal3Days(mealEndList.ended3DayBefore);
            retentionAutoUpdateLead(
                mealEndList.ended3DayBefore,
                'ended 3 day ago'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.ended3DayBefore,
                order => `App Data: Meal ended 3 day ago - Order No: ${order.orderNo}`,'ended 3 day ago','Subscription__Ended_3DayAgo'
            );
        }
        if (hour === 2 && minute > 15 && minute <= 30) {
            sendMealEndNotification(mealEndList.endedLongBack, 'Ended Long Back', 0);
            sendRenewal3Days(mealEndList.endedLongBack);
            retentionAutoUpdateLead(
                mealEndList.endedLongBack,
                'Ended Long Back'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.endedLongBack,
                order => `App Data: Meal Ended Long Back - Order No: ${order.orderNo}`,'Ended Long Back','Subscription__Ended_Long_Back'
            );
        }
        if (hour === 3 && minute > 1 && minute <= 30) {
            retentionAutoUpdateLead(
                mealEndList.endingInFuture,
                'Ending In Future'
            );
            retentionAutoUpdateLeadNetcore(
                mealEndList.endingInFuture,
                order => `App Data: Meal Ending In Future - Order No: ${order.orderNo}`,'Ending In Future','Subscription__Ending_In_Future'
            );
        }
    } catch (e) {
        // console.log('error while getting food order ',e);
    }
}

const vendorLedgerWalletCron = async (hour, minute) => {
    try {
        serverLog(`vendorLedgerWalletCroneJobs Initialize, ${hour},${minute}`);
        if ((hour === 1 || hour === 2) && minute > 15 && minute <= 30) {
            serverLog(`vendorLedgerWalletCroneJobs, ${hour},${minute}`);
            await transferLedgerListToWallet();
        }
        // if(( hour === 3 || hour === 4) && minute > 15 && minute <= 30){
        //     await transferWalletListToBank();
        // }
    } catch (e) {
        // console.log('error while getting food order ',e);
    }
}

const createDailyPidgeOrders = async () => {
    try {
        // console.log('createDailyPidgeOrders performed all');
        const response = await performPidgeTask();
        // console.log('createDailyPidgeOrders completed all',response);
    } catch (e) {
        // console.log('error while getting food order ',e);
    }
}

const sendCashBackNotification = async (list, days, index) => {
    try {
        if (list && list.length > 0) {
            if (index < list.length) {
                const ele = list[index];
                const customerName = ele.customerName ? ele.customerName : 'mealawe user'
                const msg = `Dear ${customerName}, your ${ele.totalCashbackBalance} cashback points are going to expire ${days}, kindly order on mealwe to redeem your cashback points.`;
                sendGenericFcmMessage(msg, ele.customerId, 'USER');
                index++;
                setTimeout(() => {
                    sendCashBackNotification(list, days, index);
                }, 500);
            }
        }
    } catch (e) {
        // console.log('erroe while getting food order ',e);
    }
}

const sendMealEndNotification = async (list, days, index) => {
    try {
        if (list && list.length > 0) {
            if (index < list.length) {
                console.log(list[index]);
                const ele = list[index];
                const customerName = ele.customerName ? ele.customerName : 'mealawe user'
                const msg = `Dear ${customerName}, your mealPackage end ${days}, kindly order on mealwe to continue.`;
                sendGenericFcmMessage(msg, ele.customerId, 'USER');
                index++;
                setTimeout(() => {
                    sendMealEndNotification(list, days, index);
                }, 500);
            }
        }
    } catch (e) {
        // console.log('erroe while getting food order ',e);
    }
}


const recheckPaymentValidationOrder = async () => {
    try {
        serverLog(`recheckPaymentValidationOrderCroneJob initialize`)
        const foodOrderList = await getPaymentValidationOrder();
        console.log('recheckPaymentValidationOrderCroneJob', foodOrderList.length);
        serverLog('recheckPaymentValidationOrderCroneJob', foodOrderList.length)
        const promiseArr = [];
        foodOrderList.forEach(order => {
            order.foodOrderId = order._id;
            // time check
            const currentTime = getLocalDate().getTime();
            const transactionTime = order.transactionTime ? order.transactionTime : order.orderDate;
            const orderTime = changeToLocalDate(transactionTime).getTime();
            let timeDiff = currentTime - orderTime;
            let timeDiffInMin = timeDiff / (1000 * 60);
            // console.log('recheckPaymentValidationOrder orderNo',order.orderNo,timeDiffInMin); 
            if (timeDiffInMin > 20) {
                serverLog('recheckPaymentValidationOrderCroneJob orderNo fail', order.orderNo, timeDiffInMin);
                console.log('recheckPaymentValidationOrderCroneJob orderNo fail', order.orderNo, timeDiffInMin);
                if (order.pgName === 'jusPay') {
                    promiseArr.push(validateCroneJusPayPaymentTransaction(order, true));
                } else {
                    promiseArr.push(validateCronePaytmPaymentTransaction(order, true));
                }
            } else {
                if (timeDiffInMin > 3) {
                    serverLog('recheckPaymentValidationOrderCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    console.log('recheckPaymentValidationOrderCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    if (order.pgName === 'jusPay') {
                        promiseArr.push(validateCroneJusPayPaymentTransaction(order, false));
                    } else {
                        promiseArr.push(validateCronePaytmPaymentTransaction(order, false));
                    }
                }
            }
        });
        await Promise.all(promiseArr);
    } catch (e) {
        console.log('erroe while recheckPaymentValidationOrder ', e);
    }
}

const recheckPaymentValidationOrderPacakge = async () => {
    try {
        const foodOrderList = await getPaymentValidationOrderPackage();
        serverLog('recheckPaymentValidationOrderPacakgeCroneJob', foodOrderList.length);
        console.log('recheckPaymentValidationOrderPacakgeCroneJob', foodOrderList.length);
        const promiseArr = [];
        foodOrderList.forEach(order => {
            order.foodOrderId = order._id;
            const currentTime = getLocalDate().getTime();
            const transactionTime = order.transactionTime ? order.transactionTime : order.orderDate;
            const orderTime = changeToLocalDate(transactionTime).getTime();
            let timeDiff = currentTime - orderTime;
            let timeDiffInMin = timeDiff / (1000 * 60);
            // console.log('recheckPaymentValidationOrderPacakge orderNo',order.orderNo,timeDiffInMin);      
            if (timeDiffInMin > 20) {
                serverLog('recheckPaymentValidationOrderPacakgeCroneJob orderNo fail', order.orderNo, timeDiffInMin);
                console.log('recheckPaymentValidationOrderPacakgeCroneJob orderNo fail', order.orderNo, timeDiffInMin);
                if (order.pgName === 'jusPay') {
                    promiseArr.push(validateCroneJusPayPaymentTransaction(order, true));
                } else {
                    promiseArr.push(validateCronePaytmPaymentTransaction(order, true));
                }
            } else {
                if (timeDiffInMin > 3) {
                    serverLog('recheckPaymentValidationOrderPacakgeCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    console.log('recheckPaymentValidationOrderPacakgeCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    if (order.pgName === 'jusPay') {
                        promiseArr.push(validateCroneJusPayPaymentTransaction(order, false));
                    } else {
                        promiseArr.push(validateCronePaytmPaymentTransaction(order, false));
                    }
                }
            }
        });
        await Promise.all(promiseArr);
    } catch (e) {
        console.log('erroe while recheckPaymentValidationOrderPacakge', e);
    }
}

const recheckBulkPaymentValidationOrder = async () => {
    try {
        const foodOrderList = await getPaymentBulkValidationOrder();
        serverLog('recheckPaymentBulkValidationOrderCroneJob', foodOrderList.length);
        console.log('recheckPaymentBulkValidationOrderCroneJob', foodOrderList.length);
        const promiseArr = [];
        foodOrderList.forEach(order => {
            order.foodOrderId = order._id;
            // time check
            const currentTime = getLocalDate().getTime();
            const transactionTime = order.transactionTime ? order.transactionTime : order.orderDate;
            const orderTime = changeToLocalDate(transactionTime).getTime();
            let timeDiff = currentTime - orderTime;
            let timeDiffInMin = timeDiff / (1000 * 60);
            // console.log('recheckPaymentBulkValidationOrder orderNo',order.orderNo,timeDiffInMin); 
            if (timeDiffInMin > 20) {
                serverLog('recheckPaymentBulkValidationOrderCroneJob orderNo fail', order.orderNo, timeDiffInMin);
                console.log('recheckPaymentBulkValidationOrderCroneJob orderNo fail', order.orderNo, timeDiffInMin);
                if (order.pgName === 'jusPay') {
                    promiseArr.push(validateCroneJusPayPaymentTransaction(order, true));
                } else {
                    promiseArr.push(validateCronePaytmPaymentTransaction(order, true));
                }
            } else {
                if (timeDiffInMin > 3) {
                    serverLog('recheckPaymentBulkValidationOrderCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    console.log('recheckPaymentBulkValidationOrderCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    if (order.pgName === 'jusPay') {
                        promiseArr.push(validateCroneJusPayPaymentTransaction(order, false));
                    } else {
                        promiseArr.push(validateCronePaytmPaymentTransaction(order, false));
                    }
                }
            }
        });
        await Promise.all(promiseArr);
    } catch (e) {
        console.log('erroe while recheckPaymentBulkValidationOrder ', e);
    }
}

const recheckMarketPlaceMainPaymentValidationOrder = async () => {
    try {
        const foodOrderList = await getPaymentMarketPlaceMainValidationOrder();
        serverLog('recheckMarketPlaceMainPaymentValidationOrderCroneJob', foodOrderList.length);
        console.log('recheckMarketPlaceMainPaymentValidationOrderCroneJob', foodOrderList.length);
        const promiseArr = [];
        foodOrderList.forEach(order => {
            order.foodOrderId = order._id;
            // time check
            const currentTime = getLocalDate().getTime();
            const transactionTime = order.transactionTime ? order.transactionTime : order.orderDate;
            const orderTime = changeToLocalDate(transactionTime).getTime();
            let timeDiff = currentTime - orderTime;
            let timeDiffInMin = timeDiff / (1000 * 60);
            // console.log('recheckPaymentBulkValidationOrder orderNo',order.orderNo,timeDiffInMin); 
            if (timeDiffInMin > 10) {
                serverLog('recheckMarketPlaceMainPaymentValidationOrder orderNo fail', order.orderNo, timeDiffInMin);
                console.log('recheckMarketPlaceMainPaymentValidationOrder orderNo fail', order.orderNo, timeDiffInMin);
                if (order.pgName === 'jusPay') {
                    promiseArr.push(validateCroneJusPayPaymentTransaction(order, true));
                } else {
                    promiseArr.push(validateCronePaytmPaymentTransaction(order, true));
                }
            } else {
                if (timeDiffInMin > 3) {
                    serverLog('recheckMarketPlaceMainPaymentValidationOrderCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    console.log('recheckMarketPlaceMainPaymentValidationOrderCroneJob orderNo pass', order.orderNo, timeDiffInMin);
                    if (order.pgName === 'jusPay') {
                        promiseArr.push(validateCroneJusPayPaymentTransaction(order, false));
                    } else {
                        promiseArr.push(validateCronePaytmPaymentTransaction(order, false));
                    }
                }
            }
        });
        await Promise.all(promiseArr);
    } catch (e) {
        console.log('erroe while recheckMarketPlaceMainPaymentValidationOrder ', e);
    }
}

const checkWooCommerceOrders = () => {
    try {
        if (process.env.PRODUCTION === 'true') {
            // console.log('calling checkWooCommerceOrders');
            getWooCommerceMealOrders();
        } else {
            // console.log('bypass calling checkWooCommerceOrders');
        }
    } catch (e) {
        // console.log('erroe while checkWooCommerceOrders cronjobutil',e);
    }
};



const croneJobs = async () => {
    try {
        serverLog("croneJobs created", cluster.isMaster);
        console.log("croneJobs created", cluster.isMaster);
        if (cluster.isMaster) {
            serverLog("croneJobs initialize");
            const asgResult = await isAutoScalingInstance();
            if (asgResult.isAutoScaling) {
                serverLog("This instance WAS started by an Auto Scaling Group");
                serverLog(`📋 Auto Scaling Group Name: ${asgResult.autoScalingGroupName}`);
            } else {
                serverLog(`this is main EC2 croneJobs Started`);
                console.log('this is main EC2 croneJobs Started');
                setInterval(() => {
                    fcmMessageInterval();
                    timeBasedCroneJobs();
                    // checkWooCommerceOrders();
                }, 1000 * 60 * 15);
                // setInterval(()=>{
                //     createDailyPidgeOrders();
                // }, 1000*60*60);

                setInterval(() => {
                    recheckPaymentValidationOrder();
                    recheckPaymentValidationOrderPacakge();
                    recheckBulkPaymentValidationOrder();
                    recheckMarketPlaceMainPaymentValidationOrder();
                }, 1000 * 60 * 1);
            }
        }
    } catch (error) {
        console.log('Error: isAutoScalingInstance', error.message);
    }
}
const cleanupPastMenuItemsCron = async (hour, minute) => {
    try {
        // Run cleanup daily at 2:00 AM (2:00-2:15 AM window)
        // You can change the hour to any time you prefer
        if (hour === 2 && minute > 0 && minute <= 15) {
            serverLog('═══════════════════════════════════════════');
            serverLog('🧹 SCHEDULED CLEANUP: Starting cleanup of past menu items...');
            // console.log('═══════════════════════════════════════════');
            // console.log('🧹 SCHEDULED CLEANUP: Starting cleanup of past menu items...');
            
            const result = await cleanupPastMenuItems();
            
            serverLog('✅ SCHEDULED CLEANUP COMPLETED:', JSON.stringify(result));
            serverLog(`📊 Deleted ${result.totalDeleted} items from ${result.menusProcessed} kitchens`);
            // console.log('✅ SCHEDULED CLEANUP COMPLETED:', result);
            // console.log(`📊 Deleted ${result.totalDeleted} items from ${result.menusProcessed} kitchens`);
            serverLog('═══════════════════════════════════════════');
            // console.log('═══════════════════════════════════════════');
        }
    } catch (e) {
        serverLog('❌ Error in cleanupPastMenuItemsCron:', e);
        console.log('❌ Error in cleanupPastMenuItemsCron:', e);
    }
};
// test TELECRM
// async function test(){
//     const mealEndList = await getSubscriptionEndDetails();
// }
// test();

module.exports = { croneJobs }