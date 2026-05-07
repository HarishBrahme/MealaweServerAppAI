const { getOneVariable } = require("../service/appConfigVariable.service");
const { getFoodOrder } = require('../dao/foodorder.dao');
const { getOrderPackage } = require('../dao/foodOrderPackage.dao');
const { getBulkFoodOrder } = require('../dao/bulkFoodOrder.dao');
const { getWalletBalance } = require("../service/userWallet.service");

global.KITCHEN_COMMISSION;
global.USER_CANCELLATION_CHARGE;
global.CANCELLATION_WALLET_DEDUCTION;
let CANCELLATION_WALLET_DEDUCTION=global.CANCELLATION_WALLET_DEDUCTION;

const getCancellationWalletDeduction = async () => {
    if (CANCELLATION_WALLET_DEDUCTION !== undefined) {
        return CANCELLATION_WALLET_DEDUCTION;
    }
    
    const config = await getOneVariable('CANCELLATION_WALLET_DEDUCTION');
    if (config && config.configData) {
        CANCELLATION_WALLET_DEDUCTION = parseInt(config.configData);
    } else {
        CANCELLATION_WALLET_DEDUCTION = parseInt(process.env.CANCELLATION_WALLET_DEDUCTION);
    }
    
    return CANCELLATION_WALLET_DEDUCTION;
};


const calculateRefundObj = async (foodOrderId, cancellationCharge, autoCancel, subscriptionOrder) => {
    let foodOrder;
    if (subscriptionOrder) {
        foodOrder = await getOrderPackage(foodOrderId);
    } else {
        foodOrder = await getFoodOrder(foodOrderId);
    }
    if(!foodOrder){
        foodOrder = await getBulkFoodOrder(foodOrderId);
    }
    const refundPercentage = (100 - cancellationCharge) / 100;
    const eligibiltyObj = { cancelEligible: false, refund_amount: 0, foodOrder,walletDeduction: 0,  // Add this
        netRefundAfterDeduction: 0  // Add this
 };
    if (foodOrder && foodOrder.refund_status !== 'completed') {
        let totalRefundAmt = foodOrder.amount;
        if (foodOrder.moneyWalletPointsUsed) {
            totalRefundAmt += foodOrder.moneyWalletPointsUsed;
        }
        if (foodOrder.mealaweWalletPointsUsed) {
            totalRefundAmt += foodOrder.mealaweWalletPointsUsed;
        }

const walletDeduction = await getCancellationWalletDeduction();
        eligibiltyObj.walletDeduction = walletDeduction;

         // ✅ ADD THIS NEW SECTION FOR APARTMENT ORDERS
            // ✅ APARTMENT ORDER LOGIC
         if ((foodOrder.orderType === 'apartment_today' || foodOrder.orderType === 'apartment_advance' || foodOrder.orderType === 'apartmentBulk') && 
            (foodOrder.orderstatus === 'placed' || foodOrder.orderstatus === 'accepted')) {
            
            const currentTime = new Date();
            let earliestServingDate = null;
            
            if (foodOrder.itemList && foodOrder.itemList.length > 0) {
                foodOrder.itemList.forEach(item => {
                    if (item.itemServingDate) {
                        const servingDate = new Date(item.itemServingDate);
                        if (!earliestServingDate || servingDate < earliestServingDate) {
                            earliestServingDate = servingDate;
                        }
                    }
                });
            }
            
            if (earliestServingDate) {
                const before1Day = new Date(earliestServingDate);
                before1Day.setDate(earliestServingDate.getDate() - 1);
                
                if (currentTime < before1Day) {
                    eligibiltyObj.cancelEligible = true;
                    
                    // Apply wallet deduction to total refund amount
                    const netRefund = Math.max(0, totalRefundAmt - walletDeduction);
                    eligibiltyObj.refund_amount = netRefund;
                    eligibiltyObj.netRefundAfterDeduction = netRefund;
                    
                    console.log(`✅ Apartment order cancellation allowed. Wallet deduction: ₹${walletDeduction}`);
                }
            }else if(foodOrder.orderType ==='apartmentBulk') {
                // Fallback logic
                const orderDate = new Date(foodOrder.deliveryDate);
                const daysDiff = Math.floor((orderDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff >= 2) {
                    eligibiltyObj.cancelEligible = true;
                    
                    // Apply wallet deduction
                    const netRefund = Math.max(0, totalRefundAmt - walletDeduction);
                    eligibiltyObj.refund_amount = netRefund;
                    eligibiltyObj.netRefundAfterDeduction = netRefund;
                }
            }
             else {
                // Fallback logic
                const orderDate = new Date(foodOrder.orderDate);
                const daysDiff = Math.floor((orderDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff >= 1) {
                    eligibiltyObj.cancelEligible = true;
                    
                    // Apply wallet deduction
                    const netRefund = Math.max(0, totalRefundAmt - walletDeduction);
                    eligibiltyObj.refund_amount = netRefund;
                    eligibiltyObj.netRefundAfterDeduction = netRefund;
                }
            }
            
            // Auto-cancel (full refund, no wallet deduction)
            if (autoCancel) {
                eligibiltyObj.cancelEligible = true;
                eligibiltyObj.refund_amount = totalRefundAmt;
                eligibiltyObj.walletDeduction = 0;  // No deduction for auto-cancel
                eligibiltyObj.netRefundAfterDeduction = totalRefundAmt;
            }
        }

       else if (foodOrder.orderType === 'advance' && (foodOrder.orderstatus === 'placed' || foodOrder.orderstatus === 'accepted')) {
            const currentTime = new Date();
            const completionDate = new Date(foodOrder.orderComplitionDate);
            if (currentTime.getDate() < completionDate.getDate()) {
                const refund_amount = Math.floor(totalRefundAmt * refundPercentage);
                eligibiltyObj.cancelEligible = true;
                eligibiltyObj.refund_amount = refund_amount;
            }
            if (autoCancel) {
                eligibiltyObj.cancelEligible = true;
                eligibiltyObj.refund_amount = totalRefundAmt;
            }
        } else if ((foodOrder.orderType === 'daily' || foodOrder.orderType === 'allDay') && foodOrder.orderstatus === 'placed') {
            const currentTime = new Date();
            const orderDate = new Date(foodOrder.orderDate);
            const timeDiff = currentTime.getTime() - orderDate.getTime();
            const timeDiffInMin = timeDiff / (1000 * 60);
            if (timeDiffInMin > 15) {
                eligibiltyObj.cancelEligible = true;
                eligibiltyObj.refund_amount = totalRefundAmt;
            }
            if (autoCancel) {
                eligibiltyObj.cancelEligible = true;
                eligibiltyObj.refund_amount = totalRefundAmt;
            }
        } else if (foodOrder.orderstatus === 'cancelledByKitchen' || foodOrder.orderstatus === 'rejectedByKitchen') {
            eligibiltyObj.cancelEligible = true;
            eligibiltyObj.refund_amount = totalRefundAmt;
        }
    }
    return eligibiltyObj;
}

const checkRefundEligibility = (foodOrderId, autoCancel, subscriptionOrder) => {
    return new Promise(async (resolve, reject) => {
        const DEFAULT_USER_CANCELLATION_CHARGE = process.env.DEFAULT_USER_CANCELLATION_CHARGE;
        try {
            if (global.USER_CANCELLATION_CHARGE) {
                const refundObj = await calculateRefundObj(foodOrderId, global.USER_CANCELLATION_CHARGE, autoCancel, subscriptionOrder);
                resolve(refundObj);
            } else {
                const appConfig = await getOneVariable('USER_CANCELLATION_CHARGE');
                if (appConfig && appConfig.configData) {
                    global.USER_CANCELLATION_CHARGE = parseInt(appConfig.configData);
                } else {
                    global.USER_CANCELLATION_CHARGE = parseInt(DEFAULT_USER_CANCELLATION_CHARGE);
                }
                const refundObj = await calculateRefundObj(foodOrderId, global.USER_CANCELLATION_CHARGE, autoCancel, subscriptionOrder);
                resolve(refundObj);
            }
        } catch (error) {
            // console.log('Error inside payment-validation-util.js function checkRefundEligibility ==> ', error);
            reject(error);
        }
    });
}

const getkitchenCommisionPercentage = () => {
    return new Promise(async (resolve, reject) => {
        const DEFAULT_COMMISSION_PERCENTAGE = process.env.DEFAULT_COMMISSION_PERCENTAGE;
        try {
            if (global.KITCHEN_COMMISSION) {
                resolve(global.KITCHEN_COMMISSION);
            } else {
                const appConfig = await getOneVariable('KITCHEN_COMMISSION');
                if (appConfig && appConfig.configData) {
                    global.KITCHEN_COMMISSION = parseInt(appConfig.configData);
                } else {
                    global.KITCHEN_COMMISSION = parseInt(DEFAULT_COMMISSION_PERCENTAGE);
                }
                resolve(global.KITCHEN_COMMISSION);
            }
        } catch (error) {
            // console.log('Error inside payment-validation-util.js function getCommisionAmount ==> ', error);
            resolve(DEFAULT_COMMISSION_PERCENTAGE);
        }
    });
};


module.exports = {
    checkRefundEligibility,
    getkitchenCommisionPercentage
}