const { getCustomerOrderDetail } = require('./../dao/foodorder.dao');
const { getCustomerProfile, validateReferralCode } = require('./../service/customerProfile.service');
const { createCashBack } = require('./user-wallet-util');
const { validateKitchenReferralCode } = require('./../dao/kitchenPartner.dao');
const { addKitchenMealawePointsInWallet } = require('./kitchen-ledger-wallet-util');
const FoodOrder = require('./../model/foodOrder.model');
const FoodOrderPackage = require('./../model/foodOrderPackage.model');
const bulkFoodOrder = require('./../model/bulkFoodOrder.model');

const checkUserFirstOrderReward = async (order) => {
    try {
        const previousOrders = await getCustomerOrderDetail(order.customerId, true);
        const customerTotalOrders = await checkCustomerTotalOrders(order.customerId);
        const moneyWalletUsed = order.moneyWalletPointsUsed ? order.moneyWalletPointsUsed : 0;
        const cashbackUsed = order.mealaweWalletPointsUsed ? order.mealaweWalletPointsUsed : 0;
        const orderValue = order.amount;
        let isFirstOrder = customerTotalOrders == 1;
        if (isFirstOrder && orderValue >= 499) {
            const orderingCustomer = await getCustomerProfile(order.customerId);
            if (orderingCustomer && orderingCustomer.installReferrer) {
                const referrer = await validateReferralCode(orderingCustomer.installReferrer);

                if (referrer && referrer.referrerId) {
                    const rewardPoints = 200;
                    const rewardPointsValidity = 30;      // expire after 30 days
                    createCashBack(referrer.referrerId, referrer.referrerName, referrer.referrerPhone, referrer.referrerEmail, rewardPoints, 'Referral bonus cashback', rewardPointsValidity);
                    createCashBack(order.customerId, order.customerName, order.customerPhoneNo, order.customerEmail, rewardPoints, 'Referral bonus cashback', rewardPointsValidity);
                }
            }
        } else {
            // *random cashback per order is resumed for now. uncomment to enable 
            // const percentages = [5,10,15,20];
            // let selectedPercentage = percentages[Math.floor(Math.random()*percentages.length)];
            // if(order.orderType === 'subscriptionPackage' && order.mealPackage && order.mealPackage.packageCategory === 'Trial'){
            //     selectedPercentage = 100;
            // }
            // const rewardPoints = Math.ceil(((order.mealaweTotalAmt + moneyWalletUsed + cashbackUsed )* selectedPercentage)/100);
            // createCashBack(order.customerId,order.customerName,order.customerPhoneNo,order.customerEmail,rewardPoints,`${selectedPercentage}% cashback on order no. ${order.orderNo}`); 
        }
       
    } catch (error) {
        // console.log('error while checkUserFirstOrderReward ', error);
    }
}

const checkKitchenEnrollReward = async (installReferrer) => {
    try {
        const referrer = await validateKitchenReferralCode(installReferrer);
        if (referrer && referrer.referrerId) {
            addKitchenMealawePointsInWallet(referrer.referrerId, referrer.referrerName, 100,
                `Referral bonus`);
        }
    } catch (error) {
        // console.log('error while checkUserFirstOrderReward ',error);
    }
}

const checkCustomerTotalOrders = async (customerId) => {
    try {
        const [foodOrderCount, foodOrderPackageCount, bulkFoodOrderCount] = await Promise.all([
            FoodOrder.countDocuments({ customerId, orderstatus: { $nin: ['paymentInprogress', 'paymentFailed'] } }),
            FoodOrderPackage.countDocuments({ customerId, orderstatus: { $nin: ['paymentInprogress', 'paymentFailed'] } }),
            bulkFoodOrder.countDocuments({ customerId, orderstatus: { $nin: ['paymentInprogress', 'paymentFailed'] } }),
        ]);

        const totalCount = foodOrderCount + foodOrderPackageCount + bulkFoodOrderCount;
        return totalCount;
    } catch (error) {
        // console.log('error while fetching customers all orders', error)
    }
}

module.exports = {
    checkUserFirstOrderReward,
    checkKitchenEnrollReward
}